import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Target, Megaphone, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Xeno CRM — AI-native, chat-first CRM for D2C brands" },
      { name: "description", content: "Define audiences in natural language, draft messages with AI, and send campaigns through a simulated delivery pipeline. Built for the Xeno internship assignment." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const features = [
    { icon: Target, title: "Smart segments", body: "Describe an audience in natural language — \"high spenders inactive 60 days\" — and the agent builds the rules." },
    { icon: Megaphone, title: "AI message variants", body: "Three on-brand drafts (friendly, urgent, value) in one click, with {{name}} personalization." },
    { icon: Sparkles, title: "Stubbed channel service", body: "Per-message delivery log with ~90% delivered / 10% failed simulating a real vendor + receipt loop." },
    { icon: MessageSquare, title: "Chat-first agent", body: "Run the whole flow — segment → draft → send → review — from one conversation." },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="px-6 py-4 flex items-center justify-between border-b">
        <div className="font-bold tracking-tight">Xeno CRM</div>
        <Link to="/auth"><Button variant="outline" size="sm">Sign in</Button></Link>
      </header>
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-xs mb-6">
          <Sparkles className="h-3 w-3" /> Internship assignment build
        </div>
        <h1 className="text-5xl font-bold tracking-tight">An AI-native CRM for D2C brands.</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Ingest customers & orders, build segments in plain English, draft messages with AI, send through a simulated delivery pipeline, and read the funnel.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth"><Button size="lg">Get started</Button></Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-6 pb-20 grid md:grid-cols-2 gap-4">
        {features.map((f) => (
          <div key={f.title} className="border rounded-xl p-5 bg-card">
            <f.icon className="h-5 w-5 mb-3" />
            <div className="font-semibold">{f.title}</div>
            <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
