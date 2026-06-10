import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const customerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ count: customerCount }, { count: orderCount }, { data: spendData }, { count: campaignCount }] =
      await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("customers").select("total_spend").eq("user_id", userId),
        supabase.from("campaigns").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ]);
    const totalSpend = (spendData ?? []).reduce((s, r) => s + Number(r.total_spend ?? 0), 0);
    return {
      customers: customerCount ?? 0,
      orders: orderCount ?? 0,
      totalSpend,
      campaigns: campaignCount ?? 0,
    };
  });

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count ?? 0) > 0) return { skipped: true, customers: count };

    const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Ayaan", "Krishna", "Ishaan", "Ananya", "Diya", "Saanvi", "Aanya", "Pari", "Riya", "Myra"];
    const lastNames = ["Sharma", "Verma", "Iyer", "Reddy", "Khan", "Singh", "Patel", "Mehta", "Gupta", "Roy"];
    const customers = Array.from({ length: 60 }).map((_, i) => {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[i % lastNames.length];
      const total = Math.floor(Math.random() * 30000);
      const visits = Math.floor(Math.random() * 25);
      const daysAgo = Math.floor(Math.random() * 180);
      const lastActive = new Date(Date.now() - daysAgo * 86400000).toISOString();
      return {
        user_id: userId,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
        name: `${fn} ${ln}`,
        phone: `+91${9000000000 + Math.floor(Math.random() * 99999999)}`,
        total_spend: total,
        visit_count: visits,
        last_active_at: lastActive,
      };
    });
    const { data: insertedCustomers, error } = await supabase.from("customers").insert(customers).select("id");
    if (error) throw new Error(error.message);

    // a few orders per customer
    const orders: Array<{ user_id: string; customer_id: string; amount: number; status: string }> = [];
    for (const c of insertedCustomers ?? []) {
      const n = Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) {
        orders.push({
          user_id: userId,
          customer_id: c.id,
          amount: Math.floor(Math.random() * 5000) + 200,
          status: "completed",
        });
      }
    }
    if (orders.length) await supabase.from("orders").insert(orders);
    return { skipped: false, customers: customers.length, orders: orders.length };
  });

export const ingestCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      name: z.string().optional(),
      phone: z.string().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("customers")
      .insert({ user_id: userId, ...data })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
