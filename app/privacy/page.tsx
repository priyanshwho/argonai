import Link from "next/link";
import { Shield, ArrowLeft, Mail, Calendar, Eye, Trash2, Key } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import Footer from "@/components/landing/footer";

export const metadata = {
  title: "Privacy Policy | ArgonAI",
  description: "Privacy Policy and Google OAuth Data Disclosure for ArgonAI Workspace Command Center.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden flex flex-col justify-between">
      {/* Background visual decorations */}
      <div className="absolute top-0 left-1/4 h-[350px] w-[350px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 group select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-inner transition-colors">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-serif uppercase text-foreground group-hover:text-primary transition-colors">
              ArgonAI
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
          <h1 id="privacy-title" className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-serif uppercase tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
            ArgonAI values your privacy. This policy details how we handle, process, and protect your Google user data.
          </p>
        </div>

        <div className="bg-card/45 border border-border/60 rounded-2xl p-6 md:p-10 shadow-sm space-y-10 backdrop-blur-sm relative overflow-hidden">
          {/* Card background pattern overlay */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.01] z-0"
            style={{
              backgroundImage: "url('/lines.png')",
              backgroundRepeat: "repeat",
              backgroundPosition: "center",
              backgroundSize: "150px",
            }}
          />

          <div className="relative z-10 space-y-8">
            {/* Section 1 */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2">
                1. Overview & Google User Data Policy Compliance
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                ArgonAI integrates directly with Google Workspace APIs (Gmail and Google Calendar) to create a unified inbox and scheduler co-pilot. Our use and transfer of information received from Google APIs to any other app will adhere to the{" "}
                <a 
                  href="https://developers.google.com/terms/api-services-user-data-policy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements.
              </p>
            </section>

            {/* Section 2 */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2">
                2. What Google Data We Access
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                To activate the AI assistant, ArgonAI requests permission to connect to your Google Account. We access:
              </p>
              <div className="grid gap-4 sm:grid-cols-2 mt-2">
                <div className="flex gap-3 bg-secondary/10 border border-border/30 rounded-xl p-4">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-foreground uppercase">Gmail Data</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      We read email threads, headers, subject lines, senders, snippets, dates, and drafts. We only write or send emails directly upon your confirmation of AI-drafted cards.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 bg-secondary/10 border border-border/30 rounded-xl p-4">
                  <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-mono text-sm font-semibold text-foreground uppercase">Google Calendar Data</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      We retrieve event summaries, locations, descriptions, start/end times, and attendees to check slots, identify overlaps, and schedule new meetings.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2">
                3. Why We Access It (Purpose)
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                All data is accessed strictly to power your personalized AI Workspace experience:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground pl-2">
                <li><span className="font-semibold text-foreground">AI Email Summaries:</span> To parse incoming messages and compile instant thread bullet points.</li>
                <li><span className="font-semibold text-foreground">AI Reply Drafting:</span> To draft emails that match your context, past conversation style, and tone instructions.</li>
                <li><span className="font-semibold text-foreground">Conflict Checking:</span> To check overlaps in calendar schedules when drafting calendar invite cards.</li>
                <li><span className="font-semibold text-foreground">Workspace Search:</span> To query message snippets and events via natural language prompts in the chat panel.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2">
                4. Data Storage & Encryption Guidelines
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Security is paramount. Our data storage guidelines ensure that:
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <Key className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p>
                    <span className="font-semibold text-foreground">Double-Envelope Encryption:</span> Local cache entities (such as synchronizer state lists) are stored inside our isolated PostgreSQL database, fully encrypted using a system environment key (<code className="bg-secondary/20 px-1 rounded text-primary">CORSAIR_KEK</code>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Eye className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p>
                    <span className="font-semibold text-foreground">No Permanent Email Body Retention:</span> We cache mail headers (subject, sender, date, snippets) locally to facilitate lightning-fast searches. Full email contents are fetched dynamically from the Google APIs on-demand and are never persistently stored.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p>
                    <span className="font-semibold text-foreground">Zero Third-Party Training:</span> Your emails and calendar entries are passed transiently to Google Gemini LLM API routes solely to fulfill requested summaries and drafts. We never train custom AI models on your personal data, nor do we sell your data to brokers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-4">
              <h2 className="text-xl md:text-2xl font-bold font-serif uppercase text-foreground border-b border-border/40 pb-2">
                5. Revocation & Account Deletion
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                You retain complete control of your workspace connections:
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <Trash2 className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p>
                    <span className="font-semibold text-foreground">Deleting Your Account:</span> In the dashboard configurations settings page, you can delete your ArgonAI account. This instantly executes a cascade delete, purging all saved sessions, conversations, user accounts, and local integration metadata from our database.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-primary shrink-0 mt-1" />
                  <p>
                    <span className="font-semibold text-foreground">Revoking Google OAuth:</span> You can disconnect ArgonAI access at any time through Google's Account Security permissions console at{" "}
                    <a 
                      href="https://myaccount.google.com/permissions" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono"
                    >
                      myaccount.google.com/permissions
                    </a>.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-2 pt-4 border-t border-border/40 text-center">
              <p className="text-sm text-muted-foreground">
                Questions about our Privacy Policy or OAuth implementations? Contact us at{" "}
                <a href="mailto:privacy@priyanshu.cv" className="text-primary hover:underline font-mono">
                  privacy@priyanshu.cv
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
