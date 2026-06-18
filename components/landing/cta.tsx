"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-32 md:py-44 border-t border-border bg-background text-foreground relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[450px] w-[450px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12 text-center space-y-10 relative z-10">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight font-serif uppercase leading-tight">
          Ready to Supercharge<br className="hidden sm:block" /> Your Workspace?
        </h2>
        
        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed font-sans">
          Take control of your inbox and schedule. Streamline Gmail & Google Calendar sync operations inside Locus.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-5 items-center justify-center pt-4">
          <Link
            href="/sign-up"
            className="group flex h-14 items-center justify-center gap-2.5 rounded-full bg-primary px-10 text-base font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-lg"
          >
            <span>✦ Start for Free</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-14 items-center justify-center gap-2.5 rounded-full border border-border/80 bg-card/40 hover:bg-card/90 px-10 text-base font-medium text-foreground backdrop-blur-sm active:scale-95 transition-all"
          >
            <Play className="h-4 w-4 fill-current text-primary" />
            <span>Watch Demo</span>
          </a>
        </div>

        <p className="text-sm text-muted-foreground font-mono pt-2">
          No credit card required. Connect instantly.
        </p>
      </div>
    </section>
  );
}
