import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { listSegments } from "@/lib/api/segments.functions";
import { createAndSendCampaign, generateMessageVariants, listCampaigns, getCampaignDetail } from "@/lib/api/campaigns.functions";

export const Route = createFileRoute("/_authenticated/campaigns")({
  component: CampaignsPage,
});

function CampaignsPage() {
  const qc = useQueryClient();
  const segsFn = useServerFn(listSegments);
  const campFn = useServerFn(listCampaigns);
  const detailFn = useServerFn(getCampaignDetail);
  const sendFn = useServerFn(createAndSendCampaign);
  const variantsFn = useServerFn(generateMessageVariants);

  const segments = useQuery({ queryKey: ["segments"], queryFn: () => segsFn() });
  const campaigns = useQuery({ queryKey: ["campaigns"], queryFn: () => campFn() });

  const [segmentId, setSegmentId] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("Hi {{name}}, here's 10% off just for you.");
  const [objective, setObjective] = useState("");
  const [variants, setVariants] = useState<Array<{ tone: string; message: string }>>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const gen = useMutation({
    mutationFn: () => variantsFn({ data: { objective } }),
    onSuccess: (r: any) => setVariants(r.variants ?? []),
    onError: (e: any) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: () => sendFn({ data: { name, segment_id: segmentId, message } }),
    onSuccess: (r: any) => {
      toast.success(`Sent: ${r.delivered}/${r.audience} delivered, ${r.failed} failed`);
      setName(""); setMessage("Hi {{name}}, here's 10% off just for you.");
      qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const detail = useQuery({
    queryKey: ["campaign-detail", selectedCampaign],
    queryFn: () => detailFn({ data: { id: selectedCampaign! } }),
    enabled: !!selectedCampaign,
  });

  const toneColors: Record<string, string> = {
    friendly: "bg-[#A8E6CF]", urgent: "bg-[#FFB4A2]", value: "bg-[#FFD93D]",
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div>
        <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">Outbound</div>
        <h1 className="text-4xl font-black tracking-tight">Campaigns 📣</h1>
        <p className="text-sm text-[#1a1a2e]/60 mt-1">Pick a segment, draft a message, send.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* New campaign */}
        <div className="bg-white rounded-3xl p-6 border-2 border-black/10">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-xl bg-[#FFD93D] flex items-center justify-center">
              <Megaphone className="h-4 w-4 text-[#1a1a2e]" />
            </div>
            <h3 className="font-black text-lg">New campaign</h3>
          </div>
          <div className="space-y-3">
            <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)}
              className="rounded-full h-11 border-black/10 bg-[#FFF8F2]" />
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger className="rounded-full h-11 border-black/10 bg-[#FFF8F2]">
                <SelectValue placeholder="Select a segment" />
              </SelectTrigger>
              <SelectContent>
                {(segments.data ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.audience_size})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Message (use {{name}} for personalization)"
              className="rounded-2xl border-black/10 bg-[#FFF8F2]" />
            <Button onClick={() => send.mutate()} disabled={send.isPending || !name || !segmentId}
              className="w-full bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full h-11 font-semibold gap-2">
              <Send className="h-4 w-4" />
              {send.isPending ? "Sending…" : "Send campaign"}
            </Button>
          </div>
        </div>

        {/* AI variants */}
        <div className="bg-[#6C5CE7] text-white rounded-3xl p-6 border-2 border-black/10 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#A8E6CF] rounded-full blur-2xl opacity-40" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-9 w-9 rounded-xl bg-[#FFD93D] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#1a1a2e]" />
              </div>
              <h3 className="font-black text-lg">AI message variants</h3>
            </div>
            <p className="text-sm text-white/70 mb-4">Describe the goal — get 3 on-brand drafts.</p>
            <Input placeholder="e.g. win back lapsed customers with 15% off"
              value={objective} onChange={(e) => setObjective(e.target.value)}
              className="rounded-full h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-[#FFD93D]" />
            <Button onClick={() => gen.mutate()} disabled={gen.isPending || !objective.trim()}
              className="mt-3 bg-[#FFD93D] hover:bg-[#FFE45D] text-[#1a1a2e] rounded-full h-11 font-bold gap-2">
              <Sparkles className="h-4 w-4" /> {gen.isPending ? "Drafting…" : "Generate 3 variants"}
            </Button>
            <div className="space-y-2 mt-4">
              {variants.map((v, i) => (
                <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`${toneColors[v.tone] ?? "bg-white"} text-[#1a1a2e] text-xs font-bold px-2.5 py-0.5 rounded-full`}>
                      {v.tone}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setMessage(v.message)}
                      className="text-white hover:bg-white/10 h-7 rounded-full">
                      Use
                    </Button>
                  </div>
                  <div className="text-white/90">{v.message}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border-2 border-black/10">
        <h3 className="font-black text-lg mb-4">Campaign history</h3>
        <div className="space-y-2">
          {(campaigns.data ?? []).map((c: any) => {
            const rate = c.audience_size ? Math.round((c.delivered_count / c.audience_size) * 100) : 0;
            const isOpen = selectedCampaign === c.id;
            return (
              <div key={c.id} className="border-2 border-black/5 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setSelectedCampaign(isOpen ? null : c.id)}
                  className="w-full text-left p-4 hover:bg-[#FFF8F2]/70 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-[#1a1a2e]/60">
                      {c.segments?.name ?? "—"} • {new Date(c.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="bg-[#C8B6FF] text-[#1a1a2e] px-3 py-1 rounded-full">Audience {c.audience_size}</span>
                    <span className="bg-[#A8E6CF] text-[#1a1a2e] px-3 py-1 rounded-full">Delivered {c.delivered_count}</span>
                    <span className="bg-[#FFB4A2] text-[#1a1a2e] px-3 py-1 rounded-full">Failed {c.failed_count}</span>
                    <span className="bg-[#1a1a2e] text-white px-3 py-1 rounded-full">{rate}%</span>
                  </div>
                </button>
                {isOpen && detail.data && (
                  <div className="px-4 pb-4 border-t border-black/5 pt-3">
                    <div className="text-xs font-bold mb-2 uppercase tracking-wider text-[#1a1a2e]/60">Delivery log (latest 100)</div>
                    <div className="max-h-80 overflow-auto space-y-1 text-xs">
                      {detail.data.communications.map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between border-b border-black/5 py-1.5 gap-2">
                          <span className="text-[#1a1a2e]/70 truncate min-w-0">
                            <b className="text-[#1a1a2e]">{m.customers?.name ?? m.customers?.email}</b> — {m.rendered_message}
                          </span>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.status === "DELIVERED" ? "bg-[#A8E6CF] text-[#1a1a2e]" :
                            m.status === "FAILED" ? "bg-[#FFB4A2] text-[#1a1a2e]" :
                            "bg-[#FFD93D] text-[#1a1a2e]"
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {(campaigns.data ?? []).length === 0 && (
            <div className="text-sm text-[#1a1a2e]/50 text-center py-6">No campaigns yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
