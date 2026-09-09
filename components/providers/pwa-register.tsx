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
    // We call e.preventDefault() to take manual control of the installation prompt,
    // allowing our custom UI button / dialog to trigger e.prompt() cleanly.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("pwa-installable"));
      console.log("[PWA] Install prompt event captured and ready");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for successful app install
    const handleAppInstalled = () => {
      console.log("[PWA] App was installed successfully");
      (window as any).__pwaInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("pwa-installed"));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}
