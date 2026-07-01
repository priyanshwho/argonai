"use client"

import { useRef, useCallback } from "react"
import { flushSync } from "react-dom"
import { Moon, Sun } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

type AnimatedThemeTogglerProps = {
  className?: string
}

export const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const darkMode = resolvedTheme === "dark"
  const transitioningRef = useRef(false)

  const onToggle = useCallback(() => {
    if (!buttonRef.current || transitioningRef.current) return

    const toggled = !darkMode

    if (!document.startViewTransition) {
      setTheme(toggled ? "dark" : "light")
      return
    }

    transitioningRef.current = true

    const { left, top, width, height } = buttonRef.current.getBoundingClientRect()
    const cx = left + width / 2
    const cy = top + height / 2
    const r = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    )

    // Set CSS vars BEFORE startViewTransition so the CSS @keyframe picks them up
    document.documentElement.style.setProperty("--toggle-x", `${cx}px`)
    document.documentElement.style.setProperty("--toggle-y", `${cy}px`)
    document.documentElement.style.setProperty("--toggle-r", `${r}px`)

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(toggled ? "dark" : "light")
      })
    })

    transition.finished
      .then(() => { transitioningRef.current = false })
      .catch(() => { transitioningRef.current = false })
  }, [darkMode, setTheme])

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      aria-label="Switch theme"
      className={cn(
        "flex items-center justify-center p-2 rounded-full outline-none focus:outline-none active:outline-none focus:ring-0 cursor-pointer",
        className
      )}
      type="button"
    >
      <AnimatePresence mode="wait" initial={false}>
        {darkMode ? (
          <motion.span
            key="sun-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: 25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
          >
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </motion.span>
        ) : (
          <motion.span
            key="moon-icon"
            initial={{ opacity: 0, scale: 0.55, rotate: -25 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.33 }}
          >
            <Moon className="h-[1.2rem] w-[1.2rem]" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

// Hook to trigger the same animation from anywhere (e.g., double-tap)
export function useAnimatedThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const transitioningRef = useRef(false)

  const toggle = useCallback((originX?: number, originY?: number) => {
    if (transitioningRef.current) return
    const toggled = resolvedTheme !== "dark"

    if (!document.startViewTransition) {
      setTheme(toggled ? "dark" : "light")
      return
    }

    transitioningRef.current = true

    const cx = originX ?? window.innerWidth / 2
    const cy = originY ?? window.innerHeight / 2
    const r = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    )

    // Set CSS vars BEFORE startViewTransition so the CSS @keyframe picks them up
    document.documentElement.style.setProperty("--toggle-x", `${cx}px`)
    document.documentElement.style.setProperty("--toggle-y", `${cy}px`)
    document.documentElement.style.setProperty("--toggle-r", `${r}px`)

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(toggled ? "dark" : "light")
      })
    })

    transition.finished
      .then(() => { transitioningRef.current = false })
      .catch(() => { transitioningRef.current = false })
  }, [resolvedTheme, setTheme])

  return toggle
}
