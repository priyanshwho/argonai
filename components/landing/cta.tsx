"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-20 border-t border-zinc-900 bg-zinc-950 text-white relative overflow-hidden">
      {/* Background bat-signal-like glowing gradient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[350px] w-[350px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl font-serif uppercase">
          Ready to Embrace the Night?
        </h2>
        
        <p className="mx-auto max-w-xl text-base text-zinc-400 leading-relaxed font-sans">
          Behind every great coder is a darker chapter of quiet practice. Start yours — inside Arkham Labs.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-2">
          <Link
            href="/sign-up"
            className="group flex h-12 items-center justify-center gap-2 rounded-full bg-[#f59e0b] px-6 text-sm font-semibold text-zinc-950 hover:bg-[#d97706] active:scale-95 transition-all shadow-lg"
          >
            <span>✦ Start Training</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 px-6 text-sm font-medium text-zinc-300 hover:text-white backdrop-blur-sm active:scale-95 transition-all"
          >
            <Play className="h-4 w-4 fill-current text-zinc-400" />
            <span>Watch Demo</span>
          </a>
        </div>

        <p className="text-xs text-zinc-500 font-mono">
          No credit card required. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
