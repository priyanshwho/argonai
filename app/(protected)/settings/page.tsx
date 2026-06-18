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
              <h1 className="text-xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
                <Settings className="h-5.5 w-5.5 text-zinc-400" />
                Settings & Caches
              </h1>
              <p className="text-xs text-zinc-500">Configure connection tokens, webhook setups, and track sync records.</p>
            </div>
          </div>
          <Link href="/dashboard">
            <Button size="sm" className="bg-zinc-100 text-zinc-950 hover:bg-zinc-200 font-semibold text-xs rounded-lg shadow-sm">
              Back to Workspace
            </Button>
          </Link>
        </header>

        {/* Integration Credentials Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Service Connections</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            
            {/* Gmail integration card */}
            <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold">Gmail Integration</CardTitle>
                  <CardDescription className="text-zinc-550 text-[10px]">Indexed correspondence cache</CardDescription>
                </div>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px] flex items-center">
                  Syncs your Gmail inbox to the local PostgreSQL database, allowing rapid AI search indexing without rate limits.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-950">
                  {hasGmail ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-550 font-medium">Not connected</div>
                  )}
                  
                  {!hasGmail ? (
                    <a href="/api/integrations/gmail/connect">
                      <Button size="xs" className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs py-1 px-3.5 rounded-lg cursor-pointer">
                        Connect Gmail
                      </Button>
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-550 italic">Managed by Corsair</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Google Calendar integration card */}
            <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                <div>
                  <CardTitle className="text-sm font-bold">Google Calendar</CardTitle>
                  <CardDescription className="text-zinc-550 text-[10px]">Meetings & scheduler agent</CardDescription>
                </div>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px] flex items-center">
                  Links your calendar schedules so the AI assistant can verify slot availability and book invites directly.
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-950">
                  {hasCalendar ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-550 font-medium">Not connected</div>
                  )}

                  {!hasCalendar ? (
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button size="xs" className="bg-white text-black hover:bg-zinc-200 font-semibold text-xs py-1 px-3.5 rounded-lg cursor-pointer">
                        Connect Calendar
                      </Button>
                    </a>
                  ) : (
                    <span className="text-[10px] text-zinc-550 italic">Managed by Corsair</span>
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
              <CardDescription className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Synced Emails</CardDescription>
              <CardTitle className="text-2xl font-bold font-serif text-white">{emailCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-zinc-450 leading-relaxed flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Total cached Gmail messages
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Synced Events</CardDescription>
              <CardTitle className="text-2xl font-bold font-serif text-white">{eventCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-zinc-450 leading-relaxed flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
                Total cached calendar records
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md">
            <CardHeader className="pb-2">
              <CardDescription className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">Webhook Endpoint</CardDescription>
              <CardTitle className="text-xs font-mono text-zinc-200 truncate">{webhookUrl}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-zinc-450 leading-relaxed flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Listening to Google Pub/Sub webhooks
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Sync History / Event logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-zinc-500" />
              Live Sync Log History
            </h2>
            <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-mono">
              Last 5 sync updates
            </span>
          </div>

          <Card className="bg-zinc-900 border-zinc-850 text-zinc-50 shadow-md overflow-hidden">
            <CardContent className="p-0 divide-y divide-zinc-950">
              {syncLogs.length === 0 ? (
                <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                  <AlertTriangle className="h-8 w-8 text-zinc-650" />
                  <span>No sync logs or webhook transactions registered in database yet.</span>
                </div>
              ) : (
                syncLogs.map((log) => {
                  const serviceName = log.account.integration.name === "gmail" ? "Gmail" : "Calendar";
                  const dateStr = new Date(log.createdAt).toLocaleString();
                  const isSuccess = log.status === "success" || !log.status; // defaults to success

                  return (
                    <div key={log.id} className="p-4 flex items-center justify-between text-xs hover:bg-zinc-900/40 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            log.account.integration.name === "gmail" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}>
                            {serviceName}
                          </span>
                          <span className="text-zinc-300 font-semibold">{log.eventType}</span>
                        </div>
                        <p className="text-[10px] text-zinc-550 font-mono">ID: {log.id}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSuccess ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>
                          {isSuccess ? "SUCCESS" : "FAILED"}
                        </span>
                        <span className="text-[10px] text-zinc-500">{dateStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>

        {/* Info banner */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 flex gap-3 items-start">
          <ShieldCheck className="h-5 w-5 text-zinc-550 shrink-0" />
          <div className="text-xs text-zinc-450 leading-relaxed">
            <strong>Security & Privacy:</strong> All connections are secured under dynamic multi-tenant tokens. The Corsair engine encrypts configuration metrics using your environment key (<code className="text-zinc-300 font-mono">CORSAIR_KEK</code>) ensuring client segregation.
          </div>
        </div>

      </div>
    </div>
  );
}
