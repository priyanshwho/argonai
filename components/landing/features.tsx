"use client";

import { Mail, Calendar, Cpu, Zap } from "lucide-react";
import { GlowCard } from "@/components/ui/spotlight-card";

export default function Features() {
  const featuresList = [
    {
      icon: Mail,
      title: "Unified Workspace Inbox",
      subtitle: "Secure Gmail Cache Synchronizer",
      description:
        "ARGON AI integrates directly with Gmail, parsing incoming threads and cache updates in real-time. Experience a clean, single-pane inbox designed for rapid navigation and search.",
    },
    {
      icon: Cpu,
      title: "AI Assistant Co-Pilot",
      subtitle: "Gemini-Powered Workspace intelligence",
      description:
        "Your private assistant reads your cached context, drafts relevant, professional email replies, organizes tasks, and writes code scripts to optimize email sorting.",
    },
    {
      icon: Calendar,
      title: "Calendar Board Optimizer",
      subtitle: "Interactive Schedule & Slot Planner",
      description:
        "Connect Google Calendar to let ARGON AI check slot availability, schedule complex group invites, track time zones, and outline agenda sheets directly via text prompts.",
    },
  ];

  return (
    <section id="features" className="py-32 md:py-40 border-t border-border bg-background text-foreground relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="text-center space-y-5 mb-20 md:mb-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-5 py-2 text-sm font-mono text-primary">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
            <span>Power Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-serif text-foreground tracking-tight uppercase leading-tight">
            A New Standard for<br className="hidden sm:block" /> Workspace Efficiency
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            ARGON AI integrates your tools into a single, high-fidelity command center powered by private AI models.
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid gap-6 md:gap-8 lg:gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <GlowCard
                key={index}
                customSize
                glowColor="red"
                className="rounded-xl bg-card/45 p-8 md:p-10 transition-all hover:bg-card/90 relative group shadow-sm flex flex-col justify-start"
              >
                {/* Decorative border highlight */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-primary/50 transition-all duration-500" />

                <div className="rounded-xl bg-secondary/20 p-4 w-fit text-primary mb-7 shadow-inner group-hover:scale-110 transition-transform">
                  <IconComponent className="h-8 w-8" />
                </div>
                
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3 font-serif uppercase tracking-wide">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-primary/80 mb-5 font-mono">
                  {feature.subtitle}
                </p>

                <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-sans">
                  {feature.description}
                </p>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
