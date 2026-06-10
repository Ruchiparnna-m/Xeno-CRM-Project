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
import { Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createSegment,
  listSegments,
  naturalLanguageToRules,
  previewSegment,
} from "@/lib/api/segments.functions";

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
    onSuccess: (r: any) => {
      setPreviewCount(r.count);
      toast.success(`${r.count} customers match`);
    },
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

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Segments</h1>
        <p className="text-sm text-muted-foreground">Define audiences with rules or natural language.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI rule builder</CardTitle>
            <CardDescription>e.g. "high spenders who haven't visited in 60 days"</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="Describe your audience…" value={nlPrompt} onChange={(e) => setNlPrompt(e.target.value)} rows={3} />
            <Button onClick={() => nl.mutate()} disabled={nl.isPending || !nlPrompt.trim()}>
              <Sparkles className="h-4 w-4" /> {nl.isPending ? "Thinking…" : "Generate rules"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual builder</CardTitle>
            <CardDescription>Combine conditions with AND / OR</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Segment name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Match</span>
              <Select value={op} onValueChange={(v: any) => setOp(v)}>
                <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="AND">ALL</SelectItem>
                  <SelectItem value="OR">ANY</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">of:</span>
            </div>
            {conditions.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Select value={c.field} onValueChange={(v: any) => updateCond(i, { field: v })}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_spend">Total spend (₹)</SelectItem>
                    <SelectItem value="visit_count">Visit count</SelectItem>
                    <SelectItem value="days_inactive">Days inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={c.operator} onValueChange={(v: any) => updateCond(i, { operator: v })}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[">", "<", ">=", "<=", "=", "!="].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input type="number" className="w-28" value={c.value} onChange={(e) => updateCond(i, { value: Number(e.target.value) })} />
                <Button variant="ghost" size="icon" onClick={() => removeCond(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCond}><Plus className="h-4 w-4" /> Add condition</Button>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => preview.mutate()} disabled={preview.isPending}>
                Preview audience
              </Button>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
                Save segment
              </Button>
              {previewCount !== null && <Badge variant="secondary" className="ml-auto self-center">{previewCount} match</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Saved segments</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {(segments.data ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between border-b last:border-0 py-2">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.description ?? "—"}</div>
              </div>
              <Badge>{s.audience_size} customers</Badge>
            </div>
          ))}
          {(segments.data ?? []).length === 0 && <div className="text-sm text-muted-foreground">No segments yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}
