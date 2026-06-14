import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Megaphone, MessageSquare, Star, ArrowRight, Check, BarChart3, Zap, Shield } from "lucide-react";
import customer1 from "@/assets/customer-1.jpg";
import customer2 from "@/assets/customer-2.jpg";
import customer3 from "@/assets/customer-3.jpg";
import heroDashboard from "@/assets/hero-dashboard.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Xeno CRM — AI-native, chat-first CRM for D2C brands" },
      { name: "description", content: "Define audiences in natural language, draft messages with AI, and send campaigns through a smart delivery pipeline. Loved by modern D2C teams." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: Target, title: "Smart segments", body: "Describe an audience in plain English — \"high spenders inactive 60 days\" — and the AI builds the rules instantly." },
    { icon: Megaphone, title: "AI message variants", body: "Three on-brand drafts (friendly, urgent, value) in one click, with {{name}} personalization built in." },
    { icon: Zap, title: "Smart delivery", body: "Per-message delivery log with real-time receipts. ~90% delivered, with retries on failed sends." },
    { icon: MessageSquare, title: "Chat-first agent", body: "Run the whole flow — segment → draft → send → review — from one conversation. No more menu hunting." },
    { icon: BarChart3, title: "Live insights", body: "Beautiful dashboards that show your funnel, top segments, and what's actually driving revenue." },
    { icon: Shield, title: "Secure by default", body: "Row-level security, OAuth sign-in, and per-user data isolation. Your customer data stays yours." },
  ];

  const testimonials = [
    { name: "Sarah Mitchell", role: "Marketing Director, Glow Beauty", image: customer1, quote: "Xeno cut our campaign setup time from 2 hours to 5 minutes. The AI segments are scary good." },
    { name: "James Patterson", role: "Founder, Atlas Outdoor", image: customer2, quote: "We saw a 34% lift in win-back conversions in the first month. The chat agent is genuinely magical." },
    { name: "Priya Sharma", role: "CEO, Bloom & Co.", image: customer3, quote: "Finally a CRM that feels built for 2026. Our team actually enjoys using it — that says everything." },
  ];

  const stats = [
    { value: "5,000+", label: "Customers managed" },
    { value: "20K+", label: "Orders tracked" },
    { value: "90%", label: "Delivery rate" },
    { value: "34%", label: "Avg. conversion lift" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            Xeno CRM
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#testimonials" className="hover:text-foreground transition">Customers</a>
            <a href="#pricing" className="hover:text-foreground transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth"><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="h-3 w-3" /> AI-powered CRM for modern D2C brands
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
            Turn customer data into <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">revenue</span>, on autopilot.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Build segments in plain English, draft on-brand messages with AI, and send campaigns that actually convert — all from one chat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="gap-2">Start free <ArrowRight className="h-4 w-4" /></Button></Link>
            <a href="#features"><Button size="lg" variant="outline">See how it works</Button></a>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-primary" /> No credit card required
            <span className="mx-2">•</span>
            <Check className="h-4 w-4 text-primary" /> Setup in 60 seconds
          </div>

          {/* Hero image */}
          <div className="mt-12 relative max-w-4xl mx-auto">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl blur-2xl" />
            <img
              src={heroDashboard}
              alt="Xeno CRM dashboard preview"
              width={1024}
              height={1024}
              className="relative rounded-2xl border shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold tracking-tight">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-sm font-medium text-primary mb-3">Features</div>
          <h2 className="text-4xl font-bold tracking-tight">Everything you need to grow.</h2>
          <p className="mt-3 text-muted-foreground">Modern tools for modern teams. No bloat, no learning curve.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div key={f.title} className="group border rounded-xl p-6 bg-card hover:shadow-lg hover:border-primary/30 transition-all">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="font-semibold">{f.title}</div>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-muted/30 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-sm font-medium text-primary mb-3">Loved by teams</div>
            <h2 className="text-4xl font-bold tracking-tight">Don't just take our word for it.</h2>
            <p className="mt-3 text-muted-foreground">Hundreds of D2C brands trust Xeno to drive their growth.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card border rounded-xl p-6 shadow-sm">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed">"{t.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    width={1024}
                    height={1024}
                    loading="lazy"
                    className="h-11 w-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/10 via-card to-card p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-4xl font-bold tracking-tight">Ready to grow smarter?</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Join the brands using AI to talk to customers like humans — at scale.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth"><Button size="lg" className="gap-2">Start free <ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Xeno CRM</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition">Privacy</a>
            <a href="#" className="hover:text-foreground transition">Terms</a>
            <a href="#" className="hover:text-foreground transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
