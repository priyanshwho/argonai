"use client";

import React from "react";
import { Bot, RefreshCw, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CalendarManualFormProps {
  eventTitle: string;
  setEventTitle: (v: string) => void;
  eventStart: string;
  setEventStart: (v: string) => void;
  eventEnd: string;
  setEventEnd: (v: string) => void;
  eventGuests: string;
  setEventGuests: (v: string) => void;
  eventCreating: boolean;
  eventStatus: { type: "success" | "error"; message: string } | null;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToAssistant: () => void;
  onCollapse?: () => void;
}

export function CalendarManualForm({
  eventTitle,
  setEventTitle,
  eventStart,
  setEventStart,
  eventEnd,
  setEventEnd,
  eventGuests,
  setEventGuests,
  eventCreating,
  eventStatus,
  onSubmit,
  onSwitchToAssistant,
  onCollapse,
}: CalendarManualFormProps) {
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6 select-text">
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground font-serif">Manual Scheduler</h3>
          <p className="text-xs text-muted-foreground/60">
            Schedule Google calendar events manually.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSwitchToAssistant}
            className="text-xs h-7 px-2 hover:bg-muted text-muted-foreground cursor-pointer flex items-center gap-1"
          >
            <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span>Use Assistant</span>
          </Button>
          {onCollapse && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCollapse}
              className="h-7 w-7 hover:bg-muted text-muted-foreground cursor-pointer flex items-center justify-center rounded-lg"
              title="Collapse Assistant"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-4 rounded-xl border border-border bg-card/25 space-y-4 text-sm">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground/85 font-bold uppercase block">
            Meeting Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Sync with HR, Review roadmap..."
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground/85 font-bold uppercase block">
            Start Time *
          </label>
          <input
            type="datetime-local"
            required
            value={eventStart}
            onChange={(e) => setEventStart(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-border/80"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground/85 font-bold uppercase block">
            End Time *
          </label>
          <input
            type="datetime-local"
            required
            value={eventEnd}
            onChange={(e) => setEventEnd(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-border/80"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground/85 font-bold uppercase block">
            Guests (comma-separated)
          </label>
          <input
            type="text"
            placeholder="e.g. john@domain.com, team@locus.co"
            value={eventGuests}
            onChange={(e) => setEventGuests(e.target.value)}
            className="w-full bg-background border border-border rounded-lg p-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80"
          />
        </div>

        {eventStatus && (
          <div
            className={`p-2.5 rounded-lg border text-xs leading-relaxed ${
              eventStatus.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/20 text-destructive"
            }`}
          >
            {eventStatus.message}
          </div>
        )}

        <Button
          type="submit"
          disabled={eventCreating}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-2 font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {eventCreating ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Booking...</span>
            </>
          ) : (
            <>
              <Calendar className="h-4 w-4 text-primary-foreground" />
              <span>Post Event</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
