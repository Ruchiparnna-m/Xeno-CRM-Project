import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Rule schema: { op: 'AND'|'OR', conditions: [{ field, operator, value }] }
// fields: total_spend, visit_count, days_inactive
// operators: >, <, >=, <=, =, !=

const ConditionSchema = z.object({
  field: z.enum(["total_spend", "visit_count", "days_inactive"]),
  operator: z.enum([">", "<", ">=", "<=", "=", "!="]),
  value: z.number(),
});

const RulesSchema: z.ZodType<{ op: "AND" | "OR"; conditions: Array<z.infer<typeof ConditionSchema>> }> = z.object({
  op: z.enum(["AND", "OR"]),
  conditions: z.array(ConditionSchema),
});

export type Rules = z.infer<typeof RulesSchema>;

function buildSupabaseFilter(query: any, rules: Rules) {
  // Apply conditions client-side after fetch since days_inactive is computed
  return query;
}

function customerMatches(c: any, rules: Rules): boolean {
  if (rules.conditions.length === 0) return true;
  const evalCond = (cond: z.infer<typeof ConditionSchema>) => {
    let lhs: number;
    if (cond.field === "total_spend") lhs = Number(c.total_spend ?? 0);
    else if (cond.field === "visit_count") lhs = Number(c.visit_count ?? 0);
    else {
      const last = c.last_active_at ? new Date(c.last_active_at).getTime() : 0;
      lhs = last ? Math.floor((Date.now() - last) / (1000 * 60 * 60 * 24)) : 99999;
    }
    const rhs = cond.value;
    switch (cond.operator) {
      case ">": return lhs > rhs;
      case "<": return lhs < rhs;
      case ">=": return lhs >= rhs;
      case "<=": return lhs <= rhs;
      case "=": return lhs === rhs;
      case "!=": return lhs !== rhs;
    }
  };
  return rules.op === "AND" ? rules.conditions.every(evalCond) : rules.conditions.some(evalCond);
}

export const previewSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ rules: RulesSchema }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id,name,email,total_spend,visit_count,last_active_at")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    const matched = (customers ?? []).filter((c) => customerMatches(c, data.rules));
    return { count: matched.length, sample: matched.slice(0, 5) };
  });

export const createSegment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ name: z.string().min(1), description: z.string().optional(), rules: RulesSchema }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: customers } = await supabase
      .from("customers")
      .select("id,total_spend,visit_count,last_active_at")
      .eq("user_id", userId);
    const audience = (customers ?? []).filter((c) => customerMatches(c, data.rules)).length;
    const { data: seg, error } = await supabase
      .from("segments")
      .insert({
        user_id: userId,
        name: data.name,
        description: data.description ?? null,
        rules: data.rules,
        audience_size: audience,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return seg;
  });

export const listSegments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("segments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const naturalLanguageToRules = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ prompt: z.string().min(3) }).parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const system = `You convert a marketing audience description into JSON rules.
Available fields: total_spend (number, INR), visit_count (number), days_inactive (number of days since last activity).
Operators: ">", "<", ">=", "<=", "=", "!=".
Output STRICT JSON only with shape: {"op":"AND"|"OR","conditions":[{"field":"...","operator":"...","value":number}], "name": "short label", "description": "one-line"}.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: data.prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI gateway error ${res.status}: ${t}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return parsed as {
      op: "AND" | "OR";
      conditions: Array<{ field: string; operator: string; value: number }>;
      name?: string;
      description?: string;
    };
  });
