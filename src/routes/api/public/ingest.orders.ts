import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const OrderSchema = z.object({
  customer_id: z.string().uuid().optional(),
  customer_email: z.string().email().optional(),
  amount: z.number().nonnegative(),
  status: z.string().optional(),
});

const BodySchema = z.union([OrderSchema, z.object({ orders: z.array(OrderSchema).max(1000) })]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export const Route = createFileRoute("/api/public/ingest/orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        if (!token) return new Response("Missing bearer token", { status: 401, headers: cors });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userRes, error: uErr } = await supabaseAdmin.auth.getUser(token);
        if (uErr || !userRes?.user) return new Response("Invalid token", { status: 401, headers: cors });
        const userId = userRes.user.id;

        const parsed = BodySchema.parse(await request.json());
        const inputs = "orders" in parsed ? parsed.orders : [parsed];

        // Resolve customer_id by email if necessary
        const rows: Array<{ user_id: string; customer_id: string; amount: number; status: string }> = [];
        for (const o of inputs) {
          let customerId = o.customer_id;
          if (!customerId && o.customer_email) {
            const { data: c } = await supabaseAdmin
              .from("customers")
              .select("id")
              .eq("user_id", userId)
              .eq("email", o.customer_email)
              .maybeSingle();
            if (!c) continue;
            customerId = c.id;
          }
          if (!customerId) continue;
          rows.push({
            user_id: userId,
            customer_id: customerId,
            amount: o.amount,
            status: o.status ?? "completed",
          });
        }

        if (!rows.length) return Response.json({ inserted: 0 }, { headers: cors });

        const { data, error } = await supabaseAdmin.from("orders").insert(rows).select("id");
        if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });

        // Bump total_spend / visit_count / last_active_at on the customers
        const byCustomer = new Map<string, number>();
        for (const r of rows) byCustomer.set(r.customer_id, (byCustomer.get(r.customer_id) ?? 0) + r.amount);
        await Promise.all(
          Array.from(byCustomer.entries()).map(async ([cid, amt]) => {
            const { data: cur } = await supabaseAdmin
              .from("customers")
              .select("total_spend,visit_count")
              .eq("id", cid)
              .single();
            await supabaseAdmin
              .from("customers")
              .update({
                total_spend: Number(cur?.total_spend ?? 0) + amt,
                visit_count: Number(cur?.visit_count ?? 0) + 1,
                last_active_at: new Date().toISOString(),
              })
              .eq("id", cid);
          }),
        );

        return Response.json({ inserted: data?.length ?? 0 }, { headers: cors });
      },
    },
  },
});
