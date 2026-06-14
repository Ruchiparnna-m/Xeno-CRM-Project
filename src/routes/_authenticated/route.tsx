import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Target, Megaphone, MessageSquare, LogOut, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "bg-[#FFD93D]" },
    { to: "/customers", label: "Customers", icon: Users, color: "bg-[#A8E6CF]" },
    { to: "/segments", label: "Segments", icon: Target, color: "bg-[#C8B6FF]" },
    { to: "/campaigns", label: "Campaigns", icon: Megaphone, color: "bg-[#FFB4A2]" },
    { to: "/chat", label: "Agent", icon: MessageSquare, color: "bg-[#FFD6A5]" },
  ] as const;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#1a1a2e] flex">
      <aside className="w-64 border-r border-black/5 bg-white flex flex-col">
        <Link to="/dashboard" className="p-5 border-b border-black/5 flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-[#6C5CE7] flex items-center justify-center rotate-3">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight leading-none">Xeno</div>
            <div className="text-[10px] text-[#1a1a2e]/50 uppercase tracking-wider">AI-native CRM</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#1a1a2e]/70 hover:bg-black/5 hover:text-[#1a1a2e] transition"
              activeProps={{ className: "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold bg-[#1a1a2e] text-white" }}
            >
              <div className={`h-7 w-7 rounded-lg ${item.color} flex items-center justify-center`}>
                <item.icon className="h-3.5 w-3.5 text-[#1a1a2e]" />
              </div>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-black/5">
          <Button variant="ghost" size="sm" className="w-full justify-start rounded-xl text-[#1a1a2e]/70" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
