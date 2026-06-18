"use client";

import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ArrowLeft } from "lucide-react";

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 transition-colors duration-300">
      {/* Premium Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 dark:opacity-30 pointer-events-none" />

      {/* Floating Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-radial from-violet-500/15 to-transparent blur-[120px] dark:from-violet-500/8" 
          style={{
            animation: "pulse-slow 8s ease-in-out infinite alternate"
          }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full bg-radial from-amber-500/10 to-transparent blur-[120px] dark:from-amber-500/5" 
          style={{
            animation: "pulse-slower 12s ease-in-out infinite alternate"
          }}
        />
        <div 
          className="absolute top-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-radial from-pink-500/5 to-transparent blur-[100px] dark:from-pink-500/2" 
          style={{
            animation: "float-slow 15s ease-in-out infinite"
          }}
        />
      </div>

      {/* Embedded CSS Animations */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0% { transform: scale(1) translate(0px, 0px); opacity: 0.8; }
          100% { transform: scale(1.1) translate(20px, -20px); opacity: 1; }
        }
        @keyframes pulse-slower {
          0% { transform: scale(1) translate(0px, 0px); opacity: 0.7; }
          100% { transform: scale(1.15) translate(-30px, 30px); opacity: 0.9; }
        }
        @keyframes float-slow {
          0% { transform: translate(0px, 0px) rotate(0deg); }
          50% { transform: translate(30px, 40px) rotate(180deg); }
          100% { transform: translate(0px, 0px) rotate(360deg); }
        }
      `}</style>

      {/* Top Header Controls */}
      <header className="absolute top-0 left-0 right-0 z-10 flex w-full justify-between items-center px-6 py-4 md:px-8">
        <Link 
          href="/" 
          className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-full hover:bg-muted/40 border border-transparent hover:border-border/30"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Locus</span>
        </Link>

        <div className="flex items-center justify-center rounded-full border border-border/30 bg-background/50 p-1 backdrop-blur-xs">
          <ModeToggle />
        </div>
      </header>

      {/* Content Container */}
      <main className="relative z-10 w-full max-w-md animate-fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
