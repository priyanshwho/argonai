"use client";

import { Shield, Sparkles, BookOpen, UserCheck, BarChart3 } from "lucide-react";

export default function Features() {
  const featuresList = [
    {
      icon: BookOpen,
      title: "Arsenal of Algorithms",
      subtitle: "Alfred wouldn't send you into the field without preparation and neither do we.",
      description:
        "At Arkham Labs, every coding challenge is selected and sequenced to push your limits. Each problem is a weapon in your coding arsenal.",
    },
    {
      icon: UserCheck,
      title: "Wayne Enterprises Technology",
      subtitle: "Every hero needs a trusted advisor and elite training.",
      description:
        "Meet Alfred AI, your mentor who provides intelligent hints, code reviews, and strategic guidance. Train with fellow vigilantes through real-time collaborative coding.",
    },
    {
      icon: BarChart3,
      title: "Commissioner Commissioner's Reports",
      subtitle: "Even Batman checks in with Commissioner Commissioner.",
      description:
        "Our tracking system gives you detailed insights into your strengths, weaknesses, and historical performance. Watch your problem-solving improve week by week.",
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-zinc-900 bg-zinc-950 text-white relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 h-[300px] w-[300px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-16">
          <h2 className="text-3xl font-bold font-serif text-white tracking-tight sm:text-4xl uppercase">
            Features (you'll love)
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Your very own Alfred — here to prep, guide, and power you through every challenge.
          </p>
        </div>

        {/* Features Cards Grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featuresList.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 hover:border-amber-500/30 transition-all hover:bg-zinc-900/40 relative group overflow-hidden"
              >
                {/* Decorative border highlight */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent group-hover:via-amber-500/50 transition-all duration-500" />

                <div className="rounded-lg bg-zinc-900 p-3 w-fit text-[#f59e0b] mb-6 shadow-inner group-hover:scale-110 transition-transform">
                  <IconComponent className="h-6 w-6" />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2 font-serif uppercase tracking-wide">
                  {feature.title}
                </h3>
                
                <p className="text-xs text-amber-500/80 mb-4 font-mono">
                  {feature.subtitle}
                </p>

                <p className="text-sm text-zinc-400 leading-relaxed font-sans">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
