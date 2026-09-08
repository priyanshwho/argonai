"use client";

import React, { useState, useEffect } from "react";
import { Download, Share, PlusSquare, Check, Smartphone, Monitor, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);

      // Check for iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isIosDevice);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const triggerInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  return {
    canInstall: !!deferredPrompt || isIOS,
    isPromptReady: !!deferredPrompt,
    isInstalled,
    isIOS,
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
  const { isPromptReady, isInstalled, isIOS, triggerInstall } = usePwaInstall();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <img src="/logo.jpeg" alt="Argon AI" className="h-9 w-9 rounded-lg object-cover" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Install ARGON AI</h3>
            <p className="text-xs text-muted-foreground">Download as an app on Phone or Desktop</p>
          </div>
        </div>

        {isInstalled ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-2.5 text-sm font-semibold">
            <Check className="h-5 w-5 shrink-0" />
            <span>ARGON AI is already installed and running as a standalone app!</span>
          </div>
        ) : isIOS ? (
          <div className="space-y-3 bg-muted/30 border border-border/70 rounded-xl p-4 text-sm text-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-primary" /> Install on iPhone / iPad:
            </p>
            <ol className="space-y-2 text-xs text-muted-foreground list-decimal pl-4">
              <li>
                Tap the <strong className="text-foreground inline-flex items-center gap-1">Share <Share className="h-3 w-3 inline" /></strong> button in Safari's bottom toolbar.
              </li>
              <li>
                Scroll down and tap <strong className="text-foreground inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="h-3 w-3 inline" /></strong>.
              </li>
              <li>
                Tap <strong className="text-foreground">Add</strong> in the top-right corner.
              </li>
            </ol>
            <p className="text-[11px] text-muted-foreground/80 pt-1">
              ARGON AI will be added to your home screen with high-performance standalone mode.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                Install ARGON AI on your device for instant launch, full-screen standalone window, and seamless offline-ready access.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <Monitor className="h-4 w-4 text-primary shrink-0" />
                  <span>Desktop App (Mac & PC)</span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50">
                  <Smartphone className="h-4 w-4 text-primary shrink-0" />
                  <span>Mobile App (Android & iOS)</span>
                </div>
              </div>
            </div>

            <Button
              onClick={async () => {
                if (isPromptReady) {
                  await triggerInstall();
                  onOpenChange(false);
                } else {
                  alert("To install, use the browser menu (e.g. Chrome/Edge three dots → 'Install Argon AI' or 'Add to Home screen').");
                }
              }}
              className="w-full h-11 bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center justify-center gap-2 rounded-xl shadow-md cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Install ARGON AI Now</span>
            </Button>
          </div>
        )}

        <div className="pt-2 border-t border-border/50 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
