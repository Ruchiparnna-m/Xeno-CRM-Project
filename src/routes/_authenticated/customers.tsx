import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/api/customers.functions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const fn = useServerFn(listCustomers);
  const { data, isLoading } = useQuery({ queryKey: ["customers"], queryFn: () => fn() });

  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">{data?.length ?? 0} records</p>
      </div>
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
