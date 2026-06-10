import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function renderMessage(template: string, customer: { name?: string | null }) {
  return template.replace(/\{\{\s*name\s*\}\}/gi, customer.name ?? "there");
}

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("campaigns")
      .select("*, segments(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCampaignDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*, segments(name)")
      .eq("user_id", userId)
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    const { data: comms } = await supabase
      .from("communications")
      .select("*, customers(name,email)")
      .eq("user_id", userId)
      .eq("campaign_id", data.id)
      .order("created_at", { ascending: false })
      .limit(100);
    return { campaign, communications: comms ?? [] };
  });

// Re-use rule eval logic
function customerMatches(c: any, rules: any): boolean {
  if (!rules?.conditions?.length) return true;
  const evalCond = (cond: any) => {
    let lhs: number;
    if (cond.field === "total_spend") lhs = Number(c.total_spend ?? 0);
    else if (cond.field === "visit_count") lhs = Number(c.visit_count ?? 0);
    else {
      const last = c.last_active_at ? new Date(c.last_active_at).getTime() : 0;
      lhs = last ? Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24)) : 99999;
    }
    switch (cond.operator) {
      case ">": return lhs > cond.value;
      case "<": return lhs < cond.value;
      case ">=": return lhs >= cond.value;
      case "<=": return lhs <= cond.value;
      case "=": return lhs === cond.value;
      case "!=": return lhs !== cond.value;
    }
    return false;
  };
  return rules.op === "OR" ? rules.conditions.some(evalCond) : rules.conditions.every(evalCond);
}

export const createAndSendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      name: z.string().min(1),
      segment_id: z.string().uuid(),
      message: z.string().min(3),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Load segment + customers
    const { data: segment, error: segErr } = await supabase
      .from("segments")
      .select("*")
      .eq("user_id", userId)
      .eq("id", data.segment_id)
      .single();
    if (segErr) throw new Error(segErr.message);
    const { data: customers } = await supabase
      .from("customers")
      .select("id,name,email,total_spend,visit_count,last_active_at")
      .eq("user_id", userId);
    const matched = (customers ?? []).filter((c) => customerMatches(c, segment.rules));

    // Create campaign
    const { data: campaign, error: cErr } = await supabase
      .from("campaigns")
      .insert({
        user_id: userId,
        segment_id: segment.id,
        name: data.name,
        message: data.message,
        status: "sending",
        audience_size: matched.length,
      })
      .select()
      .single();
    if (cErr) throw new Error(cErr.message);

    if (matched.length === 0) {
      await supabase.from("campaigns").update({ status: "completed" }).eq("id", campaign.id);
      return { campaign_id: campaign.id, audience: 0, delivered: 0, failed: 0 };
    }

    // Insert communications PENDING
    const commsRows = matched.map((c) => ({
      user_id: userId,
      campaign_id: campaign.id,
      customer_id: c.id,
      rendered_message: renderMessage(data.message, c),
      status: "PENDING",
    }));
    const { data: insertedComms, error: ciErr } = await supabase.from("communications").insert(commsRows).select("id,customer_id,rendered_message");
    if (ciErr) throw new Error(ciErr.message);

    // Simulate stubbed vendor: 90% delivered / 10% failed, batch update
    const delivered: string[] = [];
    const failed: string[] = [];
    for (const c of insertedComms ?? []) {
      if (Math.random() < 0.9) delivered.push(c.id);
      else failed.push(c.id);
    }

    // Batch updates
    if (delivered.length) {
      await supabase
        .from("communications")
        .update({
          status: "DELIVERED",
          vendor_message_id: `vendor_${Math.random().toString(36).slice(2, 10)}`,
          updated_at: new Date().toISOString(),
        })
        .in("id", delivered);
    }
    if (failed.length) {
      await supabase
        .from("communications")
        .update({
          status: "FAILED",
          error: "Simulated vendor failure",
          updated_at: new Date().toISOString(),
        })
        .in("id", failed);
    }

    await supabase
      .from("campaigns")
      .update({
        status: "completed",
        sent_count: matched.length,
        delivered_count: delivered.length,
        failed_count: failed.length,
      })
      .eq("id", campaign.id);

    return {
      campaign_id: campaign.id,
      audience: matched.length,
      delivered: delivered.length,
      failed: failed.length,
    };
  });

export const generateMessageVariants = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ objective: z.string().min(3), audience: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const system = `You write short, punchy D2C marketing SMS/email messages.
Return STRICT JSON: {"variants":[{"tone":"...","message":"..."},...]} with exactly 3 variants (friendly, urgent, value-focused).
Each message under 160 characters. Use {{name}} as the personalization placeholder.`;
    const userMsg = `Objective: ${data.objective}\nAudience hint: ${data.audience ?? "general customers"}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI gateway error ${res.status}`);
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
    return parsed as { variants: Array<{ tone: string; message: string }> };
  });
