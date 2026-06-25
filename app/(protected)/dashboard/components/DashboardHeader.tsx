"use client";

import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  activeTab: "chat" | "inbox" | "calendar" | "configuration";
  showSearchResults: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onOpenCommandPalette: () => void;
}

export function DashboardHeader({
  activeTab,
  showSearchResults,
  searchQuery,
  setSearchQuery,
  onOpenCommandPalette,
}: DashboardHeaderProps) {
  const tabLabel = showSearchResults
    ? "Search Results"
    : activeTab === "chat"
    ? "AI Assistant"
    : activeTab === "inbox"
    ? "Emails Inbox"
    : activeTab === "calendar"
    ? "Calendar Events"
    : "Configuration";

  return (
    <header className="h-14 border-b border-border/60 flex items-center justify-between px-6 shrink-0 bg-background/60 backdrop-blur-sm z-10 gap-4">
      <div className="text-sm font-semibold text-foreground/90 shrink-0">{tabLabel}</div>

      <div className="flex items-center gap-2 max-w-sm w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search emails or events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs placeholder-muted-foreground text-foreground focus:outline-none focus:border-border/80 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommandPalette}
          className="h-8 border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground text-xs px-2 gap-1 cursor-pointer"
          title="Open Command Palette (⌘K)"
        >
          <span className="font-mono text-[10px]">⌘K</span>
        </Button>
      </div>
    </header>
  );
}
