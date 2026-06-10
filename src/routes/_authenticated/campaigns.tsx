import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-muted-foreground">Pick a segment, draft a message, send.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>New campaign</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Campaign name" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger><SelectValue placeholder="Select a segment" /></SelectTrigger>
              <SelectContent>
                {(segments.data ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.audience_size})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message (use {{name}} for personalization)" />
            <Button onClick={() => send.mutate()} disabled={send.isPending || !name || !segmentId}>
              {send.isPending ? "Sending…" : "Send campaign"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI message variants</CardTitle>
            <CardDescription>Describe the goal — pick a tone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Objective (e.g. win back lapsed customers with 15% off)" value={objective} onChange={(e) => setObjective(e.target.value)} />
            <Button onClick={() => gen.mutate()} disabled={gen.isPending || !objective.trim()}>
              {gen.isPending ? "Drafting…" : "Generate 3 variants"}
            </Button>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="border rounded-md p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{v.tone}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => setMessage(v.message)}>Use</Button>
                  </div>
                  <div>{v.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Campaign history</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(campaigns.data ?? []).map((c: any) => {
            const rate = c.audience_size ? Math.round((c.delivered_count / c.audience_size) * 100) : 0;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCampaign(c.id === selectedCampaign ? null : c.id)}
                className="w-full text-left border rounded-md p-3 hover:bg-accent flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.segments?.name ?? "—"} • {new Date(c.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  <Badge>Audience {c.audience_size}</Badge>
                  <Badge variant="secondary">Delivered {c.delivered_count}</Badge>
                  <Badge variant="destructive">Failed {c.failed_count}</Badge>
                  <Badge variant="outline">{rate}%</Badge>
                </div>
              </button>
            );
          })}
          {(campaigns.data ?? []).length === 0 && <div className="text-sm text-muted-foreground">No campaigns yet.</div>}

          {selectedCampaign && detail.data && (
            <div className="mt-4 border-t pt-4">
              <div className="text-sm font-medium mb-2">Per-message delivery log (latest 100)</div>
              <div className="max-h-96 overflow-auto space-y-1 text-xs">
                {detail.data.communications.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between border-b py-1">
                    <span className="text-muted-foreground truncate max-w-md">
                      <b>{m.customers?.name ?? m.customers?.email}</b> — {m.rendered_message}
                    </span>
                    <Badge variant={m.status === "DELIVERED" ? "secondary" : m.status === "FAILED" ? "destructive" : "outline"}>
                      {m.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
