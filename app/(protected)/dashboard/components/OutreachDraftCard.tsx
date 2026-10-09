"use client";

import React, { useState } from "react";
import {
  Check,
  RefreshCw,
  FileText,
  Send,
  Trash2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Building2,
  Mail,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachRecipientItem } from "./types";
import { OutreachToneBar } from "./OutreachToneBar";

interface OutreachDraftCardProps {
  recipient: OutreachRecipientItem;
  groupId: string;
  attachmentName?: string | null;
  onUpdate: (updated: OutreachRecipientItem) => void;
  onDelete: (recipientId: string) => void;
}

export function OutreachDraftCard({
  recipient,
  groupId,
  attachmentName,
  onUpdate,
  onDelete,
}: OutreachDraftCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(recipient.errorMessage || null);

  // Form states for manual editing
  const [companyName, setCompanyName] = useState(recipient.companyName);
  const [email, setEmail] = useState(recipient.email);
  const [subject, setSubject] = useState(recipient.subject || "");
  const [body, setBody] = useState(recipient.body || "");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Status badge styling
  const getStatusBadge = () => {
    switch (recipient.status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Sent {recipient.sentAt ? new Date(recipient.sentAt).toLocaleDateString() : ""}
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <Check className="w-3 h-3" />
            Approved
          </span>
        );
      case "generating":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating AI Draft
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  // Save manual modifications
  const handleSaveEdits = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/outreach/groups/${groupId}/recipients/${recipient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          email,
          subject,
          body,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update draft");
      }

      const updated = await res.json();
      onUpdate(updated);
      setIsEditing(false);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle approval status
  const handleToggleApprove = async () => {
    const nextStatus = recipient.status === "approved" ? "draft" : "approved";
    try {
      const res = await fetch(`/api/outreach/groups/${groupId}/recipients/${recipient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // Regenerate draft with AI
  const handleRegenerate = async () => {
    if (hasUnsavedChanges) {
      const confirm = window.confirm(
        "You have unsaved edits. Regenerating with AI will replace them. Proceed?"
      );
      if (!confirm) return;
    }

    setIsRegenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/outreach/groups/${groupId}/recipients/${recipient.id}/regenerate`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to regenerate draft");
      }

      const updated = await res.json();
      setSubject(updated.subject || "");
      setBody(updated.body || "");
      setHasUnsavedChanges(false);
      onUpdate(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to regenerate");
    } finally {
      setIsRegenerating(false);
    }
  };

  // Tone Refinement
  const handleRefine = async (tone: string, customPrompt?: string) => {
    setIsRefining(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/outreach/groups/${groupId}/recipients/${recipient.id}/refine`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tone,
            customPrompt,
            currentSubject: subject,
            currentBody: body,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to refine draft");
      }

      const updated = await res.json();
      setSubject(updated.subject || "");
      setBody(updated.body || "");
      setHasUnsavedChanges(false);
      onUpdate(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to refine draft");
    } finally {
      setIsRefining(false);
    }
  };

  // Send single email immediately
  const handleSendSingle = async () => {
    if (recipient.status === "sent") return;
    const confirm = window.confirm(
      `Send this personalized email to ${email} (${companyName}) now?`
    );
    if (!confirm) return;

    setIsSending(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/outreach/groups/${groupId}/recipients/${recipient.id}/send`,
        { method: "POST" }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      if (data.recipient) {
        onUpdate(data.recipient);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={`relative rounded-xl border bg-card/60 backdrop-blur-sm p-4 transition-all duration-200 hover:shadow-md ${
        recipient.status === "approved"
          ? "border-blue-500/40 bg-blue-500/[0.02]"
          : recipient.status === "sent"
          ? "border-emerald-500/30 bg-emerald-500/[0.01]"
          : recipient.status === "error"
          ? "border-rose-500/40 bg-rose-500/[0.02]"
          : "border-border/80"
      }`}
    >
      {/* ── CARD HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
            {companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-foreground">
                {companyName}
              </span>
              {getStatusBadge()}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-muted-foreground/70" />
              <span>{email}</span>
            </div>
          </div>
        </div>

        {/* Header Quick Actions */}
        <div className="flex items-center gap-1.5 ml-auto">
          {recipient.status !== "sent" && (
            <>
              <Button
                variant={recipient.status === "approved" ? "default" : "outline"}
                size="sm"
                onClick={handleToggleApprove}
                className={`h-7 px-2.5 text-xs rounded-md transition-all gap-1 ${
                  recipient.status === "approved"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-border/70 hover:bg-muted"
                }`}
              >
                <Check className="w-3 h-3" />
                {recipient.status === "approved" ? "Approved" : "Approve"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7 px-2 text-xs rounded-md border-border/70 hover:bg-muted"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(recipient.id)}
            className="h-7 px-2 text-xs rounded-md text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* ── ERROR ALERT ── */}
      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-500/70 hover:text-rose-500"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* ── CARD CONTENT ── */}
      <div className="mt-3 space-y-3">
        {isEditing ? (
          /* EDIT MODE */
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase">
                  Company Name
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => {
                    setCompanyName(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full mt-1 h-8 text-xs px-2.5 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase">
                  Recipient Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full mt-1 h-8 text-xs px-2.5 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                placeholder="Enter subject line..."
                className="w-full mt-1 h-8 text-xs px-2.5 rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/40 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase">
                Email Body
              </label>
              <textarea
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                rows={6}
                placeholder="Write or refine email body..."
                className="w-full mt-1 p-2.5 text-xs rounded-md border border-border bg-background focus:ring-1 focus:ring-primary/40 focus:outline-none resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setCompanyName(recipient.companyName);
                  setEmail(recipient.email);
                  setSubject(recipient.subject || "");
                  setBody(recipient.body || "");
                  setHasUnsavedChanges(false);
                }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdits}
                disabled={isSaving}
                className="h-7 text-xs gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          /* VIEW MODE */
          <div className="space-y-2.5">
            {/* Subject */}
            <div>
              <div className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                Subject:
              </div>
              <div className="text-sm font-medium text-foreground mt-0.5">
                {subject ? subject : <span className="italic text-muted-foreground">No draft generated yet</span>}
              </div>
            </div>

            {/* Body */}
            <div>
              <div className="text-[11px] font-medium text-muted-foreground/80 tracking-wide uppercase">
                Message:
              </div>
              <div className="mt-1 p-3 rounded-lg bg-background/60 border border-border/60 text-xs text-foreground/90 whitespace-pre-wrap font-sans leading-relaxed min-h-[90px]">
                {body ? (
                  body
                ) : (
                  <span className="italic text-muted-foreground">
                    Draft not generated. Click &quot;Regenerate with AI&quot; or &quot;Generate Drafts&quot; above to create one.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ATTACHMENT BADGE ── */}
        {attachmentName && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/[0.04] border border-primary/15 text-xs">
            <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-medium text-primary truncate">{attachmentName}</span>
            <span className="text-[10px] text-muted-foreground ml-auto uppercase tracking-wider font-mono">
              Group PDF Attached
            </span>
          </div>
        )}

        {/* ── TONE REFINEMENT BAR (available if draft body exists and not sent) ── */}
        {recipient.status !== "sent" && body && (
          <OutreachToneBar
            onRefine={handleRefine}
            isLoading={isRefining}
          />
        )}

        {/* ── BOTTOM ACTIONS ── */}
        {recipient.status !== "sent" && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isRegenerating || isRefining}
              className="h-7 text-xs px-2.5 rounded-md border-border/70 hover:bg-muted flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isRegenerating ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              {isRegenerating ? "Generating..." : "Regenerate AI"}
            </Button>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="default"
                size="sm"
                onClick={handleSendSingle}
                disabled={isSending || !body || !subject}
                className="h-7 text-xs px-3 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                {isSending ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                Send Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
