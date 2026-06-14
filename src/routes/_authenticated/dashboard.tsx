import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerStats, seedDemoData } from "@/lib/api/customers.functions";
import { campaignInsights } from "@/lib/api/insights.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ShoppingBag, IndianRupee, Megaphone } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const statsFn = useServerFn(customerStats);
  const seedFn = useServerFn(seedDemoData);
  const insightsFn = useServerFn(campaignInsights);
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => statsFn() });
  const { data: insights } = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });

  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (r: any) => {
      if (r.skipped) toast.info("Demo data already exists.");
      else toast.success(`Seeded ${r.customers} customers, ${r.orders} orders, ${r.segments ?? 0} segments.`);
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      qc.invalidateQueries({ queryKey: ["segments"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const tiles = [
    { label: "Customers", value: data?.customers ?? 0, icon: Users, color: "bg-[#FFD93D]" },
    { label: "Orders", value: data?.orders ?? 0, icon: ShoppingBag, color: "bg-[#A8E6CF]" },
    { label: "Total Spend (₹)", value: (data?.totalSpend ?? 0).toLocaleString(), icon: IndianRupee, color: "bg-[#FFB4A2]" },
    { label: "Campaigns", value: data?.campaigns ?? 0, icon: Megaphone, color: "bg-[#C8B6FF]" },
  ];

  const campaignChart = (insights?.campaigns ?? []).slice(0, 8).map((c: any) => ({
    name: c.name.slice(0, 14),
    audience: c.audience_size,
    delivered: c.delivered_count,
    failed: c.failed_count,
  })).reverse();

  const funnelTotals = insights?.totals ?? { audience: 0, delivered: 0, failed: 0 };
  const pieData = [
    { name: "Delivered", value: funnelTotals.delivered, color: "#A8E6CF" },
    { name: "Failed", value: funnelTotals.failed, color: "#FFB4A2" },
    { name: "Pending", value: Math.max(0, funnelTotals.audience - funnelTotals.delivered - funnelTotals.failed), color: "#FFD93D" },
  ];

  return (
    <div className="p-8 space-y-6 max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider mb-1">Overview</div>
          <h1 className="text-4xl font-black tracking-tight">Hey there 👋</h1>
          <p className="text-sm text-[#1a1a2e]/60 mt-1">Here's what's happening with your customers today.</p>
        </div>
        <Button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full h-11 px-5 font-semibold gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {seed.isPending ? "Seeding…" : "Seed demo data"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.label} className={`${t.color} rounded-3xl p-5 border-2 border-black/10`}>
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-2xl bg-white/60 flex items-center justify-center">
                <t.icon className="h-5 w-5 text-[#1a1a2e]" />
              </div>
            </div>
            <div className="text-3xl font-black mt-4">{isLoading ? "—" : t.value}</div>
            <div className="text-xs font-semibold mt-1 text-[#1a1a2e]/70 uppercase tracking-wider">{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border-2 border-black/10 rounded-3xl p-6">
          <h3 className="font-black text-lg mb-1">Recent campaigns</h3>
          <p className="text-xs text-[#1a1a2e]/60 mb-4">Audience vs delivered vs failed</p>
          <div style={{ height: 280 }}>
            {campaignChart.length === 0 ? (
              <div className="text-sm text-[#1a1a2e]/50 h-full flex items-center justify-center">No campaigns yet — try one!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid rgba(0,0,0,0.1)" }} />
                  <Legend />
                  <Bar dataKey="audience" fill="#C8B6FF" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="delivered" fill="#A8E6CF" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="failed" fill="#FFB4A2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-black/10 rounded-3xl p-6">
          <h3 className="font-black text-lg mb-1">Delivery</h3>
          <p className="text-xs text-[#1a1a2e]/60 mb-4">Overall send health</p>
          <div style={{ height: 280 }}>
            {funnelTotals.audience === 0 ? (
              <div className="text-sm text-[#1a1a2e]/50 h-full flex items-center justify-center">No sends yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={4}>
                    {pieData.map((d) => <Cell key={d.name} fill={d.color} stroke="#fff" strokeWidth={3} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "2px solid rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-black/10 rounded-3xl p-6">
        <h3 className="font-black text-lg mb-4">Top segments by audience</h3>
        {(insights?.segments ?? []).length === 0 ? (
          <div className="text-sm text-[#1a1a2e]/50">No segments yet.</div>
        ) : (
          <div className="space-y-2">
            {(insights?.segments ?? []).map((s: any, i: number) => {
              const colors = ["bg-[#FFD93D]","bg-[#A8E6CF]","bg-[#C8B6FF]","bg-[#FFB4A2]","bg-[#FFD6A5]"];
              return (
                <div key={s.id} className="flex items-center justify-between text-sm py-2 px-3 rounded-xl hover:bg-black/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg ${colors[i % colors.length]} flex items-center justify-center font-black text-xs`}>
                      {i + 1}
                    </div>
                    <span className="font-semibold">{s.name}</span>
                  </div>
                  <span className="font-bold text-[#1a1a2e]/70">{s.audience_size} customers</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
