"use client";

import React from "react";
import {
  Bot, Plus, Settings, LogOut, Mail, Calendar,
  Inbox, ChevronRight, CalendarDays, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Link from "next/link";
import { ChatConversation } from "./types";

interface DashboardSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  activeTab: "chat" | "inbox" | "calendar" | "configuration";
  setActiveTab: (t: "chat" | "inbox" | "calendar") => void;
  showSearchResults: boolean;
  setShowSearchResults: (v: boolean) => void;
  activeChatId: string;
  conversations: ChatConversation[];
  createNewChat: () => void;
  selectConversation: (id: string) => void;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  onSettings: () => void;
  onSignOut: () => void;
}

export function DashboardSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  setActiveTab,
  showSearchResults,
  setShowSearchResults,
  activeChatId,
  conversations,
  createNewChat,
  selectConversation,
  userName,
  userEmail,
  userImage,
  onSettings,
  onSignOut,
}: DashboardSidebarProps) {
  const navItems = [
    { id: "chat", label: "AI Assistant", icon: Bot },
    { id: "inbox", label: "Inbox Workspace", icon: Inbox },
    { id: "calendar", label: "Calendar Board", icon: CalendarDays },
    { id: "configuration", label: "Configuration", icon: Settings, action: onSettings },
  ];

  return (
    <aside
      className={`bg-card border-r border-border flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 flex flex-col gap-4 overflow-hidden">
        {/* Logo + Collapse Toggle */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2 overflow-hidden select-none">
            {sidebarCollapsed ? (
              <Link href="/" className="flex items-center shrink-0 justify-center w-12 h-12 overflow-hidden rounded-lg -mt-2">
                <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-11 max-w-none w-auto object-contain" />
                <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-11 max-w-none w-auto object-contain" />
              </Link>
            ) : (
              <Link href="/" className="flex items-center shrink-0 -mt-2">
                <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-16 w-auto object-contain" />
                <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-16 w-auto object-contain" />
              </Link>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors shrink-0"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <ChevronRight
              className={`h-4.5 w-4.5 transform transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={createNewChat}
          variant="outline"
          className={`justify-start gap-2 border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-all ${
            sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3"
          }`}
          title={sidebarCollapsed ? "New Chat" : undefined}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>New Chat</span>}
        </Button>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  setActiveTab(tab.id as "chat" | "inbox" | "calendar");
                  setShowSearchResults(false);
                }
              }}
              title={tab.label}
              className={`flex items-center rounded-lg text-sm transition-all text-left ${
                activeTab === tab.id && !showSearchResults && !tab.action
                  ? "bg-accent text-accent-foreground font-medium shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              } ${sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3 py-2 gap-2.5"}`}
            >
              <tab.icon className="h-4.5 w-4.5 shrink-0 opacity-85" />
              {!sidebarCollapsed && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>

        {/* Conversations List */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1 transition-opacity duration-300">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-1.5">
              Recent Conversations
            </div>
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all text-left truncate ${
                  activeTab === "chat" && activeChatId === c.id && !showSearchResults
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground/90 hover:bg-muted hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{c.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Profile + Sign Out */}
      <div className="p-4 border-t border-border">
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-background/40 border border-border/50 transition-all ${
            sidebarCollapsed ? "flex-col gap-2 p-1" : ""
          }`}
        >
          <div className={`flex items-center gap-2.5 overflow-hidden ${sidebarCollapsed ? "flex-col justify-center" : ""}`}>
            {userImage ? (
              <img src={userImage} alt={userName} className="h-8 w-8 rounded-full" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                {userName[0]?.toUpperCase() || "U"}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="flex flex-col truncate transition-opacity duration-300">
                <span className="text-xs font-semibold text-foreground truncate">{userName}</span>
                <span className="text-[10px] text-muted-foreground truncate">{userEmail}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <AnimatedThemeToggler className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" />
            <button
              onClick={onSignOut}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
