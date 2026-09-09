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
  Settings,
  Activity,
  AlertTriangle,
  ShieldCheck,
  Clock,
  User,
  ExternalLink,
  Lock,
  RefreshCw,
  Sparkles,
  Database,
  Radio,
  Check,
} from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { PwaInstallCard } from "@/components/settings/pwa-install-card";
import { CopyTenantButton } from "@/components/settings/copy-tenant-button";

function formatEventName(eventType: string): string {
  const lower = eventType.toLowerCase();
  if (lower.includes("labelchanged") || lower.includes("messagechanged")) {
    return "Inbox Updated";
  }
  if (lower.includes("messages.send")) {
    return "Email Response Sent";
  }
  if (lower.includes("messages.get") || lower.includes("messages.list")) {
    return "Email Synchronized";
  }
  if (lower.includes("events.create") || lower.includes("events.insert")) {
    return "Calendar Event Created";
  }
  if (lower.includes("events.get") || lower.includes("events.list") || lower.includes("events.watch")) {
    return "Calendar Synchronized";
  }
  return eventType.split(".").pop() || eventType;
}

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(SIGN_IN_PATH);
  }

  // 1. Fetch user integration details from Prisma
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

  const gmailAccount = accounts.find(
    (a) => a.integration.name === "gmail" && !!(a.config as Record<string, unknown>)?.access_token
  );
  const calendarAccount = accounts.find(
    (a) => a.integration.name === "googlecalendar" && !!(a.config as Record<string, unknown>)?.access_token
  );

  // 2. Fetch direct Corsair DB synced counts
  let emailCount = 0;
  let eventCount = 0;

  if (gmailAccount) {
    emailCount = await prisma.corsairEntity.count({
      where: { accountId: gmailAccount.id, entityType: "messages" },
    });
  }

  if (calendarAccount) {
    eventCount = await prisma.corsairEntity.count({
      where: { accountId: calendarAccount.id, entityType: "events" },
    });
  }

  // 3. Determine dynamic Webhook metrics
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/webhooks`;

  // 4. Fetch last 6 sync event notifications
  const syncLogs = await prisma.corsairEvent.findMany({
    where: {
      account: {
        tenantId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
    include: {
      account: {
        include: {
          integration: true,
        },
      },
    },
  });

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
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-xl"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold font-serif text-foreground truncate">
                  Configuration
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                  Settings
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                Integrations, PWA mobile install, sync engines, and security
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-8 sm:h-9 px-3 sm:px-4 rounded-xl shadow-sm transition-all"
              >
                <span className="hidden xs:inline">Back to </span>Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-300 pb-16">
        {/* ── 1. ACCOUNT & TENANT IDENTITY OVERVIEW ── */}
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

          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 border border-border/70 text-xs">
              <span className="text-muted-foreground text-[11px] font-medium">Tenant ID:</span>
              <code className="text-foreground font-mono text-[11px] max-w-[120px] sm:max-w-[150px] truncate">
                {session.user.id}
              </code>
              <CopyTenantButton tenantId={session.user.id} />
            </div>
          </div>
        </div>

        {/* ── 2. MOBILE & DESKTOP APPLICATION (PWA) ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Application & Mobile Download
            </h2>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
              Progressive Web App
            </span>
          </div>

          <PwaInstallCard />
        </section>

        {/* ── 3. SERVICE CONNECTIONS / INTEGRATIONS ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              Connected Workspace Tools
            </h2>
            <span className="text-[11px] text-muted-foreground font-medium">
              Google Workspace API
            </span>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            {/* Gmail integration card */}
            <Card className="bg-card border-border/80 text-card-foreground shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      Gmail Inbox
                      {hasGmail && (
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Index, search, and draft emails
                    </CardDescription>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Authorizes ARGON AI to securely read messages, build fast search indexes, and
                    prepare smart draft responses for your inbox.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      gmail.readonly
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      gmail.compose
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      gmail.modify
                    </span>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between">
                {hasGmail ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/gmail/connect">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 px-3"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                    <a href="/api/integrations/gmail/connect">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-4 shadow-sm"
                      >
                        Connect Gmail
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </Card>

            {/* Google Calendar integration card */}
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
                      Manage events, schedules & conflicts
                    </CardDescription>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-1 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permits the AI assistant to track upcoming meetings, check slot conflicts in
                    natural language, and book appointments.
                  </p>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      calendar.events
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                      calendar.readonly
                    </span>
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-3 border-t border-border/60 flex items-center justify-between">
                {hasCalendar ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/15 border border-blue-500/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs border-border hover:bg-muted text-muted-foreground hover:text-foreground h-8 px-3"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-4 shadow-sm"
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

        {/* ── 4. SYNC ENGINE & CACHE METRICS ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              Sync Engine & Cache Metrics
            </h2>
            <span className="text-[11px] text-muted-foreground font-medium">Real-Time</span>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <Card className="bg-card border-border/80 text-card-foreground shadow-sm">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardDescription className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">
                  Indexed Emails
                </CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold font-serif text-foreground mt-1">
                  {emailCount.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span>Ready for AI vector & keyword search</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/80 text-card-foreground shadow-sm">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardDescription className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">
                  Synced Events
                </CardDescription>
                <CardTitle className="text-2xl sm:text-3xl font-extrabold font-serif text-foreground mt-1">
                  {eventCount.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span>Cached calendar appointment records</span>
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/80 text-card-foreground shadow-sm">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardDescription className="text-muted-foreground text-[11px] uppercase font-bold tracking-wider">
                  Webhook Pipeline
                </CardDescription>
                <CardTitle className="text-lg sm:text-xl font-bold text-emerald-500 flex items-center gap-2 mt-1">
                  <Radio className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                  Active & Live
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <p className="text-xs text-muted-foreground leading-relaxed truncate" title={webhookUrl}>
                  {webhookUrl}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── 5. LIVE WORKSPACE SYNC LOG ── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Sync Event Logs
            </h2>
            <span className="text-[11px] bg-muted border border-border text-muted-foreground px-2 py-0.5 rounded font-mono">
              Latest {syncLogs.length} events
            </span>
          </div>

          <Card className="bg-card border-border/80 text-card-foreground shadow-sm overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/60">
              {syncLogs.length === 0 ? (
                <div className="p-8 text-center text-xs sm:text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <AlertTriangle className="h-7 w-7 text-muted-foreground/60" />
                  <span>No sync logs or webhook transactions registered in database yet.</span>
                </div>
              ) : (
                syncLogs.map((log) => {
                  const serviceName =
                    log.account.integration.name === "gmail" ? "Gmail" : "Calendar";
                  const dateStr = new Date(log.createdAt).toLocaleString();
                  const isSuccess =
                    log.status === "success" || log.status === "completed" || !log.status;

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/40 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`font-semibold text-[10px] px-2 py-0.5 rounded-md shrink-0 border ${
                            log.account.integration.name === "gmail"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          }`}
                        >
                          {serviceName}
                        </span>
                        <span className="text-foreground font-medium truncate">
                          {formatEventName(log.eventType)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-muted-foreground text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isSuccess
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                              : "bg-red-500/10 text-red-500 border-red-500/25"
                          }`}
                        >
                          {isSuccess ? "SUCCESS" : "FAILED"}
                        </span>
                        <span className="font-mono text-[10px]">{dateStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── 6. ENTERPRISE SECURITY & PRIVACY CARD ── */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              Enterprise-Grade Security & Isolation
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted border border-border">
                CORSAIR_KEK
              </span>
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              All credentials and indexed records are encrypted using double-envelope cryptographic
              keys. Your personal correspondence, calendar entries, and AI queries are isolated to
              your unique Tenant ID and will never be shared with other users or used for foundation model training.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
