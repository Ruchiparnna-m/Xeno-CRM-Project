import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Public customer ingestion API.
// Auth: caller sends their Supabase user access token as `Authorization: Bearer <token>`.
// We validate the token server-side via the admin client's auth.getUser(token)
// and then write with the admin client (RLS-bypass safe because we scoped user_id).

const CustomerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  total_spend: z.number().nonnegative().optional(),
  visit_count: z.number().int().nonnegative().optional(),
  last_active_at: z.string().datetime().optional(),
});

const BodySchema = z.union([CustomerSchema, z.object({ customers: z.array(CustomerSchema).max(1000) })]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

export const Route = createFileRoute("/api/public/ingest/customers")({
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
        const rows = ("customers" in parsed ? parsed.customers : [parsed]).map((c) => ({
          user_id: userId,
          ...c,
        }));

        const { data, error } = await supabaseAdmin.from("customers").insert(rows).select("id,email");
        if (error) return Response.json({ error: error.message }, { status: 400, headers: cors });
        return Response.json({ inserted: data?.length ?? 0, customers: data }, { headers: cors });
      },
    },
  },
});
