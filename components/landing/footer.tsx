"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Zap } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    alert(`Thank you for joining our newsletter list! (${email})`);
    setEmail("");
  };

  return (
    <footer className="border-t border-border bg-card text-foreground py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 lg:px-12">
        
        {/* Footer Top Grid */}
        <div className="grid gap-12 md:gap-16 md:grid-cols-4 pb-16 border-b border-border/40">
          
          {/* Logo & Tagline */}
          <div className="space-y-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
                <Zap className="h-4 w-4 fill-current text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-wider font-serif uppercase">
                Locus
              </span>
            </Link>
            <p className="text-base text-muted-foreground leading-relaxed font-sans max-w-xs">
              AI-powered command center for Gmail and Google Calendar. Secure, multi-tenant workspace sync.
            </p>
          </div>

          {/* Links: Explore */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">
              Explore
            </h4>
            <ul className="space-y-3 text-base text-muted-foreground font-sans">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#testimonials" className="hover:text-primary transition-colors">Testimonials</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#faqs" className="hover:text-primary transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Links: Company */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">
              Company
            </h4>
            <ul className="space-y-3 text-base text-muted-foreground font-sans">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Newsletter signup */}
          <div className="space-y-5">
            <h4 className="text-sm font-bold uppercase tracking-widest text-primary font-mono">
              Newsletter
            </h4>
            <p className="text-base text-muted-foreground font-sans leading-relaxed">
              Get Locus product updates and shortcuts delivered to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="flex gap-2.5 max-w-sm">
              <input
                type="email"
                required
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-background border border-border/80 rounded-lg px-4 py-2.5 text-base text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary font-sans"
              />
              <button
                type="submit"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition-transform shrink-0 self-center cursor-pointer"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer Bottom Block */}
        <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <span className="text-sm text-muted-foreground font-mono">
            &copy; 2026 Locus AI. All rights reserved.
          </span>

          <span className="text-base text-muted-foreground font-sans">
            Made with 💖 for <span className="text-foreground font-semibold">Locus</span>
          </span>

          {/* Socials */}
          <div className="flex gap-7 text-muted-foreground items-center justify-center">
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="LinkedIn">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
              </svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="Twitter">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" title="GitHub">
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
