"use client";

import React from "react";
import { CheckCircle2, AlertCircle, Mail, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ConfigurationPanelProps {
  userId: string;
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
    <div className="p-6 space-y-6 max-w-2xl mx-auto w-full animate-in fade-in">
      <div className="space-y-1">
        <h1 className="text-xl font-bold font-serif text-foreground">Integrations Settings</h1>
        <p className="text-xs text-muted-foreground">
          Manage external API credentials and link your personal workspace tools.
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

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Gmail */}
        <Card className="bg-card border-border/80 text-card-foreground shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-bold">Gmail Inbox</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px]">
                Read, draft, and query mailboxes
              </CardDescription>
            </div>
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
              <Mail className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed min-h-[40px] flex items-center">
              Authorizes ArgonAI's sync agent to read, organize, and build index caches for your
              Gmail correspondence.
            </p>
            <div className="flex items-center justify-between pt-2">
              {initialHasGmail ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connected</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
                    disabled
                  >
                    Configure
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                  <a href="/api/integrations/gmail/connect">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold">
                      Connect Gmail
                    </Button>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google Calendar */}
        <Card className="bg-card border-border/80 text-card-foreground shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
            <div>
              <CardTitle className="text-sm font-bold">Google Calendar</CardTitle>
              <CardDescription className="text-muted-foreground text-[10px]">
                Manage events and schedules
              </CardDescription>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Calendar className="h-4.5 w-4.5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed min-h-[40px] flex items-center">
              Allows scheduling meetings, checking conflict parameters, and posting calendar
              updates via prompt.
            </p>
            <div className="flex items-center justify-between pt-2">
              {initialHasCalendar ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Connected</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted"
                    disabled
                  >
                    Configure
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                  <a href="/api/integrations/googlecalendar/connect">
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold">
                      Connect Calendar
                    </Button>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-border bg-card/10 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 animate-pulse" />
        <div className="text-xs text-muted-foreground leading-relaxed">
          <strong>Multi-Tenancy note:</strong> Linking these services automatically binds them
          under your unique Tenant ID:{" "}
          <code className="text-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono">
            {userId}
          </code>
          . Your personal emails and events will never be shared with other users.
        </div>
      </div>
    </div>
  );
}
