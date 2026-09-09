"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Share, PlusSquare, Check, Smartphone, Monitor, X, MoreVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running in standalone mode (already installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // Platform detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));
    const isAndroidDevice = /android/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 1. Immediately check if beforeinstallprompt was already captured by PwaRegister
    if ((window as any).__pwaInstallPrompt) {
      setDeferredPrompt((window as any).__pwaInstallPrompt);
    }

    // 2. Listen for standard beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 3. Listen for custom event dispatched by PwaRegister
    const handlePwaInstallable = () => {
      if ((window as any).__pwaInstallPrompt) {
        setDeferredPrompt((window as any).__pwaInstallPrompt);
      }
    };

    // 4. Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== "undefined") {
        (window as any).__pwaInstallPrompt = null;
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("pwa-installable", handlePwaInstallable);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pwa-installed", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("pwa-installable", handlePwaInstallable);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pwa-installed", handleAppInstalled);
    };
  }, []);

  const triggerInstall = useCallback(async () => {
    const promptEvent = deferredPrompt || (typeof window !== "undefined" ? (window as any).__pwaInstallPrompt : null);
    if (promptEvent && typeof promptEvent.prompt === "function") {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
          if (typeof window !== "undefined") {
            (window as any).__pwaInstallPrompt = null;
          }
          return true;
        }
      } catch (err) {
        console.warn("[PWA] Prompt invocation failed:", err);
      }
    }
    return false;
  }, [deferredPrompt]);

  return {
    canInstall: !isInstalled,
    isPromptReady: !!deferredPrompt || (typeof window !== "undefined" && !!(window as any).__pwaInstallPrompt),
    isInstalled,
    isIOS,
    isAndroid,
    triggerInstall,
  };
}

export function PwaInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { isPromptReady, isInstalled, isIOS, isAndroid, triggerInstall } = usePwaInstall();
  const [installing, setInstalling] = useState(false);

  if (!open) return null;

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      const installed = await triggerInstall();
      if (installed) {
        onOpenChange(false);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-md bg-card/95 border border-border/80 rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 backdrop-blur-xl text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1.5 rounded-xl hover:bg-muted/80 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shrink-0 shadow-inner">
            <img src="/logo.jpeg" alt="Argon AI" className="h-8 w-8 rounded-xl object-cover shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-foreground tracking-wide font-sarala">Install ARGON AI</h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                PWA
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Download as Mobile WebApp or Desktop App</p>
          </div>
        </div>

        {/* Content based on state */}
        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Check className="h-5 w-5 shrink-0" />
              <span>ARGON AI is already installed!</span>
            </div>
            <p className="text-xs text-muted-foreground">
              You are currently running ARGON AI in standalone mode with full hardware acceleration and instant launch.
            </p>
          </div>
        ) : isIOS ? (
          /* iOS Safari Instructions */
          <div className="space-y-3 bg-muted/40 border border-border/80 rounded-xl p-4 text-sm text-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground text-xs uppercase tracking-wider text-primary">
              <Smartphone className="h-4 w-4" />
              <span>Install on iPhone / iPad (Safari)</span>
            </div>

            <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal pl-4">
              <li className="leading-relaxed">
                Tap the <strong className="text-foreground inline-flex items-center gap-1 font-semibold">Share <Share className="h-3.5 w-3.5 inline text-sky-400" /></strong> button in Safari's bottom toolbar.
              </li>
              <li className="leading-relaxed">
                Scroll down the share sheet and tap <strong className="text-foreground inline-flex items-center gap-1 font-semibold">Add to Home Screen <PlusSquare className="h-3.5 w-3.5 inline text-primary" /></strong>.
              </li>
              <li className="leading-relaxed">
                Tap <strong className="text-foreground font-semibold">Add</strong> in the top-right corner to finish.
              </li>
            </ol>

            <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground/90 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Launches in full screen without browser toolbars.</span>
            </div>
          </div>
        ) : isPromptReady ? (
          /* Android / Desktop with native prompt ready */
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="text-xs leading-relaxed">
                Install ARGON AI on your device for instant launch, full-screen standalone window, and seamless offline-ready access.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Mobile WebApp</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50">
                  <Monitor className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Desktop App</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleInstallClick}
              disabled={installing}
              className="w-full h-11 bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer transition-all active:scale-[0.99]"
            >
              <Download className="h-4 w-4" />
              <span>{installing ? "Installing..." : "Install ARGON AI Now"}</span>
            </Button>
          </div>
        ) : (
          /* Android / Browser when prompt not yet fired or blocked by browser */
          <div className="space-y-4">
            <div className="space-y-3 bg-muted/40 border border-border/80 rounded-xl p-4 text-sm text-foreground">
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-primary">
                {isAndroid ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                <span>{isAndroid ? "Install via Android Chrome" : "Install via Browser"}</span>
              </div>

              <ol className="space-y-2.5 text-xs text-muted-foreground list-decimal pl-4">
                <li className="leading-relaxed">
                  Tap the <strong className="text-foreground inline-flex items-center gap-1 font-semibold">Menu <MoreVertical className="h-3.5 w-3.5 inline text-primary" /></strong> button (three dots) in the browser toolbar.
                </li>
                <li className="leading-relaxed">
                  Select <strong className="text-foreground font-semibold">"Install app"</strong> or <strong className="text-foreground font-semibold">"Add to Home screen"</strong>.
                </li>
                <li className="leading-relaxed">
                  Confirm <strong className="text-foreground font-semibold">Install</strong> to add ARGON AI to your home screen or app launcher.
                </li>
              </ol>
            </div>

            <Button
              onClick={handleInstallClick}
              variant="outline"
              className="w-full h-10 border-primary/30 text-primary hover:bg-primary/10 flex items-center justify-center gap-2 rounded-xl text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Try Instant Install</span>
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Supported on iOS, Android, Mac & Windows</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
