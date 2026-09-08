"use client";

import { useEffect } from "react";

/**
 * PwaRegister
 * - Registers the service worker for PWA install eligibility
 * - Does NOT call preventDefault() on beforeinstallprompt,
 *   which allows Chrome's native mini-infobar to appear at the top
 * - Stores the deferred prompt on window in case it's needed later
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.warn("[PWA] Service Worker registration failed:", error);
        });
    }

    // Listen for the beforeinstallprompt event
    // By NOT calling e.preventDefault(), we allow Chrome's native
    // mini-infobar to appear at the top of the screen on mobile
    const handleBeforeInstallPrompt = (e: Event) => {
      // Store the event for potential programmatic use later
      (window as any).__pwaInstallPrompt = e;
      console.log("[PWA] Install prompt available — Chrome mini-infobar should appear");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful app install
    const handleAppInstalled = () => {
      console.log("[PWA] App was installed successfully");
      (window as any).__pwaInstallPrompt = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
