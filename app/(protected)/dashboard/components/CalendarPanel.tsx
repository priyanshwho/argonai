"use client";

import React, { useState } from "react";
import { RefreshCw, CalendarDays, UserCheck, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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

  const hasEventOnDate = (d: Date) => {
    return events.some(
      (e) => new Date(e.startTime).toDateString() === d.toDateString()
    );
  };

  const dailyEvents = React.useMemo(() => {
    return events.filter(
      (e) => new Date(e.startTime).toDateString() === selectedDate.toDateString()
    );
  }, [events, selectedDate]);

  const formattedWeekRange = React.useMemo(() => {
    const start = dateWindow[0];
    const end = dateWindow[dateWindow.length - 1];
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString([], options)} – ${end.toLocaleDateString([], options)}, ${end.getFullYear()}`;
  }, [dateWindow]);

  return (
    <div className="p-6 flex flex-col h-full overflow-hidden gap-6 bg-background">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-primary" />
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
        <div className="flex items-center gap-3 overflow-x-auto py-2.5 px-1 scrollbar-none select-none border-b border-border/40">
          {dateWindow.map((date, idx) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isCurrentToday = date.toDateString() === new Date().toDateString();
            const dayName = date.toLocaleDateString([], { weekday: "short" });
            const dayNum = date.getDate();
            const hasEvents = hasEventOnDate(date);

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center rounded-2xl w-12 h-16 shrink-0 transition-all border relative cursor-pointer ${
                  isSelected
                    ? "bg-primary border-primary/20 text-primary-foreground shadow-md font-bold scale-[1.04]"
                    : isCurrentToday
                    ? "bg-muted border-primary/45 text-foreground font-semibold"
                    : "bg-card border-border/50 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                <span className={`text-xs uppercase tracking-wider ${isSelected ? "opacity-90" : "opacity-60"}`}>
                  {dayName}
                </span>
                <span className="text-lg font-extrabold leading-none mt-1">{dayNum}</span>

                {/* Event Dot Indicator */}
                {hasEvents && (
                  <span
                    className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                      isSelected ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
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
          <div className="space-y-3.5 max-w-xl mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 px-1.5">
              Schedule for {selectedDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </div>
            <div className="space-y-2.5">
              {dailyEvents.map((event) => {
                const start = new Date(event.startTime);
                const end = new Date(event.endTime);
                const guests = Array.isArray(event.attendees) ? event.attendees : [];
                const isToday = start.toDateString() === new Date().toDateString();

                return (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border border-border/80 bg-card hover:bg-muted/30 transition-colors flex gap-4 items-start shadow-sm group select-text"
                  >
                    <div
                      className={`shrink-0 flex flex-col items-center justify-center rounded-xl w-12 h-12 text-center border shadow-sm ${
                        isToday
                          ? "bg-primary border-primary/30 text-primary-foreground"
                          : "bg-muted/60 border-border text-foreground"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase opacity-70">
                        {start.toLocaleDateString([], { month: "short" })}
                      </span>
                      <span className="text-xl font-extrabold leading-none">{start.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="text-base font-bold text-foreground leading-tight truncate">
                        {event.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {guests.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground/60 truncate">
                            {guests.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 border ${
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
          </div>
        )}
      </div>
    </div>
  );
}
