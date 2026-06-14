import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    { role: "assistant", content: "Hi! I'm your CRM agent ✨ Try: \"Create a winback segment for customers inactive 60+ days\" or \"Send 10% off to high spenders\"." },
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
            data: { name: action.segment_name ?? "AI segment", description: "Created by agent", rules: action.rules },
          });
          setPendingSegmentId(seg.id);
          setMessages((m) => [...m, { role: "assistant", content: `Saved segment "${seg.name}" — ${seg.audience_size} customers match. Tell me what message to send.` }]);
          qc.invalidateQueries({ queryKey: ["segments"] });
        } catch (e: any) { toast.error(e.message); }
      }

      if (action.action === "send_campaign" && action.message && pendingSegmentId) {
        try {
          const r: any = await sendFn({
            data: { name: action.campaign_name ?? "Agent campaign", segment_id: pendingSegmentId, message: action.message },
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

  const suggestions = [
    "Create a winback segment for customers inactive 60+ days",
    "Find high spenders over ₹20,000",
    "Send 15% off to VIP customers",
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto h-screen flex flex-col">
      <div className="mb-4">
        <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">Conversational</div>
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-2">
          Agent <Sparkles className="h-7 w-7 text-[#6C5CE7]" />
        </h1>
        <p className="text-sm text-[#1a1a2e]/60 mt-1">Describe a goal — the agent plans and executes.</p>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-white border-2 border-black/10 rounded-3xl">
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 ${
                m.role === "user" ? "bg-[#1a1a2e] text-white" : "bg-[#6C5CE7] text-white"
              }`}>
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 max-w-[75%] text-sm ${
                m.role === "user"
                  ? "bg-[#1a1a2e] text-white rounded-tr-sm"
                  : "bg-[#FFF8F2] border-2 border-black/5 rounded-tl-sm"
              }`}>
                <div>{m.content}</div>
                {m.meta?.action && m.meta.action !== "clarify" && (
                  <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD93D] text-[#1a1a2e]">
                    {m.meta.action}
                  </span>
                )}
              </div>
            </div>
          ))}
          {plan.isPending && (
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-2xl bg-[#6C5CE7] flex items-center justify-center"><Bot className="h-4 w-4 text-white" /></div>
              <div className="bg-[#FFF8F2] border-2 border-black/5 rounded-2xl px-4 py-3 text-sm text-[#1a1a2e]/60">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#6C5CE7] animate-bounce" />
                  <span className="h-2 w-2 rounded-full bg-[#6C5CE7] animate-bounce [animation-delay:.15s]" />
                  <span className="h-2 w-2 rounded-full bg-[#6C5CE7] animate-bounce [animation-delay:.3s]" />
                </span>
              </div>
            </div>
          )}
        </div>

        {messages.length <= 1 && (
          <div className="px-6 pb-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => setInput(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-[#FFF8F2] border border-black/10 hover:bg-[#FFD93D] transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="border-t border-black/5 p-3 flex gap-2 bg-[#FFF8F2]/50">
          <Input value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent…" disabled={plan.isPending}
            className="rounded-full h-11 border-black/10 bg-white" />
          <Button type="submit" disabled={plan.isPending || !input.trim()}
            className="bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full h-11 w-11 p-0">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
