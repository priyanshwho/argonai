import Link from "next/link";
import { Scale, ArrowLeft, Shield, AlertTriangle, HelpCircle } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Footer from "@/components/landing/footer";

export const metadata = {
  title: "Terms of Service | ARGON AI",
  description: "Terms of Service and User Agreement for ARGON AI Workspace Command Center.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col justify-between">
      {/* Background decorations */}
      <div className="absolute top-0 right-1/4 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-inner transition-colors">
              <Scale className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-serif uppercase text-foreground group-hover:text-primary transition-colors">
              ARGON AI
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <ModeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-mono border border-border/80 rounded-full px-3.5 py-1.5 hover:bg-card transition-all"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12 md:py-20 relative z-10">
        <div className="space-y-4 text-center mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/60 px-4 py-1 text-xs font-mono text-primary">
            <span>Effective Date: June 26, 2026</span>
          </div>
          <h1 id="terms-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif uppercase tracking-tight text-foreground">
            Terms of Service
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            Please read these terms carefully before accessing or using the ARGON AI workspace command center.
          </p>
        </div>

        <div className="bg-card/45 border border-border/60 rounded-2xl p-6 md:p-10 shadow-sm space-y-10 backdrop-blur-sm relative overflow-hidden">
          {/* Card pattern */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.01] z-0"
            style={{
              backgroundImage: "url('/lines.png')",
              backgroundRepeat: "repeat",
              backgroundPosition: "center",
              backgroundSize: "150px",
            }}
          />

          <div className="relative z-10 space-y-8 font-sans">
            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                <span>1. Acceptance of Terms</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                By signing up for, logging into, or using ARGON AI (operated under Arkham Labs), you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree with any part of these terms, you are prohibited from utilizing our service and must disconnect your integrations.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                <span>2. Description of Service</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                ARGON AI is an artificial intelligence-driven productivity tool. It integrates with Google Workspace via OAuth, synchronizing Gmail threads and Calendar events into a local, isolated dashboard. The service generates text summaries, drafts replies, searches messages, and checks calendar slots using large language models (LLMs).
              </p>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                <span>3. AI Disclaimer & Human-in-the-Loop Rule</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                ARGON AI uses generative artificial intelligence models to formulate summaries and email/calendar drafts. Generative AI may occasionally produce inaccurate, misleading, or incorrect text (commonly referred to as "hallucinations").
              </p>
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-xs md:text-sm text-foreground/90 font-mono leading-relaxed">
                <span className="font-bold text-primary">CRITICAL USER REQUIREMENT:</span> ARGON AI implements interactive drafting cards. You MUST review, verify, and approve all AI-drafted email replies and calendar events before clicking the "Send" or "Schedule" triggers. You assume full legal responsibility for any messages transmitted or scheduled via your connected Google Account.
              </div>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary shrink-0" />
                <span>4. Acceptable Use Guidelines</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                You agree not to use ARGON AI to:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-muted-foreground pl-2">
                <li>Send automated spam, phishing campaigns, or bulk marketing emails.</li>
                <li>Violate Google Workspace Acceptable Use Policies or standard API rate limits.</li>
                <li>Circumvent or compromise database isolation, tenant scopes, or user credentials.</li>
                <li>Engage in illegal activities or transmit defamatory, harmful, or abusive content.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                <span>5. Limitation of Liability & Disclaimers</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. ARGON AI DISCLAIMS ALL WARRANTIES, EXPRESSED OR IMPLIED, INCLUDING FITNESS FOR A PARTICULAR PURPOSE AND NON-INFRINGEMENT.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Under no circumstances shall ARGON AI, Arkham Labs, or its developers be liable for direct, indirect, incidental, or consequential damages resulting from data loss, sync errors, Google service outages, account revocation, or AI-generated output.
              </p>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2 flex items-center gap-2">
                <Trash2Icon className="h-5 w-5 text-primary shrink-0" />
                <span>6. Account Termination</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your access to ARGON AI if these Terms of Service are violated. You can delete your account and clear all local caches at any time via the Settings console.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-2 pt-4 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                For questions regarding these Terms of Service, contact us at{" "}
                <a href="mailto:terms@priyanshu.cv" className="text-primary hover:underline font-mono">
                  terms@priyanshu.cv
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Simple placeholder icon if Trash2 is not imported as Trash2Icon
function Trash2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
