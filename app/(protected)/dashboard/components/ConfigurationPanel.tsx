"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Mail, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PwaInstallCard } from "@/components/settings/pwa-install-card";

interface ConfigurationPanelProps {
  userId?: string;
  initialHasGmail: boolean;
  initialHasCalendar: boolean;
  notification: { type: "success" | "error"; message: string } | null;
}

export function ConfigurationPanel({
  userId,
  initialHasGmail,
  initialHasCalendar,
  notification,
}: ConfigurationPanelProps) {
  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full animate-in fade-in pb-16">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-foreground">
          Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage your connected accounts, install the mobile app, and customize your workspace.
        </p>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border flex gap-3 items-start ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 border-destructive/20 text-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          )}
          <div className="text-sm leading-relaxed">{notification.message}</div>
        </div>
      )}

      {/* 1. Mobile & Desktop App Installation */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Mobile & Desktop App
        </div>
        <PwaInstallCard />
      </div>

      {/* 2. Integrations */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Service Connections
        </div>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
          {/* Gmail */}
          <Card className="bg-card border-border/80 text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Gmail Inbox
                  {initialHasGmail && (
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                  )}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[11px]">
                  Read, draft, and query mailboxes
                </CardDescription>
              </div>
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                <Mail className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                Authorizes ARGON AI to securely read messages, build fast search indexes, and prepare smart draft responses.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                {initialHasGmail ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/gmail/connect">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted h-8"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                    <a href="/api/integrations/gmail/connect">
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-3">
                        Connect Gmail
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Google Calendar */}
          <Card className="bg-card border-border/80 text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  Google Calendar
                  {initialHasCalendar && (
                    <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  )}
                </CardTitle>
                <CardDescription className="text-muted-foreground text-[11px]">
                  Manage events and schedules
                </CardDescription>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <Calendar className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed min-h-[36px]">
                Allows scheduling meetings, checking conflict parameters, and posting calendar updates via prompt.
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                {initialHasCalendar ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-500/15 border border-blue-500/20 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Connected</span>
                    </div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted h-8"
                      >
                        Reconnect
                      </Button>
                    </a>
                  </>
                ) : (
                  <>
                    <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                    <a href="/api/integrations/googlecalendar/connect">
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold text-xs h-8 px-3">
                        Connect Calendar
                      </Button>
                    </a>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Privacy Assurance */}
      <div className="rounded-xl border border-border bg-card p-4 sm:p-5 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 mt-0.5">
          <ShieldCheck className="h-4.5 w-4.5" />
        </div>
        <div className="space-y-1">
          <div className="text-xs sm:text-sm font-bold text-foreground">
            Privacy & Data Protection
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your emails, calendar events, and conversations belong solely to you. ARGON AI never sells your data, never shares your correspondence, and never uses your personal information to train public AI models.
          </p>
        </div>
      </div>
    </div>
  );
}
