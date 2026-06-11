import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Stubbed vendor API — receives a send batch, simulates async processing,
// and POSTs delivery receipts back to the CRM receipt endpoint.
// 90% delivered, 10% failed (per assignment spec).

const BatchSchema = z.object({
  campaign_id: z.string().uuid(),
  user_id: z.string().uuid(),
  callback_url: z.string().url(),
  messages: z.array(
    z.object({
      communication_id: z.string().uuid(),
      to: z.string().optional(),
      body: z.string(),
    }),
  ),
});

async function processBatch(batch: z.infer<typeof BatchSchema>) {
  // Simulate vendor processing with small randomized delays per message,
  // then POST receipts back to the CRM in micro-batches (out of order).
  const receipts: Array<{
    communication_id: string;
    status: "DELIVERED" | "FAILED";
    vendor_message_id?: string;
    error?: string;
    timestamp: string;
  }> = [];

  for (const m of batch.messages) {
    // Random per-message latency 5-50ms
    await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 45) + 5));
    const ok = Math.random() < 0.9;
    receipts.push({
      communication_id: m.communication_id,
      status: ok ? "DELIVERED" : "FAILED",
      vendor_message_id: ok ? `vnd_${Math.random().toString(36).slice(2, 10)}` : undefined,
      error: ok ? undefined : "Simulated vendor failure",
      timestamp: new Date().toISOString(),
    });
  }

  // Shuffle to simulate out-of-order delivery
  receipts.sort(() => Math.random() - 0.5);

  // Chunk into micro-batches of 25 and POST back
  for (let i = 0; i < receipts.length; i += 25) {
    const chunk = receipts.slice(i, i + 25);
    try {
      await fetch(batch.callback_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: batch.campaign_id,
          user_id: batch.user_id,
          receipts: chunk,
        }),
      });
    } catch {
      // Vendor would retry — for the demo we drop and move on
    }
  }
}

export const Route = createFileRoute("/api/public/vendor/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = BatchSchema.parse(await request.json());
        // Fire-and-forget vendor processing. We return immediately so the
        // CRM doesn't block on the simulated vendor latency.
        processBatch(body).catch((e) => console.error("vendor processBatch error", e));
        return Response.json({ accepted: body.messages.length, status: "queued" });
      },
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "content-type",
          },
        }),
    },
  },
});
