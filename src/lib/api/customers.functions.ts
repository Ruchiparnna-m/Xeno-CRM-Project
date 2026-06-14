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
      .from("customers").select("*", { count: "exact", head: true }).eq("user_id", userId);
    if ((count ?? 0) > 0) return { skipped: true, customers: count };

    const firstNames = ["Aarav","Vivaan","Aditya","Vihaan","Arjun","Sai","Ayaan","Krishna","Ishaan","Ananya","Diya","Saanvi","Aanya","Pari","Riya","Myra","Rohan","Kavya","Ira","Neha","Rahul","Priya","Karan","Tara"];
    const lastNames = ["Sharma","Verma","Iyer","Reddy","Khan","Singh","Patel","Mehta","Gupta","Roy","Kapoor","Nair","Bose","Joshi","Malhotra"];

    const TOTAL = 5000;
    const customers = Array.from({ length: TOTAL }).map((_, i) => {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
      return {
        user_id: userId,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
        name: `${fn} ${ln}`,
        phone: `+91${9000000000 + Math.floor(Math.random() * 99999999)}`,
        total_spend: Math.floor(Math.random() * 50000),
        visit_count: Math.floor(Math.random() * 30),
        last_active_at: new Date(Date.now() - Math.floor(Math.random() * 365) * 86400000).toISOString(),
      };
    });

    const insertedIds: string[] = [];
    const CHUNK = 500;
    for (let i = 0; i < customers.length; i += CHUNK) {
      const { data, error } = await supabase
        .from("customers").insert(customers.slice(i, i + CHUNK)).select("id");
      if (error) throw new Error(error.message);
      for (const r of data ?? []) insertedIds.push(r.id);
    }

    const orders: Array<{ user_id: string; customer_id: string; amount: number; status: string }> = [];
    for (const id of insertedIds) {
      const n = Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        orders.push({
          user_id: userId, customer_id: id,
          amount: Math.floor(Math.random() * 5000) + 200, status: "completed",
        });
      }
    }
    for (let i = 0; i < orders.length; i += 1000) {
      await supabase.from("orders").insert(orders.slice(i, i + 1000));
    }

    // Seed demo segments
    const demoSegments = [
      { name: "VIP big spenders", description: "Customers who spent over ₹30,000", rules: { op: "AND", conditions: [{ field: "total_spend", operator: ">", value: 30000 }] } },
      { name: "Lapsed shoppers", description: "Inactive for 60+ days", rules: { op: "AND", conditions: [{ field: "days_inactive", operator: ">", value: 60 }] } },
      { name: "Active regulars", description: "10+ visits and active recently", rules: { op: "AND", conditions: [{ field: "visit_count", operator: ">", value: 10 }, { field: "days_inactive", operator: "<", value: 30 }] } },
    ];
    const segmentRows: any[] = [];
    for (const s of demoSegments) {
      const { data: seg } = await supabase.from("segments").insert({
        user_id: userId, name: s.name, description: s.description, rules: s.rules, audience_size: 0,
      }).select().single();
      if (seg) segmentRows.push(seg);
    }

    return { skipped: false, customers: customers.length, orders: orders.length, segments: segmentRows.length };
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
