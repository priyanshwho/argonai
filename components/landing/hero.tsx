"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Cpu, Target } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative pt-24 pb-20 sm:pt-32 sm:pb-28 overflow-hidden bg-zinc-950 text-white">
      {/* Arkham background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 h-[600px] w-full max-w-7xl opacity-20 blur-[130px] pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] h-[350px] w-[350px] rounded-full bg-gradient-to-r from-amber-600 to-yellow-500"></div>
        <div className="absolute top-[20%] right-[10%] h-[300px] w-[300px] rounded-full bg-gradient-to-r from-[#111827] to-[#f59e0b]"></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Early Access & Sticker-like badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 hero-content-fade">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3.5 py-1 text-xs font-medium text-amber-500 backdrop-blur-sm shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>Early Access Active</span>
          </div>

          {/* Stickers */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] text-zinc-400 font-mono">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
            <span>Wayne Tech</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] text-zinc-400 font-mono">
            <Cpu className="h-3.5 w-3.5 text-zinc-500" />
            <span>Alfred-AI v1.5</span>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] text-zinc-400 font-mono">
            <Target className="h-3.5 w-3.5 text-zinc-500" />
            <span>GCPD Approved</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="hero-header-text mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl font-serif leading-tight">
          Welcome to <br />
          <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-zinc-500 bg-clip-text text-transparent uppercase tracking-wider font-mono">
            Arkham Labs
          </span>
        </h1>

        {/* Subtitle */}
        <p className="hero-content-fade mx-auto max-w-2xl text-lg text-zinc-400 leading-relaxed font-sans">
          Where elite minds sharpen their coding powers. Train in silence and conquer your technical interviews.
        </p>

        {/* Action Button */}
        <div className="hero-content-fade flex flex-col sm:flex-row gap-4 items-center justify-center pt-4">
          <Link
            href="/sign-up"
            className="group flex h-12 items-center justify-center gap-2 rounded-full bg-[#f59e0b] px-6 text-sm font-semibold text-zinc-950 hover:bg-[#d97706] active:scale-95 transition-all shadow-lg"
          >
            <span>✦ Get Started</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Trusted By */}
        <div className="hero-content-fade pt-12">
          <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Trusted by developers from top tech companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 pt-6 opacity-40 grayscale contrast-200">
            <span className="text-sm font-bold tracking-wider font-mono">GOOGLE</span>
            <span className="text-sm font-bold tracking-wider font-mono">META</span>
            <span className="text-sm font-bold tracking-wider font-mono">AMAZON</span>
            <span className="text-sm font-bold tracking-wider font-mono">NETFLIX</span>
            <span className="text-sm font-bold tracking-wider font-mono">MICROSOFT</span>
          </div>
        </div>
      </div>
    </section>
  );
}
