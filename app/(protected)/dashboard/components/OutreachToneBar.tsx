"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Briefcase,
  Smile,
  Coffee,
  Minimize2,
  FileText,
  Award,
  Send,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface OutreachToneBarProps {
  onRefine: (tone: string, customPrompt?: string) => void;
  isLoading: boolean;
}

export function OutreachToneBar({ onRefine, isLoading }: OutreachToneBarProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const tones = [
    { id: "professional", label: "Professional", icon: Briefcase },
    { id: "friendly", label: "Friendly", icon: Smile },
    { id: "casual", label: "Casual", icon: Coffee },
    { id: "short", label: "Shorter", icon: Minimize2 },
    { id: "detailed", label: "Detailed", icon: FileText },
    { id: "improve-opening", label: "Hook / Opening", icon: Sparkles },
    { id: "emphasize-skills", label: "Highlight Skills", icon: Award },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    onRefine("custom", customPrompt.trim());
    setCustomPrompt("");
    setShowCustom(false);
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-amber-500" />
          AI Style & Tone Tuning
        </span>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <SlidersHorizontal className="w-3 h-3" />
          {showCustom ? "Hide Custom" : "Custom prompt"}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tones.map((t) => {
          const Icon = t.icon;
          return (
            <Button
              key={t.id}
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => onRefine(t.id)}
              className="h-7 text-xs px-2.5 rounded-md border-border/60 hover:bg-muted/80 hover:text-foreground transition-all flex items-center gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
              ) : (
                <Icon className="w-3 h-3 text-muted-foreground" />
              )}
              {t.label}
            </Button>
          );
        })}
      </div>

      {showCustom && (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 pt-1 animate-in fade-in-50 duration-150">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g., Make it mention our experience in React & AI..."
            disabled={isLoading}
            className="flex-1 h-7 text-xs px-2.5 rounded-md border border-border/70 bg-background/50 placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !customPrompt.trim()}
            className="h-7 text-xs px-3 rounded-md"
          >
            Apply
          </Button>
        </form>
      )}
    </div>
  );
}
