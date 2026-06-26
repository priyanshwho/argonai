"use client";

import React from "react";
import {
  Bot, Plus, Settings, LogOut, Mail, Calendar,
  Inbox, ChevronRight, CalendarDays, MessageSquare, Trash2,
} from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import Link from "next/link";
import { ChatConversation } from "./types";

interface DashboardSidebarProps {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  activeTab: "chat" | "inbox" | "calendar" | "configuration";
  showSearchResults: boolean;
  activeChatId: string;
  conversations: ChatConversation[];
  createNewChat: () => void;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  onSettings: () => void;
  onSignOut: () => void;
  deleteConversation: (id: string, e: React.MouseEvent) => void;
  hasGmail: boolean;
  hasCalendar: boolean;
}

export function DashboardSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  activeTab,
  showSearchResults,
  activeChatId,
  conversations,
  createNewChat,
  userName,
  userEmail,
  userImage,
  onSettings,
  onSignOut,
  deleteConversation,
  hasGmail,
  hasCalendar,
}: DashboardSidebarProps) {
  const navItems = [
    { id: "chat", label: "AI Assistant", icon: Bot, href: `/dashboard/${activeChatId}` },
    {
      id: "inbox",
      label: "Inbox Workspace",
      icon: Inbox,
      href: `/dashboard/${activeChatId}?tab=inbox`,
      status: hasGmail,
    },
    {
      id: "calendar",
      label: "Calendar Board",
      icon: CalendarDays,
      href: `/dashboard/${activeChatId}?tab=calendar`,
      status: hasCalendar,
    },
    {
      id: "configuration",
      label: "Configuration",
      icon: Settings,
      href: "/settings",
      action: onSettings,
    },
  ];

  return (
    <aside
      className={`bg-card border-r border-border flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Top Header Section (Aligned with Dashboard Header height) */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-border/60 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden select-none">
          {sidebarCollapsed ? (
            <Link href="/" className="flex items-center shrink-0 justify-center w-10 h-10 overflow-hidden rounded-lg">
              <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-9 max-w-none w-auto object-contain" />
              <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-9 max-w-none w-auto object-contain" />
            </Link>
          ) : (
            <Link href="/" className="flex items-center shrink-0 -mt-1 pl-4">
              <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-14 w-auto object-contain" />
              <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-14 w-auto object-contain" />
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

      {/* Main Sidebar Contents */}
      <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        {/* New Chat Button */}
        <Link
          href="/dashboard/new"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey && e.button !== 1) {
              e.preventDefault();
              createNewChat();
            }
          }}
          className={`flex items-center gap-2 border border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-all rounded-lg font-semibold text-base ${
            sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3.5 py-2"
          }`}
          title={sidebarCollapsed ? "New Chat" : undefined}
        >
          <Plus className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>New Chat</span>}
        </Link>

        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((tab) => {
            const isTabActive = activeTab === tab.id && !showSearchResults;
            
            const handleClick = (e: React.MouseEvent) => {
              if (tab.action) {
                e.preventDefault();
                tab.action();
              }
            };

            return (
              <Link
                key={tab.id}
                href={tab.href}
                onClick={handleClick}
                title={tab.label}
                className={`flex items-center rounded-lg text-base transition-all text-left relative group ${
                  isTabActive
                    ? "bg-accent text-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3.5 py-2.5 gap-2.5"}`}
              >
                <tab.icon className="h-4.5 w-4.5 shrink-0 opacity-85" />
                {!sidebarCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{tab.label}</span>
                    {tab.status !== undefined && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                          tab.status
                            ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                            : "bg-muted-foreground/30"
                        }`}
                        title={tab.status ? "Connected" : "Not Connected"}
                      />
                    )}
                  </div>
                )}
                {sidebarCollapsed && tab.status !== undefined && (
                  <span
                    className={`absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full ${
                      tab.status ? "bg-emerald-500" : "bg-muted-foreground/30"
                    }`}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Conversations List */}
        {!sidebarCollapsed && (
          <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1 transition-opacity duration-300">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2.5 pb-2">
              Recent Conversations
            </div>
            {conversations
              .filter((c) => c.messages.length > 0 || c.id === activeChatId)
              .map((c) => {
                const isActive = activeTab === "chat" && activeChatId === c.id && !showSearchResults;
                return (
                  <div key={c.id} className="group relative flex items-center w-full">
                    <Link
                      href={`/dashboard/${c.id}`}
                      className={`w-full flex items-center gap-2 pl-2.5 pr-8 py-2 rounded-lg text-base transition-all text-left truncate ${
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground/90 hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="truncate">{c.title}</span>
                    </Link>
                    <button
                      onClick={(e) => deleteConversation(c.id, e)}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-all cursor-pointer"
                      title="Delete Conversation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
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
                <span className="text-sm font-semibold text-foreground truncate">{userName}</span>
                <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
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
