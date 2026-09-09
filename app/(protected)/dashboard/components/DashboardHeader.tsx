"use client";

import React from "react";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  activeTab: "chat" | "inbox" | "calendar" | "configuration";
  showSearchResults: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  onOpenCommandPalette: () => void;
  chatTitle?: string;
  onOpenMobileMenu?: () => void;
}

export function DashboardHeader({
  activeTab,
  showSearchResults,
  searchQuery,
  setSearchQuery,
  onOpenCommandPalette,
  chatTitle,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  const tabLabel = showSearchResults
    ? "Search Results"
    : activeTab === "chat"
    ? (chatTitle || "AI Assistant")
    : activeTab === "inbox"
    ? "Emails Inbox"
    : activeTab === "calendar"
    ? "Calendar Events"
    : "Configuration";

  return (
    <header
      className="h-14 border-b border-border/60 flex items-center justify-between px-3 sm:px-6 shrink-0 bg-background/80 backdrop-blur-md z-10 gap-2 sm:gap-4 sticky top-0"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 rounded-xl transition-all cursor-pointer shrink-0"
          title="Open Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="text-base sm:text-xl font-bold text-foreground truncate">{tabLabel}</div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 max-w-[200px] sm:max-w-xs md:max-w-sm w-full justify-end">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-8 sm:pl-9 pr-8 sm:pr-12 py-1 sm:py-1.5 text-xs sm:text-sm placeholder-muted-foreground text-foreground focus:outline-none focus:border-border/80 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCommandPalette}
          className="h-7 sm:h-8 border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground text-xs px-2 gap-1 cursor-pointer shrink-0"
          title="Open Command Palette (⌘K)"
        >
          <span className="font-mono text-[10px]">⌘K</span>
        </Button>
      </div>
    </header>
  );
}

