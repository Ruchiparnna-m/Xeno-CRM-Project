import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listCustomers } from "@/lib/api/customers.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const fn = useServerFn(listCustomers);
  const { data, isLoading } = useQuery({ queryKey: ["customers"], queryFn: () => fn() });
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? ""));
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const curl = `curl -X POST ${origin}/api/public/ingest/customers \\
  -H "Authorization: Bearer ${token ? token.slice(0, 20) + "…" : "<your-access-token>"}" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"new@example.com","name":"New User","total_spend":1200}'`;

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} records</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingestion API</CardTitle>
          <CardDescription>External systems can push customers & orders via REST.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">{curl}</pre>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(token); toast.success("Access token copied"); }}>
              Copy access token
            </Button>
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(`${origin}/api/public/ingest/orders`); toast.success("Orders endpoint copied"); }}>
              Copy /ingest/orders URL
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Endpoints: <code>POST /api/public/ingest/customers</code>, <code>POST /api/public/ingest/orders</code>. Both accept single object or {"{ customers: [...] } / { orders: [...] }"} bulk arrays.</p>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Spend (₹)</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Last active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={5}>Loading…</TableCell></TableRow>}
            {(data ?? []).map((c: any) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{c.email}</TableCell>
                <TableCell>{Number(c.total_spend).toLocaleString()}</TableCell>
                <TableCell>{c.visit_count}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.last_active_at ? new Date(c.last_active_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No customers yet — seed demo data from the Dashboard.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
