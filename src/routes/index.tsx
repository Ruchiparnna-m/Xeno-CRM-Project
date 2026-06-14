import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Star, Check, Zap, Target, MessageSquare, BarChart3 } from "lucide-react";
import customer1 from "@/assets/customer-1.jpg";
import customer2 from "@/assets/customer-2.jpg";
import customer3 from "@/assets/customer-3.jpg";
import lifestyle1 from "@/assets/lifestyle-1.jpg";
import lifestyle2 from "@/assets/lifestyle-2.jpg";
import collage from "@/assets/collage-products.jpg";
import cardAnalytics from "@/assets/card-analytics.jpg";
import cardChat from "@/assets/card-chat.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Xeno CRM — AI-native CRM for D2C brands that actually grow" },
      { name: "description", content: "Build smart audiences in plain English, draft on-brand AI campaigns, and ship them in minutes. The CRM modern D2C teams brag about." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: Target, title: "Smart segments", body: "Describe an audience — \"high spenders, inactive 60 days\" — and AI builds it instantly." },
    { icon: Zap, title: "AI message variants", body: "Three on-brand drafts in one click. Friendly, urgent, value. {{name}} included." },
    { icon: MessageSquare, title: "Chat-first agent", body: "Segment → draft → send → review. All from one conversation. No menu hunting." },
    { icon: BarChart3, title: "Live insights", body: "Beautiful dashboards that show what's actually driving revenue." },
  ];

  const testimonials = [
    { name: "Sarah Mitchell", role: "Marketing Director, Glow Beauty", image: customer1, quote: "Cut our campaign setup from 2 hours to 5 minutes. The AI segments are scary good." },
    { name: "James Patterson", role: "Founder, Atlas Outdoor", image: customer2, quote: "34% lift in win-back conversions in month one. The chat agent is magic." },
    { name: "Priya Sharma", role: "CEO, Bloom & Co.", image: customer3, quote: "Finally a CRM that feels built for 2026. Our team actually enjoys using it." },
  ];

  const brands = ["AURA", "FitnessAI", "Planta", "Hipstamatic", "Bloom&Co", "Atlas"];

  return (
    <div className="min-h-screen bg-[#FFF8F2] text-[#1a1a2e] overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF8F2]/80 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black tracking-tight text-xl">
            <div className="h-9 w-9 rounded-xl bg-[#6C5CE7] flex items-center justify-center rotate-3">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            Xeno
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-[#6C5CE7] transition">Features</a>
            <a href="#showcase" className="hover:text-[#6C5CE7] transition">Showcase</a>
            <a href="#testimonials" className="hover:text-[#6C5CE7] transition">Customers</a>
            <a href="#pricing" className="hover:text-[#6C5CE7] transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth">
              <Button size="sm" className="bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full px-5">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        {/* Blob backdrop */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-32 -left-20 w-[420px] h-[420px] bg-[#C8B6FF] rounded-full blur-3xl opacity-70" />
          <div className="absolute top-10 right-0 w-[360px] h-[360px] bg-[#FFD6A5] rounded-full blur-3xl opacity-70" />
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] bg-[#A8E6CF] rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-black/10 text-xs font-semibold shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            Trusted by 500+ D2C brands worldwide
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-5xl mx-auto">
            The CRM that turns
            <span className="inline-block mx-2 px-3 py-0.5 bg-[#FFD93D] rounded-2xl -rotate-2">customers</span>
            into
            <span className="inline-block mx-2 px-3 py-0.5 bg-[#6C5CE7] text-white rounded-2xl rotate-1">superfans.</span>
          </h1>
          <p className="mt-6 text-lg text-[#1a1a2e]/70 max-w-2xl mx-auto">
            Build segments in plain English, draft on-brand messages with AI, and ship campaigns that actually convert — all from one chat.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full gap-2 h-12 px-7 text-base">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#showcase">
              <Button size="lg" variant="outline" className="rounded-full h-12 px-7 text-base border-black/15 bg-white hover:bg-white">
                See it in action
              </Button>
            </a>
          </div>
          <div className="mt-5 flex items-center justify-center gap-4 text-xs text-[#1a1a2e]/60">
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> No credit card</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> 60-second setup</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5 text-[#22C55E]" /> Free forever plan</span>
          </div>
        </div>

        {/* Collage showcase */}
        <div id="showcase" className="max-w-7xl mx-auto px-6 pb-16">
          <div className="relative h-[520px] md:h-[560px]">
            {/* Big lifestyle card */}
            <div className="absolute left-0 top-6 w-[42%] rounded-3xl overflow-hidden shadow-2xl -rotate-3 border-4 border-white">
              <img src={lifestyle1} alt="Marketer using Xeno on phone" className="w-full h-[480px] object-cover" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-2xl p-4">
                <div className="text-xs font-bold text-[#6C5CE7] uppercase tracking-wider">For modern teams</div>
                <div className="text-sm font-semibold mt-1">"Set up our first AI segment in 90 seconds."</div>
              </div>
            </div>

            {/* Center product collage */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[44%] rounded-3xl overflow-hidden shadow-2xl rotate-1 border-4 border-white z-10">
              <img src={collage} alt="Xeno product preview" className="w-full h-[420px] object-cover" />
            </div>

            {/* Right top card – analytics */}
            <div className="absolute right-0 top-0 w-[28%] rounded-3xl overflow-hidden shadow-2xl rotate-3 border-4 border-white">
              <img src={cardAnalytics} alt="Analytics card" className="w-full h-[230px] object-cover" />
            </div>

            {/* Right bottom – chat */}
            <div className="absolute right-4 bottom-0 w-[26%] rounded-3xl overflow-hidden shadow-2xl -rotate-2 border-4 border-white">
              <img src={cardChat} alt="AI chat preview" className="w-full h-[260px] object-cover" />
            </div>

            {/* Floating sticker */}
            <div className="hidden md:block absolute left-[44%] -bottom-2 bg-[#FFD93D] text-[#1a1a2e] font-black text-sm rounded-2xl px-4 py-2 rotate-6 shadow-xl border-2 border-black/10">
              ✨ AI-powered
            </div>
            <div className="hidden md:block absolute right-[30%] top-4 bg-[#6C5CE7] text-white font-black text-sm rounded-full px-4 py-2 -rotate-6 shadow-xl">
              90% delivery
            </div>
          </div>
        </div>

        {/* Brand strip */}
        <div className="border-y border-black/5 bg-white/50 backdrop-blur">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            <span className="text-xs uppercase tracking-widest text-[#1a1a2e]/50 font-semibold">Powering teams at</span>
            {brands.map((b) => (
              <span key={b} className="text-lg md:text-xl font-black text-[#1a1a2e]/40 hover:text-[#1a1a2e] transition">
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { v: "5,000+", l: "Customers managed", c: "bg-[#FFD93D]" },
          { v: "20K+", l: "Orders tracked", c: "bg-[#A8E6CF]" },
          { v: "90%", l: "Delivery rate", c: "bg-[#FFB4A2]" },
          { v: "34%", l: "Avg. conversion lift", c: "bg-[#C8B6FF]" },
        ].map((s) => (
          <div key={s.l} className={`${s.c} rounded-3xl p-6 text-center border-2 border-black/10`}>
            <div className="text-4xl md:text-5xl font-black tracking-tight">{s.v}</div>
            <div className="text-sm font-semibold mt-2 text-[#1a1a2e]/70">{s.l}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center mb-14">
          <div>
            <div className="text-sm font-bold text-[#6C5CE7] mb-3 uppercase tracking-wider">Features</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Everything you need.<br />
              <span className="text-[#1a1a2e]/50">Nothing you don't.</span>
            </h2>
          </div>
          <p className="text-lg text-[#1a1a2e]/70">
            Modern tools for modern teams. No bloat, no learning curve, no 40-page onboarding doc. Just open it and ship a campaign in five minutes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const colors = ["bg-[#FFD93D]", "bg-[#C8B6FF]", "bg-[#A8E6CF]", "bg-[#FFB4A2]"];
            return (
              <div key={f.title} className="bg-white border-2 border-black/10 rounded-3xl p-6 hover:-translate-y-1 transition-transform">
                <div className={`h-12 w-12 rounded-2xl ${colors[i]} flex items-center justify-center mb-4 border-2 border-black/10`}>
                  <f.icon className="h-5 w-5 text-[#1a1a2e]" />
                </div>
                <div className="font-black text-lg">{f.title}</div>
                <p className="text-sm text-[#1a1a2e]/70 mt-2 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* SPLIT — Lifestyle */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-8 items-center bg-[#FFD93D] rounded-[2.5rem] p-8 md:p-12 border-2 border-black/10">
          <div>
            <div className="text-sm font-bold mb-3 uppercase tracking-wider">For people, not robots</div>
            <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
              Talk to customers like a human — at scale.
            </h3>
            <p className="mt-5 text-[#1a1a2e]/80 text-lg">
              No more generic blasts. Xeno helps you write messages that sound like you wrote them yourself — because you basically did.
            </p>
            <Link to="/auth">
              <Button size="lg" className="mt-6 bg-[#1a1a2e] hover:bg-[#2d2d4a] text-white rounded-full gap-2 h-12 px-7">
                Try it free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="relative h-[360px]">
            <img src={lifestyle2} alt="Happy marketer" loading="lazy" className="absolute inset-0 w-full h-full object-cover rounded-3xl border-4 border-white shadow-2xl rotate-2" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-sm font-bold text-[#6C5CE7] mb-3 uppercase tracking-wider">Loved by teams</div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Don't just take our word for it.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => {
            const bgs = ["bg-[#C8B6FF]", "bg-[#A8E6CF]", "bg-[#FFB4A2]"];
            return (
              <div key={t.name} className={`${bgs[i]} border-2 border-black/10 rounded-3xl p-7`}>
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-[#1a1a2e] text-[#1a1a2e]" />
                  ))}
                </div>
                <p className="text-base font-medium leading-relaxed">"{t.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <img src={t.image} alt={t.name} loading="lazy" width={1024} height={1024} className="h-12 w-12 rounded-full object-cover border-2 border-white" />
                  <div>
                    <div className="text-sm font-black">{t.name}</div>
                    <div className="text-xs text-[#1a1a2e]/70">{t.role}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="max-w-7xl mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1a1a2e] p-12 md:p-16 text-center text-white">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#6C5CE7] rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#FFD93D] rounded-full blur-3xl opacity-30" />
          <div className="relative">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">Ready to grow smarter?</h2>
            <p className="mt-4 text-white/70 max-w-xl mx-auto text-lg">
              Join hundreds of D2C brands using AI to talk to customers like humans — at scale.
            </p>
            <Link to="/auth">
              <Button size="lg" className="mt-8 bg-[#FFD93D] hover:bg-[#FFE45D] text-[#1a1a2e] rounded-full gap-2 h-13 px-8 text-base font-bold">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-black/5">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#1a1a2e]/60">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#6C5CE7] flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-black text-[#1a1a2e]">Xeno CRM</span>
            <span>© 2026</span>
          </div>
          <div className="flex gap-6 font-medium">
            <a href="#" className="hover:text-[#1a1a2e] transition">Privacy</a>
            <a href="#" className="hover:text-[#1a1a2e] transition">Terms</a>
            <a href="#" className="hover:text-[#1a1a2e] transition">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
