import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerStats, seedDemoData } from "@/lib/api/customers.functions";
import { campaignInsights } from "@/lib/api/insights.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
      else toast.success(`Seeded ${r.customers} customers, ${r.orders} orders.`);
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const tiles = [
    { label: "Customers", value: data?.customers ?? 0 },
    { label: "Orders", value: data?.orders ?? 0 },
    { label: "Total Spend (₹)", value: (data?.totalSpend ?? 0).toLocaleString() },
    { label: "Campaigns", value: data?.campaigns ?? 0 },
  ];

  const campaignChart = (insights?.campaigns ?? []).slice(0, 8).map((c: any) => ({
    name: c.name.slice(0, 14),
    audience: c.audience_size,
    delivered: c.delivered_count,
    failed: c.failed_count,
  })).reverse();

  const funnelTotals = insights?.totals ?? { audience: 0, delivered: 0, failed: 0 };
  const pieData = [
    { name: "Delivered", value: funnelTotals.delivered, color: "hsl(142 72% 45%)" },
    { name: "Failed", value: funnelTotals.failed, color: "hsl(0 72% 50%)" },
    { name: "Pending", value: Math.max(0, funnelTotals.audience - funnelTotals.delivered - funnelTotals.failed), color: "hsl(45 90% 55%)" },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your CRM at a glance</p>
        </div>
        <Button onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding 5k customers…" : "Seed demo data (5k customers)"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">{t.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{isLoading ? "—" : t.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Recent campaigns — audience vs delivered vs failed</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            {campaignChart.length === 0 ? (
              <div className="text-sm text-muted-foreground">No campaigns yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="audience" fill="hsl(220 70% 60%)" />
                  <Bar dataKey="delivered" fill="hsl(142 72% 45%)" />
                  <Bar dataKey="failed" fill="hsl(0 72% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Overall delivery</CardTitle></CardHeader>
          <CardContent style={{ height: 300 }}>
            {funnelTotals.audience === 0 ? (
              <div className="text-sm text-muted-foreground">No sends yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                    {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top segments by audience</CardTitle></CardHeader>
        <CardContent>
          {(insights?.segments ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No segments yet.</div>
          ) : (
            <div className="space-y-2">
              {(insights?.segments ?? []).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b pb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.audience_size} customers</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
