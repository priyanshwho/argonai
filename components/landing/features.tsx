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
    <section id="features" className="min-h-screen flex flex-col justify-center  pb-4 md:pb-6 pt-20 md:pt-28 border-t border-border bg-background text-foreground relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-no-repeat bg-cover bg-center opacity-[0.05] dark:opacity-[0.7] pointer-events-none blur-md dark:blur-none"
        style={{ 
          backgroundImage: "url('/FEATURE-BGM.png')",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        <div className="text-center space-y-3 mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/60 px-4 py-1.5 text-xs font-mono text-primary">
            <Zap className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Power Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold font-serif text-foreground tracking-tight uppercase leading-tight">
            A New Standard for Workspace Efficiency
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            ARGON AI integrates your tools into a single, high-fidelity command center powered by private AI models.
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid gap-5 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <GlowCard
                key={index}
                customSize
                glowColor="red"
                className="rounded-xl bg-card/45 p-6 md:p-8 transition-all hover:bg-card/90 relative overflow-hidden group shadow-sm flex flex-col justify-start"
              >
                {/* Lines overlay background inside card */}
                <div 
                  className="absolute inset-0 pointer-events-none opacity-[0.10] dark:opacity-[0.06] z-0 lines-card-bg"
                  style={{
                    backgroundImage: "url('/lines.png')",
                    backgroundRepeat: "repeat",
                    backgroundPosition: "center",
                    backgroundSize: "150px",
                  }}
                />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="rounded-xl bg-secondary/20 p-3 w-fit text-primary mb-5 shadow-inner group-hover:scale-110 transition-transform">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2 font-serif uppercase tracking-wide lines-card-title">
                    {feature.title}
                  </h3>
                  
                  <p className="text-xs text-primary/80 mb-4 font-mono">
                    {feature.subtitle}
                  </p>

                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed font-sans">
                    {feature.description}
                  </p>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
