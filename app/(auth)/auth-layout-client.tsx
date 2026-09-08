"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { ArrowLeft } from "lucide-react";
import { PulseBeams } from "@/components/ui/pulse-beams";

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({
    width: 1200,
    height: 800,
    cardLeft: 376,
    cardRight: 824,
    cardTop: 200,
    cardBottom: 600,
    cardHeight: 400,
  });

  useEffect(() => {
    const handleResize = () => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setDimensions({
        width,
        height,
        cardLeft: rect.left,
        cardRight: rect.right,
        cardTop: rect.top,
        cardBottom: rect.bottom,
        cardHeight: rect.height,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  const beams = [
    {
      path: `M 50,0 C 50,${dimensions.cardTop * 0.6} ${dimensions.cardLeft * 0.8},${dimensions.cardTop + 50} ${dimensions.cardLeft},${dimensions.cardTop + 50}`,
      gradientConfig: {
        initial: { x1: "-20%", x2: "-10%", y1: "0", y2: "0" },
        animate: { x1: ["-20%", "120%"], x2: ["-10%", "130%"] },
        transition: { duration: 4, repeat: Infinity, ease: "linear" }
      },
      connectionPoints: [{ cx: dimensions.cardLeft, cy: dimensions.cardTop + 50, r: 3.5 }]
    },
    {
      path: `M 0,${dimensions.height * 0.45} C ${dimensions.cardLeft * 0.5},${dimensions.height * 0.55} ${dimensions.cardLeft * 0.5},${dimensions.cardTop + dimensions.cardHeight * 0.4} ${dimensions.cardLeft},${dimensions.cardTop + dimensions.cardHeight * 0.4}`,
      gradientConfig: {
        initial: { x1: "-20%", x2: "-10%", y1: "0", y2: "0" },
        animate: { x1: ["-20%", "120%"], x2: ["-10%", "130%"] },
        transition: { duration: 3.2, repeat: Infinity, ease: "linear", delay: 0.5 }
      },
      connectionPoints: [{ cx: dimensions.cardLeft, cy: dimensions.cardTop + dimensions.cardHeight * 0.4, r: 3.5 }]
    },
    {
      path: `M 50,${dimensions.height} C 50,${dimensions.height - (dimensions.height - dimensions.cardBottom) * 0.6} ${dimensions.cardLeft * 0.8},${dimensions.cardBottom - 50} ${dimensions.cardLeft},${dimensions.cardBottom - 50}`,
      gradientConfig: {
        initial: { x1: "-20%", x2: "-10%", y1: "0", y2: "0" },
        animate: { x1: ["-20%", "120%"], x2: ["-10%", "130%"] },
        transition: { duration: 4.5, repeat: Infinity, ease: "linear", delay: 1.0 }
      },
      connectionPoints: [{ cx: dimensions.cardLeft, cy: dimensions.cardBottom - 50, r: 3.5 }]
    },
    {
      path: `M ${dimensions.width - 50},0 C ${dimensions.width - 50},${dimensions.cardTop * 0.6} ${dimensions.width - (dimensions.width - dimensions.cardRight) * 0.8},${dimensions.cardTop + 50} ${dimensions.cardRight},${dimensions.cardTop + 50}`,
      gradientConfig: {
        initial: { x1: "120%", x2: "110%", y1: "0", y2: "0" },
        animate: { x1: ["120%", "-20%"], x2: ["110%", "-30%"] },
        transition: { duration: 3.8, repeat: Infinity, ease: "linear", delay: 0.2 }
      },
      connectionPoints: [{ cx: dimensions.cardRight, cy: dimensions.cardTop + 50, r: 3.5 }]
    },
    {
      path: `M ${dimensions.width},${dimensions.height * 0.45} C ${dimensions.width - (dimensions.width - dimensions.cardRight) * 0.5},${dimensions.height * 0.55} ${dimensions.width - (dimensions.width - dimensions.cardRight) * 0.5},${dimensions.cardTop + dimensions.cardHeight * 0.4} ${dimensions.cardRight},${dimensions.cardTop + dimensions.cardHeight * 0.4}`,
      gradientConfig: {
        initial: { x1: "120%", x2: "110%", y1: "0", y2: "0" },
        animate: { x1: ["120%", "-20%"], x2: ["110%", "-30%"] },
        transition: { duration: 3.0, repeat: Infinity, ease: "linear", delay: 0.7 }
      },
      connectionPoints: [{ cx: dimensions.cardRight, cy: dimensions.cardTop + dimensions.cardHeight * 0.4, r: 3.5 }]
    },
    {
      path: `M ${dimensions.width - 50},${dimensions.height} C ${dimensions.width - 50},${dimensions.height - (dimensions.height - dimensions.cardBottom) * 0.6} ${dimensions.width - (dimensions.width - dimensions.cardRight) * 0.8},${dimensions.cardBottom - 50} ${dimensions.cardRight},${dimensions.cardBottom - 50}`,
      gradientConfig: {
        initial: { x1: "120%", x2: "110%", y1: "0", y2: "0" },
        animate: { x1: ["120%", "-20%"], x2: ["110%", "-30%"] },
        transition: { duration: 4.2, repeat: Infinity, ease: "linear", delay: 1.2 }
      },
      connectionPoints: [{ cx: dimensions.cardRight, cy: dimensions.cardBottom - 50, r: 3.5 }]
    }
  ];

  return (
    <div className="relative flex min-h-svh w-full flex-col items-center overflow-x-hidden overflow-y-auto bg-background transition-colors duration-300 auth-page-container">
      {/* Dynamic Theme color overlay */}
      <div className="absolute inset-0 z-0 bg-background/10 dark:bg-background/25 transition-colors duration-300 pointer-events-none" />

      {/* Premium Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.06)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70 dark:opacity-30 pointer-events-none" />

      {/* Floating Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full bg-radial from-[#c41e3a]/15 to-transparent blur-[120px] dark:from-[#c41e3a]/8" 
          style={{
            animation: "pulse-slow 8s ease-in-out infinite alternate"
          }}
        />
        <div 
          className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] rounded-full bg-radial from-[#3a3530]/20 to-transparent blur-[120px] dark:from-[#3a3530]/10" 
          style={{
            animation: "pulse-slower 12s ease-in-out infinite alternate"
          }}
        />
        <div 
          className="absolute top-1/4 right-1/4 w-[40%] h-[40%] rounded-full bg-radial from-[#c41e3a]/5 to-transparent blur-[100px] dark:from-[#c41e3a]/2" 
          style={{
            animation: "float-slow 15s ease-in-out infinite"
          }}
        />
      </div>

      {/* Pulse Beams Background Animation */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
        <PulseBeams
          beams={beams}
          width={dimensions.width}
          height={dimensions.height}
          baseColor="rgba(196, 30, 58, 0.12)"
          accentColor="rgba(196, 30, 58, 0.3)"
          gradientColors={{
            start: "#c41e3a",
            middle: "#ff4d6d",
            end: "#c41e3a",
          }}
          className="w-full h-full"
        />
      </div>

      {/* Embedded CSS Animations & Theme Variables */}
      <style jsx global>{`
        .auth-page-container {
          --background: #f5f1eb;
          --foreground: #0c0a09;
          --card: rgba(245, 241, 235, 0.12);
          --card-foreground: #0c0a09;
          --popover: #f5f1eb;
          --popover-foreground: #0c0a09;
          --primary: #c41e3a;
          --primary-foreground: #f5f1eb;
          --secondary: #c5bfb8;
          --secondary-foreground: #0c0a09;
          --accent: #eae5dd;
          --accent-foreground: #0c0a09;
          --muted: #c5bfb8;
          --muted-foreground: #78726a;
          --border: rgba(197, 191, 184, 0.4);
          --input: rgba(197, 191, 184, 0.6);
          --ring: #c41e3a;
          
          background-color: var(--background);
          color: var(--foreground);
        }

        .dark .auth-page-container {
          --background: #0c0a09;
          --foreground: #f5f1eb;
          --card: rgba(12, 10, 9, 0.2);
          --card-foreground: #f5f1eb;
          --popover: #0c0a09;
          --popover-foreground: #f5f1eb;
          --primary: #c41e3a;
          --primary-foreground: #f5f1eb;
          --secondary: #3a3530;
          --secondary-foreground: #f5f1eb;
          --accent: #24201c;
          --accent-foreground: #f5f1eb;
          --muted: #3a3530;
          --muted-foreground: #b8b2ab;
          --border: rgba(58, 53, 48, 0.4);
          --input: rgba(58, 53, 48, 0.6);
          --ring: #c41e3a;
        }

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
      <header className="sticky top-0 z-30 flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-4 md:px-8 shrink-0">
        <Link 
          href="/" 
          className="group flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 rounded-full hover:bg-muted/40 border border-border/20 bg-background/50 backdrop-blur-md"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to ARGON AI</span>
        </Link>

        <div className="flex items-center justify-center rounded-full border border-border/30 bg-background/50 p-1">
          <ModeToggle />
        </div>
      </header>

      {/* Content Container */}
      <main ref={cardRef} className="relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center px-3 py-4 sm:px-4 sm:py-8 my-auto animate-fade-in duration-500">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
