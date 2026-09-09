"use client";

import React, { useState } from "react";
import {
  Download,
  Smartphone,
  Share,
  PlusSquare,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePwaInstall, PwaInstallDialog } from "@/components/ui/pwa-install-dialog";

export function PwaInstallCard() {
  const { isInstalled, isPromptReady, isIOS, isAndroid, triggerInstall } = usePwaInstall();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [activeTab, setActiveTab] = useState<"ios" | "android" | "desktop">(
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
      <Card className="border-border/80 bg-card text-card-foreground shadow-sm">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  Get the ARGON AI App
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Add to your phone's home screen or computer dock for quick 1-tap access.
                </CardDescription>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-auto">
              {isInstalled ? (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Installed on this device</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm cursor-pointer flex items-center gap-2 rounded-xl"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{isPromptReady ? "Install App" : "How to Install"}</span>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>
              {isInstalled
                ? "You are using the installed app. Open from your home screen or dock anytime."
                : "Works on iPhone, iPad, Android, Mac, and Windows."}
            </span>
            <button
              type="button"
              onClick={() => setShowSteps((v) => !v)}
              className="text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer shrink-0 ml-2"
            >
              <span>{showSteps ? "Hide instructions" : "Show instructions"}</span>
              {showSteps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>

          {/* Quick steps drawer */}
          {showSteps && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/30 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("ios")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "ios"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  iPhone / iPad
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("android")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "android"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("desktop")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === "desktop"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mac / Windows
                </button>
              </div>

              {activeTab === "ios" && (
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Open this site in <strong>Safari</strong> on your iPhone or iPad.</li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    Tap the <strong>Share</strong> button <Share className="h-3.5 w-3.5 text-primary inline" /> at the bottom.
                  </li>
                  <li className="flex items-center gap-1.5 flex-wrap">
                    Scroll down and tap <strong>"Add to Home Screen"</strong> <PlusSquare className="h-3.5 w-3.5 text-primary inline" />.
                  </li>
                  <li>Tap <strong>Add</strong> in the top right. That’s it!</li>
                </ol>
              )}

              {activeTab === "android" && (
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                  <li>Open this site in <strong>Chrome</strong> on your Android device.</li>
                  <li>Tap <strong>"Install App"</strong> above, or tap the three dots menu (<strong>⋮</strong>).</li>
                  <li>Select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.</li>
                </ol>
              )}

              {activeTab === "desktop" && (
                <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                  <li>In Chrome, Edge, or Brave, look at the right side of the address bar.</li>
                  <li>Click the <strong>Install icon</strong> (or click the Install App button above).</li>
                  <li>Confirm to add ARGON AI as a dedicated app on your computer.</li>
                </ol>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PwaInstallDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
