import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SIGN_IN_PATH } from "@/features/auth/utils";
import {
  Mail,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  SunMoon,
} from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PwaInstallCard } from "@/components/settings/pwa-install-card";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(SIGN_IN_PATH);
  }

  // Check which integrations are connected
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId: session.user.id },
    include: { integration: true },
  });

  const hasGmail = accounts.some(
    (a) => a.integration.name === "gmail" && !!(a.config as Record<string, unknown>)?.access_token
  );
  const hasCalendar = accounts.some(
    (a) => a.integration.name === "googlecalendar" && !!(a.config as Record<string, unknown>)?.access_token
  );

  const userName = session.user.name || "Workspace User";
  const userEmail = session.user.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Top sticky navigation bar */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3.5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.875rem)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-xl cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold font-serif text-foreground truncate">
                Settings
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Manage your connected accounts and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-8 sm:h-9 px-3 sm:px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span className="hidden xs:inline">Back to </span>Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
        
        {/* 1. Account Profile Card */}
        <section>
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={userName}
                  className="h-12 w-12 rounded-2xl border border-border object-cover shadow-sm"
                />
              ) : (
                <div className="h-12 w-12 rounded-2xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center text-base font-bold shadow-sm">
                  {userInitial}
                </div>
              )}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground text-sm sm:text-base truncate">
                    {userName}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 justify-end">
              <SignOutButton />
            </div>
          </div>
        </section>

        {/* 2. Connected Accounts (Gmail & Calendar) */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Connected Accounts
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Link your tools so ARGON AI can help read emails, draft replies, and schedule events.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            {/* Gmail */}
            <Card className="bg-card border-border/80 text-card-foreground shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      Gmail
                      {hasGmail && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Read, summarize, and draft emails
                    </CardDescription>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connect your inbox to let ARGON AI summarize long threads, find emails with natural language, and prepare draft replies.
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between">
                {hasGmail ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/gmail/connect">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 px-3 rounded-xl cursor-pointer"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not connected</div>
                    <a href="/api/integrations/gmail/connect">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-4 rounded-xl shadow-sm cursor-pointer"
                      >
                        Connect Gmail
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </Card>

            {/* Google Calendar */}
            <Card className="bg-card border-border/80 text-card-foreground shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      Google Calendar
                      {hasCalendar && (
                        <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      View schedules and book meetings
                    </CardDescription>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Connect your calendar to let ARGON AI check your availability, detect scheduling conflicts, and create new meetings.
                  </p>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between">
                {hasCalendar ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 px-3 rounded-xl cursor-pointer"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not connected</div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-4 rounded-xl shadow-sm cursor-pointer"
                      >
                        Connect Calendar
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </Card>
          </div>
        </section>

        {/* 3. Mobile & Desktop App */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Download & Install App
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Install ARGON AI on your devices for quick access anytime.
            </p>
          </div>

          <PwaInstallCard />
        </section>

        {/* 4. Appearance Preferences */}
        <section className="space-y-3">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <SunMoon className="h-4 w-4 text-muted-foreground" />
              Appearance
            </h2>
          </div>

          <Card className="border-border/80 bg-card p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-foreground">Theme Mode</div>
              <p className="text-xs text-muted-foreground">
                Switch between dark and light themes for your workspace.
              </p>
            </div>
            <ModeToggle />
          </Card>
        </section>

        {/* 5. Privacy Assurance */}
        <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs sm:text-sm font-bold text-foreground">
              Privacy & Data Protection
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your emails, calendar events, and conversations belong solely to you. ARGON AI never sells your data, never shares your correspondence, and never uses your personal information to train public AI models.
            </p>
          </div>
        </section>

      </main>
    </div>
  );
}
