"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface FooterLink {
  title: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterSection {
  label: string;
  links: FooterLink[];
}

const footerLinks: FooterSection[] = [
  {
    label: "Product",
    links: [
      { title: "Features", href: "#features" },
      { title: "Pricing", href: "#pricing" },
      { title: "Testimonials", href: "#testimonials" },
      { title: "FAQs", href: "#faqs" },
    ],
  },
  {
    label: "Company",
    links: [
      { title: "About Us", href: "#" },
      { title: "Careers", href: "#" },
      { title: "Contact", href: "#" },
    ],
  },
  {
    label: "Legal",
    links: [
      { title: "Privacy Policy", href: "#" },
      { title: "Terms of Service", href: "#" },
    ],
  },
  {
    label: "Social Links",
    links: [
      { 
        title: "Twitter", 
        href: "https://twitter.com", 
        icon: (props: { className?: string }) => (
          <svg className={props.className || "h-4 w-4 fill-current"} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        )
      },
      { 
        title: "LinkedIn", 
        href: "https://linkedin.com", 
        icon: (props: { className?: string }) => (
          <svg className={props.className || "h-4 w-4 fill-current"} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
          </svg>
        )
      },
      { 
        title: "GitHub", 
        href: "https://github.com", 
        icon: (props: { className?: string }) => (
          <svg className={props.className || "h-4 w-4 fill-current"} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
          </svg>
        )
      },
      { 
        title: "Instagram", 
        href: "https://instagram.com", 
        icon: (props: { className?: string }) => (
          <svg className={props.className || "h-4 w-4 stroke-current fill-none"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        )
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="md:rounded-t-6xl relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-border/40 bg-background bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-8 lg:py-10">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      {/* Animated Blurry Reddish Blobs */}
      <div className="absolute inset-0 overflow-hidden rounded-t-4xl md:rounded-t-6xl pointer-events-none z-0">
        <motion.div
          className="absolute -top-10 left-[10%] w-[320px] h-[320px] rounded-full bg-rose-500/8 dark:bg-rose-500/12 blur-[100px]"
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -30, 50, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-20 right-[15%] w-[300px] h-[300px] rounded-full bg-red-500/6 dark:bg-red-500/10 blur-[100px]"
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 40, -30, 0],
            scale: [1, 0.9, 1.1, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-[30%] left-[35%] w-[280px] h-[280px] rounded-full bg-rose-600/5 dark:bg-[#c41e3a]/8 blur-[90px]"
          animate={{
            x: [0, 50, -50, 0],
            y: [0, 50, -50, 0],
            scale: [1, 1.1, 0.85, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative z-10 grid w-full gap-8 xl:grid-cols-3 xl:gap-8 items-start">
        <AnimatedContainer className="space-y-4">
          <Link href="/" className="flex items-center select-none -mt-8">
            <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-20 w-auto" />
            <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-20 w-auto" />
          </Link>
          <p className="text-muted-foreground mt-2 text-sm font-sans max-w-xs leading-relaxed">
            AI-powered command center for Gmail and Google Calendar. Secure, multi-tenant workspace sync.
          </p>
          <p className="text-muted-foreground mt-4 text-xs font-mono">
            © {new Date().getFullYear()} ARGON AI. All rights reserved.
          </p>
        </AnimatedContainer>

        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section, index) => (
            <AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
              <div className="mb-10 md:mb-0">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-primary">{section.label}</h3>
                <ul className="text-muted-foreground mt-4 space-y-2 text-sm font-sans">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <a
                        href={link.href}
                        className="hover:text-primary inline-flex items-center transition-all duration-300 gap-1.5"
                      >
                        {link.icon && <link.icon className="size-4 shrink-0" />}
                        <span>{link.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedContainer>
          ))}
        </div>
      </div>
    </footer>
  );
}

type ViewAnimationProps = {
  delay?: number;
  className?: ComponentProps<typeof motion.div>["className"];
  children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
  return (
    <motion.div
      initial={{ filter: "blur(4px)", y: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", y: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
