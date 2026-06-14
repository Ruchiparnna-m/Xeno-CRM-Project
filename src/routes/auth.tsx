import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in — Xeno CRM" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Account created — you're in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Auth failed");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? "Google sign-in failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#1a1a2e] grid md:grid-cols-2 overflow-hidden">
      {/* LEFT — visual */}
      <div className="relative hidden md:flex flex-col justify-between p-10 bg-[#6C5CE7] text-white overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#FFD93D] rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFB4A2] rounded-full blur-3xl opacity-40" />

        <Link to="/" className="relative inline-flex items-center gap-2 font-black text-xl">
          <div className="h-9 w-9 rounded-xl bg-white flex items-center justify-center rotate-3">
            <Sparkles className="h-4 w-4 text-[#6C5CE7]" />
          </div>
          Xeno
        </Link>

        <div className="relative space-y-6 max-w-md">
          <div className="inline-block px-3 py-1 bg-[#FFD93D] text-[#1a1a2e] rounded-full text-xs font-bold -rotate-2">
            ✨ Welcome back
          </div>
          <h2 className="text-4xl font-black leading-tight">
            Turn customer data into <span className="bg-[#FFD93D] text-[#1a1a2e] px-2 rounded-lg -rotate-1 inline-block">revenue</span>, on autopilot.
          </h2>
          <ul className="space-y-3 text-sm text-white/90">
            {["Build segments in plain English","AI message variants in one click","90% delivery rate, out of the box","Beautiful insights — for free"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-5 w-5 rounded-full bg-[#A8E6CF] text-[#1a1a2e] flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-white/70">© 2026 Xeno CRM</div>
      </div>

      {/* RIGHT — form */}
      <div className="relative flex flex-col">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#C8B6FF] rounded-full blur-3xl opacity-50 -z-0" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-[#FFD6A5] rounded-full blur-3xl opacity-50 -z-0" />

        <div className="relative p-6 md:hidden">
          <Link to="/" className="inline-flex items-center gap-2 font-black text-lg">
            <div className="h-8 w-8 rounded-xl bg-[#6C5CE7] flex items-center justify-center rotate-3">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Xeno
          </Link>
        </div>

        <div className="relative flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white border-2 border-black/10 rounded-3xl p-8 shadow-xl">
            <h1 className="text-3xl font-black tracking-tight">
              {mode === "signin" ? "Welcome back 👋" : "Let's get you set up 🚀"}
            </h1>
            <p className="text-sm text-[#1a1a2e]/60 mt-1">
              {mode === "signin" ? "Sign in to your workspace" : "Create your free workspace"}
            </p>

            <Button
              type="button"
              onClick={google}
              disabled={loading}
              className="w-full mt-6 bg-white hover:bg-black/5 text-[#1a1a2e] border-2 border-black/10 rounded-full h-11 font-semibold"
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              Continue with Google
            </Button>

            <div className="flex items-center gap-3 my-5 text-xs text-[#1a1a2e]/40">
              <div className="h-px bg-black/10 flex-1" /> OR <div className="h-px bg-black/10 flex-1" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              <Input
                type="email" placeholder="you@brand.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
                className="rounded-full h-11 border-black/10 bg-[#FFF8F2]"
              />
              <Input
                type="password" placeholder="Password" minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)} required
                className="rounded-full h-11 border-black/10 bg-[#FFF8F2]"
              />
              <Button
                type="submit" disabled={loading}
                className="w-full bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full h-11 font-semibold"
              >
                {loading ? "..." : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="text-xs text-[#1a1a2e]/60 mt-5 hover:underline w-full text-center"
            >
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>

            <Link to="/" className="mt-4 text-xs text-[#1a1a2e]/40 hover:text-[#1a1a2e] inline-flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
