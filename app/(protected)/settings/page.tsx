import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SIGN_IN_PATH } from "@/features/auth/utils";
import { 
  Mail, Calendar, ArrowLeft, CheckCircle2, Settings, 
  Activity, AlertTriangle, ShieldCheck, Clock
} from "lucide-react";
import Link from "next/link";
import { ModeToggle } from "@/components/ui/mode-toggle";
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
  return eventType.split('.').pop() || eventType;
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

  const hasGmail = accounts.some((a) => a.integration.name === "gmail");
  const hasCalendar = accounts.some((a) => a.integration.name === "googlecalendar");

  const gmailAccount = accounts.find((a) => a.integration.name === "gmail");
  const calendarAccount = accounts.find((a) => a.integration.name === "googlecalendar");

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

  // 4. Fetch last 5 sync event notifications
  const syncLogs = await prisma.corsairEvent.findMany({
    where: {
      account: {
        tenantId: session.user.id,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
    include: {
      account: {
        include: {
          integration: true,
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Top bar with back navigation */}
        <header className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9 border-zinc-800 bg-zinc-900 text-zinc-350 hover:bg-zinc-800 hover:text-white"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold font-serif text-white tracking-tight flex items-center gap-3">
                <Settings className="h-7 w-7 text-zinc-400" />
                Settings & Caches
              </h1>
              <p className="text-base text-zinc-400 mt-1.5">Configure connection tokens, webhook setups, and track sync records.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link href="/dashboard">
              <Button className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold text-sm h-10 px-4 rounded-xl shadow-sm cursor-pointer">
                Back to Workspace
              </Button>
            </Link>
          </div>
        </header>

        {/* Integration Credentials Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Service Connections</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Gmail integration card */}
            <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-white">Gmail Account</CardTitle>
                  <CardDescription className="text-zinc-500 text-xs">Read and draft messages</CardDescription>
                </div>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <Mail className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-zinc-350 leading-relaxed min-h-[48px] flex items-center">
                  Securely connects your Gmail account so the AI assistant can help you search messages, summarize threads, and draft replies.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-950">
                  {hasGmail ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 font-medium">Not connected</div>
                  )}
                  
                  {!hasGmail ? (
                    <a href="/api/integrations/gmail/connect">
                      <Button className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs py-1.5 px-4 rounded-lg cursor-pointer">
                        Connect Gmail
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Managed securely</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar integration card */}
            <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold text-white">Google Calendar</CardTitle>
                  <CardDescription className="text-zinc-550 text-xs">Schedule and track invites</CardDescription>
                </div>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <Calendar className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-zinc-350 leading-relaxed min-h-[48px] flex items-center">
                  Connects your Google Calendar so the AI assistant can track your schedule, check slot availability, and book meetings.
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-zinc-950">
                  {hasCalendar ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-3 py-1 rounded-full">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500 font-medium">Not connected</div>
                  )}

                  {!hasCalendar ? (
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs py-1.5 px-4 rounded-lg cursor-pointer">
                        Connect Calendar
                      </Button>
                    </a>
                  ) : (
                    <span className="text-xs text-zinc-500 italic">Managed securely</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Sync Statistics Section */}
        <section className="grid gap-6 md:grid-cols-3">
          
          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Indexed Emails</CardDescription>
              <CardTitle className="text-3xl font-bold font-serif text-white">{emailCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400 leading-relaxed flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-emerald-500" />
                Total messages ready for AI search
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Indexed Events</CardDescription>
              <CardTitle className="text-3xl font-bold font-serif text-white">{eventCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400 leading-relaxed flex items-center gap-1.5">
                <Activity className="h-4 w-4 text-blue-500" />
                Total calendar records synced
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 text-xs uppercase font-bold tracking-wider">Sync Connection</CardDescription>
              <CardTitle className="text-lg font-bold text-emerald-450 flex items-center gap-1.5">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Active & Secure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Real-time synchronization with secure Google servers is enabled.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Sync History / Event logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-zinc-500" />
              Live Workspace Sync Log
            </h2>
            <span className="text-xs bg-zinc-900 border border-zinc-800 text-zinc-500 px-2.5 py-0.5 rounded font-mono">
              Last 5 sync updates
            </span>
          </div>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md overflow-hidden">
            <CardContent className="p-0 divide-y divide-zinc-950">
              {syncLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-zinc-500 flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-zinc-650" />
                  <span>No sync logs or webhook transactions registered in database yet.</span>
                </div>
              ) : (
                syncLogs.map((log) => {
                  const serviceName = log.account.integration.name === "gmail" ? "Gmail" : "Calendar";
                  const dateStr = new Date(log.createdAt).toLocaleString();
                  const isSuccess = log.status === "success" || log.status === "completed" || !log.status; // defaults to success

                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between text-sm hover:bg-zinc-900/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-sans text-xs font-bold px-2 py-0.5 rounded ${
                            log.account.integration.name === "gmail" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {serviceName}
                          </span>
                          <span className="text-zinc-200 font-semibold">{formatEventName(log.eventType)}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                          isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {isSuccess ? "SUCCESS" : "FAILED"}
                        </span>
                        <span className="text-xs text-zinc-500">{dateStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* Info banner */}
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-6 flex gap-4 items-start shadow-sm backdrop-blur-sm">
          <ShieldCheck className="h-7 w-7 text-emerald-550 shrink-0 mt-0.5" />
          <div className="text-base text-zinc-350 leading-relaxed">
            <strong>Enterprise-Grade Security:</strong> All connections are secured under dynamic multi-tenant credentials. To guarantee maximum privacy, the Corsair engine uses double-envelope database encryption powered by your private environment key (<code className="text-zinc-300 font-mono">CORSAIR_KEK</code>), ensuring complete client isolation.
          </div>
        </div>

      </div>
    </div>
  );
}
