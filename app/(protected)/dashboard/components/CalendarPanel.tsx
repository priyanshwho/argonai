"use client";

import React from "react";
import { RefreshCw, CalendarDays, UserCheck } from "lucide-react";
import { CalendarItem } from "./types";

interface CalendarPanelProps {
  eventsLoading: boolean;
  events: CalendarItem[];
}

export function CalendarPanel({ eventsLoading, events }: CalendarPanelProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold font-serif text-foreground">Upcoming Events</h2>
        <p className="text-xs text-muted-foreground/60">
          Track date conflicts and guest responses linked under calendar.
        </p>
      </div>

      {eventsLoading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-24">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading events...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
            <CalendarDays className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-semibold text-foreground/60">No events found</p>
          <p className="text-xs text-muted-foreground">
            Connect Google Calendar to see your upcoming events.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((event) => {
            const start = new Date(event.startTime);
            const end = new Date(event.endTime);
            const guests = Array.isArray(event.attendees) ? event.attendees : [];
            const isToday = start.toDateString() === new Date().toDateString();
            return (
              <div
                key={event.id}
                className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors flex gap-4 items-start animate-in fade-in group"
              >
                <div
                  className={`shrink-0 flex flex-col items-center justify-center rounded-xl w-12 h-12 text-center border shadow-sm ${
                    isToday
                      ? "bg-primary border-primary/30 text-primary-foreground"
                      : "bg-muted/60 border-border text-foreground"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase opacity-70">
                    {start.toLocaleDateString([], { month: "short" })}
                  </span>
                  <span className="text-lg font-extrabold leading-none">{start.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-sm font-bold text-foreground leading-tight truncate">
                    {event.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                    {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  {guests.length > 0 && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <UserCheck className="h-3 w-3 text-muted-foreground/60" />
                      <span className="text-[10px] text-muted-foreground/60 truncate">
                        {guests.join(", ")}
                      </span>
                    </div>
                  )}
                </div>
                <div
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                    isToday
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-muted text-muted-foreground border-border/40"
                  }`}
                >
                  {isToday ? "Today" : "Upcoming"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
