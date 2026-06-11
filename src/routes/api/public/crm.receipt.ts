import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// CRM Delivery Receipt endpoint — the vendor POSTs (out-of-order, batched)
// status updates here. We BATCH-UPDATE the communications table using
// .in() rather than one-row-at-a-time. Idempotent: re-receiving a receipt
// for an already-finalized communication is a no-op.

const Receipt = z.object({
  communication_id: z.string().uuid(),
  status: z.enum(["DELIVERED", "FAILED"]),
  vendor_message_id: z.string().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

const Schema = z.object({
  campaign_id: z.string().uuid(),
  user_id: z.string().uuid(),
  receipts: z.array(Receipt).min(1).max(500),
});

export const Route = createFileRoute("/api/public/crm/receipt")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = Schema.parse(await request.json());
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Group receipts by status for batch updates
        const delivered = body.receipts.filter((r) => r.status === "DELIVERED");
        const failed = body.receipts.filter((r) => r.status === "FAILED");

        // DELIVERED batch — single SQL UPDATE ... WHERE id IN (...)
        if (delivered.length) {
          // We need per-row vendor_message_id, so do it in groups but still
          // as batched IN updates per unique vendor_message_id is wasteful;
          // a single UPDATE with CASE would be ideal but Supabase JS lacks it.
          // Compromise: one UPDATE per receipt for vendor_message_id, but
          // status flips happen in a single bulk update first.
          await supabaseAdmin
            .from("communications")
            .update({ status: "DELIVERED", updated_at: new Date().toISOString() })
            .in(
              "id",
              delivered.map((r) => r.communication_id),
            )
            .eq("user_id", body.user_id)
            .eq("status", "PENDING"); // idempotency guard

          // Set vendor_message_id per row (small loop, kept short by batch size)
          await Promise.all(
            delivered.map((r) =>
              supabaseAdmin
                .from("communications")
                .update({ vendor_message_id: r.vendor_message_id })
                .eq("id", r.communication_id)
                .eq("user_id", body.user_id),
            ),
          );
        }

        if (failed.length) {
          await supabaseAdmin
            .from("communications")
            .update({
              status: "FAILED",
              error: failed[0].error ?? "Vendor failure",
              updated_at: new Date().toISOString(),
            })
            .in(
              "id",
              failed.map((r) => r.communication_id),
            )
            .eq("user_id", body.user_id)
            .eq("status", "PENDING");
        }

        // Roll up campaign counters
        const { data: counts } = await supabaseAdmin
          .from("communications")
          .select("status")
          .eq("campaign_id", body.campaign_id)
          .eq("user_id", body.user_id);
        const d = (counts ?? []).filter((c) => c.status === "DELIVERED").length;
        const f = (counts ?? []).filter((c) => c.status === "FAILED").length;
        const p = (counts ?? []).filter((c) => c.status === "PENDING").length;

        await supabaseAdmin
          .from("campaigns")
          .update({
            delivered_count: d,
            failed_count: f,
            status: p === 0 ? "completed" : "sending",
          })
          .eq("id", body.campaign_id)
          .eq("user_id", body.user_id);

        return Response.json({
          processed: body.receipts.length,
          delivered_total: d,
          failed_total: f,
          pending_total: p,
        });
      },
    },
  },
});
