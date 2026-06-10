import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Target, Megaphone, MessageSquare, LogOut } from "lucide-react";

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
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/customers", label: "Customers", icon: Users },
    { to: "/segments", label: "Segments", icon: Target },
    { to: "/campaigns", label: "Campaigns", icon: Megaphone },
    { to: "/chat", label: "Agent", icon: MessageSquare },
  ] as const;

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 border-r bg-card flex flex-col">
        <div className="p-5 border-b">
          <div className="text-lg font-bold tracking-tight">Xeno CRM</div>
          <div className="text-xs text-muted-foreground">AI-native, chat-first</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent text-foreground/80"
              activeProps={{ className: "flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-accent text-foreground font-medium" }}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
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
