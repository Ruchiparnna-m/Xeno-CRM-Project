import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Plus, Trash2, Target } from "lucide-react";
import { toast } from "sonner";
import { createSegment, listSegments, naturalLanguageToRules, previewSegment } from "@/lib/api/segments.functions";

export const Route = createFileRoute("/_authenticated/segments")({
  component: SegmentsPage,
});

type Cond = { field: "total_spend" | "visit_count" | "days_inactive"; operator: ">" | "<" | ">=" | "<=" | "=" | "!="; value: number };

function SegmentsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listSegments);
  const createFn = useServerFn(createSegment);
  const previewFn = useServerFn(previewSegment);
  const nlFn = useServerFn(naturalLanguageToRules);

  const segments = useQuery({ queryKey: ["segments"], queryFn: () => listFn() });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [op, setOp] = useState<"AND" | "OR">("AND");
  const [conditions, setConditions] = useState<Cond[]>([{ field: "total_spend", operator: ">", value: 5000 }]);
  const [nlPrompt, setNlPrompt] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const addCond = () => setConditions([...conditions, { field: "total_spend", operator: ">", value: 0 }]);
  const removeCond = (i: number) => setConditions(conditions.filter((_, idx) => idx !== i));
  const updateCond = (i: number, patch: Partial<Cond>) =>
    setConditions(conditions.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const preview = useMutation({
    mutationFn: () => previewFn({ data: { rules: { op, conditions } } }),
    onSuccess: (r: any) => { setPreviewCount(r.count); toast.success(`${r.count} customers match`); },
    onError: (e: any) => toast.error(e.message),
  });

  const nl = useMutation({
    mutationFn: () => nlFn({ data: { prompt: nlPrompt } }),
    onSuccess: (r: any) => {
      setOp(r.op ?? "AND");
      setConditions(r.conditions ?? []);
      if (r.name) setName(r.name);
      if (r.description) setDescription(r.description);
      toast.success("AI generated rules — review and save.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const save = useMutation({
    mutationFn: () => createFn({ data: { name, description, rules: { op, conditions } } }),
    onSuccess: () => {
      toast.success("Segment saved");
      setName(""); setDescription(""); setConditions([{ field: "total_spend", operator: ">", value: 5000 }]);
      setPreviewCount(null);
      qc.invalidateQueries({ queryKey: ["segments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const examples = [
    "High spenders who haven't visited in 60 days",
    "Customers with 10+ visits in the last month",
    "Inactive users who spent over ₹20,000",
  ];

  const cardColors = ["bg-[#FFD93D]","bg-[#A8E6CF]","bg-[#C8B6FF]","bg-[#FFB4A2]","bg-[#FFD6A5]"];

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div>
        <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">Audience</div>
        <h1 className="text-4xl font-black tracking-tight">Segments 🎯</h1>
        <p className="text-sm text-[#1a1a2e]/60 mt-1">Define audiences with rules or just describe them.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI builder */}
        <div className="bg-[#6C5CE7] text-white rounded-3xl p-6 border-2 border-black/10 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#FFD93D] rounded-full blur-2xl opacity-40" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-xl bg-[#FFD93D] flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#1a1a2e]" />
              </div>
              <h3 className="font-black text-lg">AI rule builder</h3>
            </div>
            <p className="text-sm text-white/70 mb-4">Describe your audience, AI builds the rules.</p>
            <Textarea
              placeholder="e.g. high spenders who haven't visited in 60 days"
              value={nlPrompt} onChange={(e) => setNlPrompt(e.target.value)} rows={3}
              className="rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-[#FFD93D]"
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {examples.map((ex) => (
                <button key={ex} onClick={() => setNlPrompt(ex)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition">
                  {ex}
                </button>
              ))}
            </div>
            <Button
              onClick={() => nl.mutate()} disabled={nl.isPending || !nlPrompt.trim()}
              className="mt-4 bg-[#FFD93D] hover:bg-[#FFE45D] text-[#1a1a2e] rounded-full h-11 font-bold gap-2"
            >
              <Sparkles className="h-4 w-4" /> {nl.isPending ? "Thinking…" : "Generate rules"}
            </Button>
          </div>
        </div>

        {/* Manual builder */}
        <div className="bg-white rounded-3xl p-6 border-2 border-black/10">
          <h3 className="font-black text-lg mb-1">Manual builder</h3>
          <p className="text-sm text-[#1a1a2e]/60 mb-4">Combine conditions with AND / OR.</p>
          <div className="space-y-3">
            <Input placeholder="Segment name" value={name} onChange={(e) => setName(e.target.value)}
              className="rounded-full h-11 border-black/10 bg-[#FFF8F2]" />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
              className="rounded-full h-11 border-black/10 bg-[#FFF8F2]" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Match</span>
              <Select value={op} onValueChange={(v: any) => setOp(v)}>
                <SelectTrigger className="w-24 rounded-full h-9 border-black/10 bg-[#FFF8F2]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ALL</SelectItem>
                  <SelectItem value="OR">ANY</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-[#1a1a2e]/60">of:</span>
            </div>
            {conditions.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={c.field} onValueChange={(v: any) => updateCond(i, { field: v })}>
                  <SelectTrigger className="flex-1 rounded-full h-9 border-black/10 bg-[#FFF8F2]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_spend">Total spend (₹)</SelectItem>
                    <SelectItem value="visit_count">Visit count</SelectItem>
                    <SelectItem value="days_inactive">Days inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={c.operator} onValueChange={(v: any) => updateCond(i, { operator: v })}>
                  <SelectTrigger className="w-20 rounded-full h-9 border-black/10 bg-[#FFF8F2]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[">", "<", ">=", "<=", "=", "!="].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" className="w-24 rounded-full h-9 border-black/10 bg-[#FFF8F2]"
                  value={c.value} onChange={(e) => updateCond(i, { value: Number(e.target.value) })} />
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => removeCond(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCond} className="rounded-full border-black/10 gap-1">
              <Plus className="h-4 w-4" /> Add condition
            </Button>
            <div className="flex flex-wrap gap-2 pt-2 items-center">
              <Button onClick={() => preview.mutate()} disabled={preview.isPending}
                className="bg-white hover:bg-black/5 text-[#1a1a2e] border-2 border-black/10 rounded-full">
                Preview audience
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}
                className="bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full">
                Save segment
              </Button>
              {previewCount !== null && (
                <span className="ml-auto bg-[#FFD93D] text-[#1a1a2e] text-xs font-bold px-3 py-1 rounded-full border-2 border-black/10">
                  {previewCount} match
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-black text-xl mb-4">Your segments</h3>
        {(segments.data ?? []).length === 0 ? (
          <div className="bg-white border-2 border-dashed border-black/10 rounded-3xl p-10 text-center">
            <Target className="h-10 w-10 mx-auto text-[#1a1a2e]/30" />
            <div className="mt-3 text-sm text-[#1a1a2e]/60">No segments yet — try the AI builder above.</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(segments.data ?? []).map((s: any, i: number) => (
              <div key={s.id} className={`${cardColors[i % cardColors.length]} rounded-3xl p-5 border-2 border-black/10`}>
                <div className="flex items-start justify-between">
                  <div className="h-10 w-10 rounded-2xl bg-white/60 flex items-center justify-center">
                    <Target className="h-5 w-5 text-[#1a1a2e]" />
                  </div>
                  <span className="bg-[#1a1a2e] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {s.audience_size}
                  </span>
                </div>
                <div className="mt-4 font-black text-lg leading-tight">{s.name}</div>
                <div className="text-xs text-[#1a1a2e]/70 mt-1">{s.description ?? "—"}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
