import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerStats, seedDemoData } from "@/lib/api/customers.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const statsFn = useServerFn(customerStats);
  const seedFn = useServerFn(seedDemoData);
  const { data, isLoading } = useQuery({ queryKey: ["stats"], queryFn: () => statsFn() });

  const seed = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (r: any) => {
      if (r.skipped) toast.info("Demo data already exists.");
      else toast.success(`Seeded ${r.customers} customers, ${r.orders} orders.`);
      qc.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const tiles = [
    { label: "Customers", value: data?.customers ?? 0 },
    { label: "Orders", value: data?.orders ?? 0 },
    { label: "Total Spend (₹)", value: (data?.totalSpend ?? 0).toLocaleString() },
    { label: "Campaigns", value: data?.campaigns ?? 0 },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your CRM at a glance</p>
        </div>
        <Button onClick={() => seed.mutate()} disabled={seed.isPending}>
          {seed.isPending ? "Seeding..." : "Seed demo data"}
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

      <Card>
        <CardHeader><CardTitle>Quick start</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>1. Click <b>Seed demo data</b> above to load sample customers & orders.</p>
          <p>2. Go to <b>Segments</b> and try the AI: "high spenders inactive 60 days".</p>
          <p>3. From <b>Campaigns</b>, pick a segment, draft a message (AI variants), and send.</p>
          <p>4. Check the per-message delivery log to see the simulated vendor receipts.</p>
          <p>5. Or use the <b>Agent</b> tab to drive the whole flow in chat.</p>
        </CardContent>
      </Card>
    </div>
  );
}
