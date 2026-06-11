import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const campaignInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id,name,audience_size,sent_count,delivered_count,failed_count,status,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    const totals = (campaigns ?? []).reduce(
      (acc, c) => {
        acc.audience += c.audience_size ?? 0;
        acc.delivered += c.delivered_count ?? 0;
        acc.failed += c.failed_count ?? 0;
        return acc;
      },
      { audience: 0, delivered: 0, failed: 0 },
    );

    const { data: segments } = await supabase
      .from("segments")
      .select("id,name,audience_size,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    return { campaigns: campaigns ?? [], segments: segments ?? [], totals };
  });
