"use client";

import React, { useState } from "react";
import {
  Download,
  CheckCircle2,
  Smartphone,
  Monitor,
  Share,
  PlusSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePwaInstall, PwaInstallDialog } from "@/components/ui/pwa-install-dialog";

export function PwaInstallCard() {
  const { isInstalled, isPromptReady, isIOS, isAndroid, triggerInstall } = usePwaInstall();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [activePlatformTab, setActivePlatformTab] = useState<"ios" | "android" | "desktop">(
    isIOS ? "ios" : isAndroid ? "android" : "desktop"
  );
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isPromptReady) {
      setIsInstalling(true);
      const accepted = await triggerInstall();
      setIsInstalling(false);
      if (!accepted) {
        setDialogOpen(true);
      }
    } else {
      setDialogOpen(true);
    }
  };

  return (
    <>
      <Card className="relative overflow-hidden border-border/80 bg-card text-card-foreground shadow-lg transition-all">
        {/* Subtle accent gradient background bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-emerald-500" />

        <CardHeader className="p-5 sm:p-6 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                    Mobile & Desktop Application
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                      PWA
                    </span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Fast, standalone executive command center with offline caching
                  </CardDescription>
                </div>
              </div>
            </div>

            {/* Live Status Badge */}
            <div className="shrink-0 self-start sm:self-auto">
              {isInstalled ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Installed & Active</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                  <Download className="h-3.5 w-3.5" />
                  <span>Ready to Install</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 pt-0 space-y-5">
          {/* Main prompt banner */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <p className="text-sm text-foreground font-medium">
                {isInstalled
                  ? "ARGON AI is installed on this device in native standalone mode."
                  : "Install ARGON AI on your home screen or desktop for direct, distraction-free access."}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isInstalled
                  ? "Enjoy instant launch without browser frames, safe offline caching, and faster keyboard workflows."
                  : "No app store required. Runs instantly with zero storage bloat, native gestures, and cached speed."}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {isInstalled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialogOpen(true)}
                  className="h-9 px-4 text-xs font-medium border-border hover:bg-muted text-foreground cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Installation Guide
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isPromptReady ? "Install App Now" : "Install / Setup Guide"}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuides((v) => !v)}
                className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                title="Toggle platform instructions"
              >
                {showGuides ? (
                  <>
                    <span>Hide Steps</span>
                    <ChevronUp className="h-3.5 w-3.5 ml-1" />
                  </>
                ) : (
                  <>
                    <span>Quick Steps</span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Quick Platform Guide Drawer */}
          {showGuides && (
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Platform selector tabs */}
              <div className="flex items-center gap-2 border-b border-border/60 pb-2.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePlatformTab("ios")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePlatformTab === "ios"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  iOS (iPhone / iPad)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatformTab("android")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePlatformTab === "android"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  Android (Chrome)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePlatformTab("desktop")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activePlatformTab === "desktop"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  macOS & Windows
                </button>
              </div>

              {/* iOS instructions */}
              {activePlatformTab === "ios" && (
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      1
                    </span>
                    <p className="pt-0.5">
                      Open this page in <strong>Apple Safari</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      2
                    </span>
                    <p className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                      Tap the <strong>Share</strong> button <Share className="h-3.5 w-3.5 text-primary inline" /> in Safari’s bottom toolbar.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      3
                    </span>
                    <p className="pt-0.5 flex items-center gap-1.5 flex-wrap">
                      Scroll down and tap <strong>"Add to Home Screen"</strong>{" "}
                      <PlusSquare className="h-3.5 w-3.5 text-primary inline" />.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      4
                    </span>
                    <p className="pt-0.5">Tap <strong>Add</strong> in the top-right corner.</p>
                  </div>
                </div>
              )}

              {/* Android instructions */}
              {activePlatformTab === "android" && (
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      1
                    </span>
                    <p className="pt-0.5">Open this page in <strong>Google Chrome</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      2
                    </span>
                    <p className="pt-0.5">
                      Tap the <strong>"Install App Now"</strong> button above, or tap Chrome's three dots menu (<strong>⋮</strong>).
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      3
                    </span>
                    <p className="pt-0.5">
                      Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong> and confirm.
                    </p>
                  </div>
                </div>
              )}

              {/* Desktop instructions */}
              {activePlatformTab === "desktop" && (
                <div className="space-y-2 text-xs text-muted-foreground pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      1
                    </span>
                    <p className="pt-0.5">
                      Using Chrome, Edge, or Brave on Mac/Windows/Linux:
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      2
                    </span>
                    <p className="pt-0.5">
                      Click the <strong>Install icon</strong> in your browser's URL address bar (right side) or click <strong>Install App Now</strong> above.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      3
                    </span>
                    <p className="pt-0.5">
                      Confirm installation to add ARGON AI to your macOS Dock or Windows Start menu.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-start gap-2.5">
              <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-foreground">Instant Launch</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Pre-cached service worker assets boot in milliseconds.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-start gap-2.5">
              <Monitor className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-foreground">Standalone Workspace</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Runs without browser URL bars or tabs for maximum focus.
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/60 bg-card/40 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-foreground">Secure & Offline-Ready</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Cached interface works smoothly through network flickers.
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Full walkthrough dialog */}
      <PwaInstallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
