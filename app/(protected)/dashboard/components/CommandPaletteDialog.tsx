"use client";

import React from "react";
import {
  Bot, Sparkles, Calendar,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { formatDateTimeLocal } from "./utils";

interface CommandPaletteDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onNavigate: (tab: "chat" | "inbox" | "calendar") => void;
  onSettings: () => void;
  onAskAI: (prompt: string) => void;
  onScheduleTemplate: (title: string, start: Date, end: Date) => void;
}

export function CommandPaletteDialog({
  open,
  onOpenChange,
  onNavigate,
  onSettings,
  onAskAI,
  onScheduleTemplate,
}: CommandPaletteDialogProps) {
  const close = () => onOpenChange(false);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { onNavigate("chat"); close(); }}>
              <Bot className="mr-2 h-4 w-4" />
              <span>Go to AI Assistant</span>
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { onNavigate("inbox"); close(); }}>
              <span className="mr-2">📥</span>
              <span>Go to Emails Inbox</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { onNavigate("calendar"); close(); }}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Go to Calendar Board</span>
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { onSettings(); close(); }}>
              <span className="mr-2">⚙️</span>
              <span>Go to Settings Panel</span>
              <CommandShortcut>⌘4</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Scheduling Templates">
            <CommandItem
              onSelect={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(10, 0, 0, 0);
                const end = new Date(tomorrow);
                end.setHours(10, 30, 0, 0);
                onScheduleTemplate("Daily Standup", tomorrow, end);
                close();
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Daily Standup (Tomorrow 10:00 AM)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                const today = new Date();
                today.setHours(16, 0, 0, 0);
                const end = new Date(today);
                end.setHours(16, 30, 0, 0);
                onScheduleTemplate("Coffee Chat", today, end);
                close();
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Coffee Chat (Today 4:00 PM)</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                const nextMonday = new Date();
                nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
                nextMonday.setHours(14, 0, 0, 0);
                const end = new Date(nextMonday);
                end.setHours(15, 0, 0, 0);
                onScheduleTemplate("Weekly Planning Sync", nextMonday, end);
                close();
              }}
            >
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Weekly Planning Sync (Next Mon 2:00 PM)</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Ask AI Quick Actions">
            <CommandItem
              onSelect={() => {
                close();
                onAskAI("Summarize my recent Gmail messages");
              }}
            >
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Ask AI: Summarize inbox messages</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                close();
                onAskAI("Do I have any calendar conflicts tomorrow?");
              }}
            >
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Ask AI: Check tomorrow's schedule conflicts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
