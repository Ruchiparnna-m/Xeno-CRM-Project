import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Lightweight agent: interprets a user prompt, plans an action JSON, and (optionally) executes.
// Actions supported: create_segment, send_campaign, summarize.

const ActionSchema = z.object({
  action: z.enum(["create_segment", "send_campaign", "summarize", "clarify"]),
  segment_name: z.string().optional(),
  rules: z
    .object({
      op: z.enum(["AND", "OR"]),
      conditions: z.array(
        z.object({
          field: z.enum(["total_spend", "visit_count", "days_inactive"]),
          operator: z.enum([">", "<", ">=", "<=", "=", "!="]),
          value: z.number(),
        }),
      ),
    })
    .optional(),
  campaign_name: z.string().optional(),
  message: z.string().optional(),
  reply: z.string(),
});

export const planAgentAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ prompt: z.string().min(2), history: z.array(z.object({ role: z.string(), content: z.string() })).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    // Get quick context
    const { count: customerCount } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    const system = `You are an autonomous CRM agent for a D2C brand.
Decide the next action based on the user's request.
Return STRICT JSON only matching this shape:
{
  "action": "create_segment" | "send_campaign" | "summarize" | "clarify",
  "segment_name": "string (if creating)",
  "rules": { "op":"AND"|"OR", "conditions":[{"field":"total_spend"|"visit_count"|"days_inactive","operator":">"|"<"|">="|"<="|"="|"!=", "value": number}] },
  "campaign_name": "string (if sending)",
  "message": "string (with {{name}} placeholder)",
  "reply": "Friendly human-readable explanation of what you're doing"
}
Context: workspace has ${customerCount ?? 0} customers.
If the user wants to send a campaign to an ad-hoc audience, create_segment first with reasonable rules — the orchestrator will chain into send_campaign on the next turn if they confirm.
If unclear, use action "clarify" and put your question in "reply".`;

    const messages = [
      { role: "system", content: system },
      ...(data.history ?? []),
      { role: "user", content: data.prompt },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = await res.json();
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = ActionSchema.parse(JSON.parse(raw));
    return parsed;
  });
