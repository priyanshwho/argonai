"use client"
import React from "react"
import { ThemeToggle } from "@/components/ui/curtain-theme-toggle"

export interface ModeToggleProps {
  animated?: boolean;
  className?: string;
}

export function ModeToggle({ animated = true, className }: ModeToggleProps) {
  return <ThemeToggle variant="icon" duration={550} animated={animated} className={className} />
}

