"use client"

import { useCallback } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type AnimatedThemeTogglerProps = {
  className?: string
}

export const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const toggleTheme = useAnimatedThemeToggle()
  const { resolvedTheme } = useTheme()
  const darkMode = resolvedTheme === "dark"

  return (
    <button
      onClick={toggleTheme}
      aria-label="Switch theme"
      className={cn(
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer",
        className
      )}
      type="button"
    >
      {darkMode ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </button>
  )
}

// Hook to trigger the same curtain animation from anywhere (e.g., double-tap)
export function useAnimatedThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const darkMode = resolvedTheme === "dark"

  const toggle = useCallback(() => {
    if (typeof window === "undefined") return

    const next = darkMode ? "light" : "dark"
    const nextBg = next === "dark" ? "#0e0e0e" : "#f3ede1"

    // Create temporary curtain element
    const curtain = document.createElement("div")
    curtain.style.position = "fixed"
    curtain.style.inset = "0"
    curtain.style.background = nextBg
    curtain.style.transformOrigin = "top"
    curtain.style.transform = "scaleY(0)"
    curtain.style.transition = "transform 550ms cubic-bezier(0.76, 0, 0.24, 1)"
    curtain.style.zIndex = "999999"
    curtain.style.pointerEvents = "none"

    document.body.appendChild(curtain)

    // Force reflow
    curtain.getBoundingClientRect()

    // Slide down to cover
    curtain.style.transform = "scaleY(1)"

    setTimeout(() => {
      // Switch theme
      setTheme(next)
      // Slide up to reveal
      curtain.style.transform = "scaleY(0)"

      setTimeout(() => {
        curtain.remove()
      }, 600)
    }, 550)
  }, [darkMode, setTheme])

  return toggle
}
