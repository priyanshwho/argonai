"use client";

import React, { useState } from "react";
import { Unplug, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface DisconnectButtonProps {
  pluginId: "gmail" | "googlecalendar";
  /** Label shown in the confirmation dialog, e.g. "Gmail" or "Google Calendar" */
  label: string;
  /** Optional: compact mode for the dashboard panel (smaller button) */
  compact?: boolean;
}

export function DisconnectButton({ pluginId, label, compact }: DisconnectButtonProps) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/integrations/${pluginId}/disconnect`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to disconnect");
      }

      setOpen(false);
      // Re-fetch server state so the UI updates from "Connected" → "Not connected"
      router.refresh();
    } catch (err) {
      console.error(`Failed to disconnect ${pluginId}:`, err);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={compact ? "ghost" : "outline"}
            size="sm"
            className={
              compact
                ? "text-muted-foreground hover:text-destructive text-xs hover:bg-destructive/10 h-8 cursor-pointer"
                : "text-xs border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:border-destructive/40 h-8 px-3 rounded-xl cursor-pointer transition-colors"
            }
          />
        }
      >
        <Unplug className="h-3.5 w-3.5 mr-1" />
        Disconnect
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disconnect {label}?</DialogTitle>
          <DialogDescription>
            This will revoke ARGON AI&apos;s access to your {label} account and
            remove all synced data. You can reconnect any time from this page.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <DialogClose
            render={
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl cursor-pointer"
                disabled={loading}
              />
            }
          >
            Cancel
          </DialogClose>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDisconnect}
            disabled={loading}
            className="rounded-xl cursor-pointer text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Disconnecting…
              </>
            ) : (
              <>
                <Unplug className="h-3.5 w-3.5 mr-1.5" />
                Disconnect
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
