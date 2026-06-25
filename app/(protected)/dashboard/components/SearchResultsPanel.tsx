"use client";

import React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { EmailItem, CalendarItem } from "./types";

interface SearchResultsPanelProps {
  searchLoading: boolean;
  searchResults: { emails: EmailItem[]; events: CalendarItem[] } | null;
  onSelectEmail: (email: EmailItem) => void;
  onSelectEvent: () => void;
}

export function SearchResultsPanel({
  searchLoading,
  searchResults,
  onSelectEmail,
  onSelectEvent,
}: SearchResultsPanelProps) {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-bold font-serif text-foreground">
        Search matches found in cache
      </h2>

      {searchLoading ? (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Parsing search criteria...</span>
        </div>
      ) : !searchResults ||
        (searchResults.emails.length === 0 && searchResults.events.length === 0) ? (
        <div className="text-center py-12 space-y-2">
          <ShieldAlert className="h-9 w-9 text-muted-foreground/70 mx-auto" />
          <p className="text-sm text-muted-foreground font-medium">
            No matching emails or meetings registered in cache database.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {searchResults.emails.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Emails
              </h3>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-muted/15">
                {searchResults.emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => onSelectEmail(email)}
                    className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-bold text-foreground/90">{email.sender}</span>
                      <span className="text-sm text-muted-foreground/60">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-base text-foreground font-semibold line-clamp-1">
                      {email.subject}
                    </span>
                    <span className="text-sm text-muted-foreground/85 line-clamp-1">
                      {email.snippet}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchResults.events.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                Meetings
              </h3>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-muted/15">
                {searchResults.events.map((event) => (
                  <button
                    key={event.id}
                    onClick={onSelectEvent}
                    className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-bold text-foreground/90">{event.title}</span>
                      <span className="text-sm text-muted-foreground/60">
                        {new Date(event.startTime).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground/80">
                      Time: {new Date(event.startTime).toLocaleTimeString()} -{" "}
                      {new Date(event.endTime).toLocaleTimeString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
