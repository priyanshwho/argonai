"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Shield } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    alert(`Welcome to the League, recruit! (${email})`);
    setEmail("");
  };

  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 text-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Footer Top Grid */}
        <div className="grid gap-12 md:grid-cols-4 pb-12 border-b border-zinc-900">
          
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b] text-zinc-950">
                <Shield className="h-4 w-4 fill-current text-zinc-950" />
              </div>
              <span className="text-base font-bold tracking-wider font-serif uppercase">
                Arkham Labs
              </span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans max-w-xs">
              Train in silence, track your code reports, and walk into your next big coding interview with supreme confidence.
            </p>
          </div>

          {/* Links: Explore */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] font-mono">
              Explore
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400 font-sans">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Links: Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] font-mono">
              Company
            </h4>
            <ul className="space-y-2 text-sm text-zinc-400 font-sans">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#f59e0b] font-mono">
              Join the League
            </h4>
            <p className="text-xs text-zinc-500 font-sans">
              Get early access and training tips delivered straight to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-850 rounded-lg px-3.5 py-1.5 text-xs text-white placeholder-zinc-550 focus:outline-none focus:border-amber-500 font-sans"
              />
              <button
                type="submit"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b] text-zinc-950 hover:bg-[#d97706] active:scale-95 transition-transform shrink-0 self-center"
              >
                <Send className="h-3.5 w-3.5 text-zinc-950" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom Block */}
        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="text-[11px] text-zinc-600 font-mono">
            &copy; 2026 Arkham Labs. All rights reserved.
          </span>

          <span className="text-xs text-zinc-400 font-sans">
            Made with Pain 💖 by <span className="text-zinc-200">Kapil</span> in Chandigarh, India
          </span>

          {/* Socials */}
          <div className="flex gap-6 text-zinc-500 items-center justify-center">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#f59e0b] transition-colors" title="LinkedIn">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#f59e0b] transition-colors" title="Twitter">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#f59e0b] transition-colors" title="GitHub">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#f59e0b] transition-colors" title="YouTube">
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
