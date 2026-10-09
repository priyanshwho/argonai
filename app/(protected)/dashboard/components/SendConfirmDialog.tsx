"use client";

import React, { useState } from "react";
import {
  Send,
  X,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachGroupItem, OutreachRecipientItem } from "./types";

interface SendConfirmDialogProps {
  isOpen: boolean;
  group: OutreachGroupItem;
  recipients: OutreachRecipientItem[];
  onClose: () => void;
  onSendComplete: (result: any) => void;
}

export function SendConfirmDialog({
  isOpen,
  group,
  recipients,
  onClose,
  onSendComplete,
}: SendConfirmDialogProps) {
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const approvedRecipients = recipients.filter(
    (r) => r.status === "approved" && r.subject && r.body
  );
  const draftRecipients = recipients.filter(
    (r) => r.status === "draft" && r.subject && r.body
  );

  const targetsToSend = includeDrafts
    ? [...approvedRecipients, ...draftRecipients]
    : approvedRecipients;

  const handleConfirmSend = async () => {
    if (targetsToSend.length === 0) return;

    setIsSending(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/outreach/groups/${group.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientIds: targetsToSend.map((t) => t.id),
          allowDrafts: includeDrafts,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send batch outreach");
      }

      onSendComplete(data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute send batch");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Confirm Bulk Outreach Send
              </h2>
              <p className="text-xs text-muted-foreground">
                Group: <span className="text-foreground font-medium">{group.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSending}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="mt-4 space-y-4">
          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-muted/40 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Target Recipients:</span>
              <span className="font-semibold text-foreground">
                {targetsToSend.length} companies
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Group Attachment:</span>
              <span className="font-medium text-foreground flex items-center gap-1 truncate max-w-[200px]">
                <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                {group.attachmentName || "None"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Approved Drafts:</span>
              <span className="text-blue-500 font-medium">
                {approvedRecipients.length}
              </span>
            </div>

            {draftRecipients.length > 0 && (
              <label className="flex items-center gap-2 pt-2 border-t border-border/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDrafts}
                  onChange={(e) => setIncludeDrafts(e.target.checked)}
                  disabled={isSending}
                  className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                />
                <span className="text-xs text-muted-foreground">
                  Also include {draftRecipients.length} unapproved draft(s)
                </span>
              </label>
            )}
          </div>

          {/* Security Note */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Direct Gmail Delivery:</span>
              <p className="text-[11px] opacity-90 mt-0.5">
                Emails are sent directly through your authenticated Google workspace. Each email contains unique personalized text and the attached group PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60 mt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSending}
            className="h-8 text-xs px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirmSend}
            disabled={isSending || targetsToSend.length === 0}
            className="h-8 text-xs px-5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            {isSending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Send {targetsToSend.length} Emails
          </Button>
        </div>
      </div>
    </div>
  );
}
