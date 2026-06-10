import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { planAgentAction } from "@/lib/api/agent.functions";
import { createSegment } from "@/lib/api/segments.functions";
import { createAndSendCampaign } from "@/lib/api/campaigns.functions";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; meta?: any };

function ChatPage() {
  const qc = useQueryClient();
  const planFn = useServerFn(planAgentAction);
  const createSegFn = useServerFn(createSegment);
  const sendFn = useServerFn(createAndSendCampaign);

  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi — I'm your CRM agent. Try: \"Create a winback segment for customers inactive 60+ days\" or \"Send 10% off to high spenders\"." },
  ]);
  const [input, setInput] = useState("");
  const [pendingSegmentId, setPendingSegmentId] = useState<string | null>(null);

  const plan = useMutation({
    mutationFn: async (prompt: string) => {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      return planFn({ data: { prompt, history } });
    },
    onSuccess: async (action: any) => {
      setMessages((m) => [...m, { role: "assistant", content: action.reply, meta: action }]);

      if (action.action === "create_segment" && action.rules) {
        try {
          const seg: any = await createSegFn({
            data: {
              name: action.segment_name ?? "AI segment",
              description: "Created by agent",
              rules: action.rules,
            },
          });
          setPendingSegmentId(seg.id);
          setMessages((m) => [...m, { role: "assistant", content: `Saved segment "${seg.name}" — ${seg.audience_size} customers match. Tell me what message to send.` }]);
          qc.invalidateQueries({ queryKey: ["segments"] });
        } catch (e: any) { toast.error(e.message); }
      }

      if (action.action === "send_campaign" && action.message && pendingSegmentId) {
        try {
          const r: any = await sendFn({
            data: {
              name: action.campaign_name ?? "Agent campaign",
              segment_id: pendingSegmentId,
              message: action.message,
            },
          });
          setMessages((m) => [...m, { role: "assistant", content: `Done — ${r.delivered}/${r.audience} delivered, ${r.failed} failed.` }]);
          setPendingSegmentId(null);
          qc.invalidateQueries({ queryKey: ["campaigns"] });
        } catch (e: any) { toast.error(e.message); }
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const prompt = input.trim();
    setMessages((m) => [...m, { role: "user", content: prompt }]);
    setInput("");
    plan.mutate(prompt);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto h-screen flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-5 w-5" /> Agent</h1>
        <p className="text-sm text-muted-foreground">Chat-first interface — describe a goal, the agent plans + executes.</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <div>{m.content}</div>
                {m.meta?.action && m.meta.action !== "clarify" && (
                  <Badge variant="outline" className="mt-2 text-[10px]">{m.meta.action}</Badge>
                )}
              </div>
            </div>
          ))}
          {plan.isPending && <div className="text-xs text-muted-foreground">Agent thinking…</div>}
        </CardContent>
        <form onSubmit={submit} className="border-t p-3 flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the agent…" disabled={plan.isPending} />
          <Button type="submit" disabled={plan.isPending || !input.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      </Card>
    </div>
  );
}
