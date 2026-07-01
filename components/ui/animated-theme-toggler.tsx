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

function runCircleTransition(
  cx: number,
  cy: number,
  toggled: boolean,
  setTheme: (t: string) => void,
  onDone: () => void
) {
  const r = Math.hypot(
    Math.max(cx, window.innerWidth - cx),
    Math.max(cy, window.innerHeight - cy)
  )

  const transition = document.startViewTransition(() => {
    flushSync(() => {
      setTheme(toggled ? "dark" : "light")
    })
  })

  // .then() fires after the pseudo-elements are mounted but before the
  // CSS vt-keepalive animation has changed anything — WAAPI runs at higher
  // cascade priority and takes over clip-path for exactly 700ms.
  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${cx}px ${cy}px)`,
          `circle(${r}px at ${cx}px ${cy}px)`,
        ],
      },
      {
        duration: 700,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }).catch(() => {/* aborted – safe to ignore */})

  transition.finished
    .then(onDone)
    .catch(onDone)
}

export const AnimatedThemeToggler = ({ className }: AnimatedThemeTogglerProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { resolvedTheme, setTheme } = useTheme()
  const darkMode = resolvedTheme === "dark"
  const transitioningRef = useRef(false)

  const onToggle = useCallback(() => {
    if (!buttonRef.current || transitioningRef.current) return
    if (!document.startViewTransition) {
      setTheme(!darkMode ? "dark" : "light")
      return
    }

    transitioningRef.current = true

    const rect = buttonRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    runCircleTransition(cx, cy, !darkMode, setTheme, () => {
      transitioningRef.current = false
    })
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
    if (!document.startViewTransition) {
      setTheme(resolvedTheme !== "dark" ? "dark" : "light")
      return
    }

    transitioningRef.current = true

    const cx = originX ?? window.innerWidth / 2
    const cy = originY ?? window.innerHeight / 2

    runCircleTransition(cx, cy, resolvedTheme !== "dark", setTheme, () => {
      transitioningRef.current = false
    })
  }, [resolvedTheme, setTheme])

  return toggle
}
