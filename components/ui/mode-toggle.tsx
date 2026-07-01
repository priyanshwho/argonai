"use client"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { flushSync } from "react-dom"
import React, { useRef } from "react"

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const transitioningRef = useRef(false)

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (transitioningRef.current) return
    const toggled = resolvedTheme !== "dark"

    if (!document.startViewTransition) {
      setTheme(toggled ? "dark" : "light")
      return
    }

    transitioningRef.current = true

    const rect = event.currentTarget.getBoundingClientRect()
    const cx = event.clientX || rect.left + rect.width / 2
    const cy = event.clientY || rect.top + rect.height / 2
    const r = Math.hypot(
      Math.max(cx, window.innerWidth - cx),
      Math.max(cy, window.innerHeight - cy)
    )

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(toggled ? "dark" : "light")
      })
    })

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
    }).catch(() => {})

    transition.finished
      .then(() => { transitioningRef.current = false })
      .catch(() => { transitioningRef.current = false })
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
