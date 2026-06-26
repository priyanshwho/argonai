"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f59e0b] text-zinc-950 shadow-inner group-hover:bg-[#d97706] transition-colors">
            <Shield className="h-5 w-5 fill-current text-zinc-950" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white font-serif uppercase">
            Arkham Labs
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="/#features" className="nav-anim-link hover:text-white transition-colors">
            Features
          </a>
          <a href="/#testimonials" className="nav-anim-link hover:text-white transition-colors">
            Testimonials
          </a>
          <a href="/#pricing" className="nav-anim-link hover:text-white transition-colors">
            Pricing
          </a>
          <a href="/#faqs" className="nav-anim-link hover:text-white transition-colors">
            FAQs
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <div className="nav-toggle-fade flex items-center justify-center">
            <ModeToggle />
          </div>
          <Link
            href="/sign-in"
            className="nav-anim-link text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            className="nav-anim-link flex h-9 items-center justify-center rounded-full bg-[#f59e0b] px-4 text-sm font-semibold text-zinc-950 hover:bg-[#d97706] active:scale-95 transition-all"
          >
            Sign Up ✦
          </Link>
        </div>
      </div>
    </header>
  );
}
