import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listCustomers } from "@/lib/api/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, Copy, Users, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const fn = useServerFn(listCustomers);
  const { data, isLoading } = useQuery({ queryKey: ["customers"], queryFn: () => fn() });
  const [token, setToken] = useState<string>("");
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ""));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const curl = `curl -X POST ${origin}/api/public/ingest/customers \\
  -H "Authorization: Bearer ${token ? token.slice(0, 20) + "…" : "<your-access-token>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"new@example.com","name":"New User","total_spend":1200}'`;

  const filtered = (data ?? []).filter((c: any) =>
    !q || c.name?.toLowerCase().includes(q.toLowerCase()) || c.email?.toLowerCase().includes(q.toLowerCase())
  );

  const initials = (name: string | null, email: string) =>
    (name?.split(" ").map((s) => s[0]).join("").slice(0, 2) || email[0] || "?").toUpperCase();

  const avatarColors = ["bg-[#FFD93D]","bg-[#A8E6CF]","bg-[#C8B6FF]","bg-[#FFB4A2]","bg-[#FFD6A5]"];

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">People</div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            Customers
            <span className="bg-[#A8E6CF] text-[#1a1a2e] text-sm font-bold px-3 py-1 rounded-full border-2 border-black/10">
              {data?.length ?? 0}
            </span>
          </h1>
          <p className="text-sm text-[#1a1a2e]/60 mt-1">Everyone in your orbit, in one place.</p>
        </div>
        <div className="relative">
          <Search className="h-4 w-4 text-[#1a1a2e]/40 absolute left-4 top-1/2 -translate-y-1/2" />
          <Input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="rounded-full h-11 pl-10 w-80 border-black/10 bg-white"
          />
        </div>
      </div>

      <div className="bg-[#1a1a2e] text-white rounded-3xl p-6 border-2 border-black/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-xl bg-[#FFD93D] flex items-center justify-center">
            <Code2 className="h-4 w-4 text-[#1a1a2e]" />
          </div>
          <h3 className="font-black text-lg">Ingestion API</h3>
        </div>
        <p className="text-sm text-white/60 mb-4">External systems can push customers & orders via REST.</p>
        <pre className="text-xs bg-black/40 p-4 rounded-2xl overflow-auto text-[#A8E6CF] font-mono">{curl}</pre>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" onClick={() => { navigator.clipboard.writeText(token); toast.success("Access token copied"); }}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full">
            <Copy className="h-3 w-3" /> Copy access token
          </Button>
          <Button size="sm" onClick={() => { navigator.clipboard.writeText(`${origin}/api/public/ingest/orders`); toast.success("Orders URL copied"); }}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full">
            <Copy className="h-3 w-3" /> Copy /ingest/orders URL
          </Button>
        </div>
      </div>

      <div className="bg-white border-2 border-black/10 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#FFF8F2] text-xs font-bold uppercase tracking-wider text-[#1a1a2e]/60 border-b border-black/5">
          <div className="col-span-4">Customer</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2 text-right">Spend (₹)</div>
          <div className="col-span-1 text-right">Visits</div>
          <div className="col-span-2 text-right">Last active</div>
        </div>
        <div className="divide-y divide-black/5">
          {isLoading && <div className="p-6 text-sm text-[#1a1a2e]/50">Loading…</div>}
          {!isLoading && filtered.length === 0 && (
            <div className="p-10 text-center">
              <Users className="h-10 w-10 mx-auto text-[#1a1a2e]/30" />
              <div className="mt-3 text-sm text-[#1a1a2e]/60">No customers yet — seed demo data from the Dashboard.</div>
            </div>
          )}
          {filtered.slice(0, 200).map((c: any, i: number) => (
            <div key={c.id} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-[#FFF8F2]/60 text-sm">
              <div className="col-span-4 flex items-center gap-3 min-w-0">
                <div className={`h-9 w-9 shrink-0 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center font-black text-xs border-2 border-white shadow-sm`}>
                  {initials(c.name, c.email)}
                </div>
                <div className="font-semibold truncate">{c.name ?? "—"}</div>
              </div>
              <div className="col-span-3 text-[#1a1a2e]/60 truncate">{c.email}</div>
              <div className="col-span-2 text-right font-bold">{Number(c.total_spend).toLocaleString()}</div>
              <div className="col-span-1 text-right text-[#1a1a2e]/70">{c.visit_count}</div>
              <div className="col-span-2 text-right text-[#1a1a2e]/60">
                {c.last_active_at ? new Date(c.last_active_at).toLocaleDateString() : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
