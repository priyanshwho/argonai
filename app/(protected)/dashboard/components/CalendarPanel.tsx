"use client";

import React, { useState } from "react";
import { RefreshCw, CalendarDays, ChevronLeft, ChevronRight, Calendar, Clock, Users } from "lucide-react";
import { CalendarItem } from "./types";
import { Button } from "@/components/ui/button";

interface CalendarPanelProps {
  eventsLoading: boolean;
  events: CalendarItem[];
}

export function CalendarPanel({ eventsLoading, events }: CalendarPanelProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [anchorDate, setAnchorDate] = useState<Date>(new Date());

  // Generate 15 days of dates around anchorDate (7 days prior, anchor, 7 days post)
  const dateWindow = React.useMemo(() => {
    const dates = [];
    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - 7);
    for (let i = 0; i < 15; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [anchorDate]);

  const handlePrevWeek = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() - 7);
      return next;
    });
  };

  const handleNextWeek = () => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      next.setDate(prev.getDate() + 7);
      return next;
    });
  };

  const handleGoToday = () => {
    const today = new Date();
    setAnchorDate(today);
    setSelectedDate(today);
  };

  const dailyEvents = React.useMemo(() => {
    return events
      .filter((e) => new Date(e.startTime).toDateString() === selectedDate.toDateString())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [events, selectedDate]);

  const formattedWeekRange = React.useMemo(() => {
    const start = dateWindow[0];
    const end = dateWindow[dateWindow.length - 1];
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString([], options)} – ${end.toLocaleDateString([], options)}, ${end.getFullYear()}`;
  }, [dateWindow]);

  // Premium helper for event classification styling
  const getEventStyle = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("sync") || t.includes("standup") || t.includes("status")) {
      return {
        border: "border-l-4 border-l-violet-500",
        bg: "bg-violet-500/[0.03] dark:bg-violet-500/[0.02] hover:bg-violet-500/[0.08] dark:hover:bg-violet-500/[0.06] border-violet-500/25",
        text: "text-violet-600 dark:text-violet-400",
        badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20"
      };
    }
    if (t.includes("review") || t.includes("roadmap") || t.includes("demo") || t.includes("planning") || t.includes("design")) {
      return {
        border: "border-l-4 border-l-sky-500",
        bg: "bg-sky-500/[0.03] dark:bg-sky-500/[0.02] hover:bg-sky-500/[0.08] dark:hover:bg-sky-500/[0.06] border-sky-500/25",
        text: "text-sky-600 dark:text-sky-400",
        badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
      };
    }
    if (t.includes("lunch") || t.includes("dinner") || t.includes("coffee") || t.includes("personal") || t.includes("break")) {
      return {
        border: "border-l-4 border-l-emerald-500",
        bg: "bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] hover:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/[0.06] border-emerald-500/25",
        text: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
      };
    }
    if (t.includes("urgent") || t.includes("alert") || t.includes("critical") || t.includes("blocker") || t.includes("emergency")) {
      return {
        border: "border-l-4 border-l-rose-500",
        bg: "bg-rose-500/[0.03] dark:bg-rose-500/[0.02] hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/[0.06] border-rose-500/25",
        text: "text-rose-600 dark:text-rose-400",
        badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      };
    }
    return {
      border: "border-l-4 border-l-primary",
      bg: "bg-primary/[0.03] dark:bg-primary/[0.02] hover:bg-primary/[0.08] dark:hover:bg-primary/[0.06] border-primary/25",
      text: "text-primary",
      badge: "bg-primary/10 text-primary border-primary/20"
    };
  };

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden gap-6 bg-background">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Calendar Board
          </h2>
          <p className="text-sm text-muted-foreground/75">
            Scroll dates horizontally to check availability and conflict dots.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-xl p-1.5 shrink-0 self-start sm:self-auto shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            className="h-7 w-7 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
            title="Previous Week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            onClick={handleGoToday}
            className="px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
            className="h-7 w-7 rounded-lg hover:bg-muted cursor-pointer text-muted-foreground hover:text-foreground"
            title="Next Week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Horizontally Scrollable Date Picker Strip */}
      <div className="shrink-0 flex flex-col gap-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-1">
          Selected Range: <span className="text-foreground/90 normal-case">{formattedWeekRange}</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto py-3 px-1 scrollbar-none select-none border-b border-border/40">
          {dateWindow.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isCurrentToday = date.toDateString() === new Date().toDateString();
            const dayName = date.toLocaleDateString([], { weekday: "short" });
            const dayNum = date.getDate();
            
            const dayEvents = events.filter(
              (e) => new Date(e.startTime).toDateString() === date.toDateString()
            );
            const eventsCount = dayEvents.length;

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center rounded-2xl w-14 h-20 shrink-0 transition-all border relative cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-primary to-primary/85 border-primary/20 text-primary-foreground shadow-md font-bold scale-[1.04]"
                    : isCurrentToday
                    ? "bg-primary/5 border-primary/45 text-foreground font-semibold ring-1 ring-primary/10"
                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <span className={`text-xs font-semibold uppercase tracking-wider ${isSelected ? "opacity-95 text-primary-foreground/90" : "opacity-60 text-muted-foreground"}`}>
                  {dayName}
                </span>
                <span className="text-xl font-extrabold leading-none mt-1.5">{dayNum}</span>

                {/* Event Count Indicator Dots */}
                {eventsCount > 0 && (
                  <div className="flex gap-0.5 justify-center items-center absolute bottom-2 w-full">
                    {Array.from({ length: Math.min(eventsCount, 3) }).map((_, i) => (
                      <span
                        key={i}
                        className={`h-1 w-1 rounded-full ${
                          isSelected ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily Agenda Events Section */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1">
        {eventsLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-24">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading calendar events...</span>
          </div>
        ) : dailyEvents.length === 0 ? (
          <div className="text-center py-20 space-y-4 border border-dashed border-border/85 rounded-2xl p-6 bg-card/20 max-w-md mx-auto">
            <div className="h-12 w-12 rounded-xl bg-muted/65 border border-border flex items-center justify-center mx-auto shadow-sm">
              <CalendarDays className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-foreground">No events scheduled</p>
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                You have a clear schedule for {selectedDate.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5 w-full">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-1.5">
              Schedule for {selectedDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </div>
            
            <div className="relative space-y-5 pt-2">
              {/* Vertical timeline track line */}
              <div className="absolute left-[75px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-border/80 via-border/40 to-transparent" />

              {dailyEvents.map((event) => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                const guests = Array.isArray(event.attendees) ? event.attendees : [];
                const isToday = start.toDateString() === new Date().toDateString();
                const style = getEventStyle(event.title);

                return (
                  <div key={event.id} className="flex gap-2 group select-text">
                    {/* Time Indicator Column */}
                    <div className="w-16 pr-3 text-right shrink-0 pt-0.5 space-y-0.5">
                      <span className="text-sm font-extrabold text-foreground tracking-tight block">
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                      <span className="text-[11px] font-semibold text-muted-foreground/75 block">
                        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                      </span>
                    </div>

                    {/* Timeline Node & Line */}
                    <div className="relative flex flex-col items-center shrink-0 w-6">
                      <div className={`h-4.5 w-4.5 rounded-full border-2 bg-background z-10 flex items-center justify-center transition-all ${
                        isToday ? "border-primary scale-110" : "border-muted-foreground/35 group-hover:border-primary"
                      }`}>
                        {isToday && <div className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />}
                      </div>
                    </div>

                    {/* Event Info Card */}
                    <div className={`flex-1 p-4 rounded-2xl border transition-all duration-200 ${style.border} ${style.bg} hover:shadow-md hover:-translate-y-0.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm`}>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <h4 className="text-base font-bold text-foreground leading-snug break-words">
                          {event.title}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground/85">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {guests.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground/60" />
                              {guests.length} {guests.length === 1 ? "guest" : "guests"}
                            </span>
                          )}
                        </div>

                        {guests.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {guests.map((g, gIdx) => (
                              <span
                                key={gIdx}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-background border border-border/85 px-2 py-0.5 rounded-lg text-foreground/80"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-primary/80" />
                                {g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${style.badge}`}>
                          {isToday ? "Today" : "Upcoming"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
