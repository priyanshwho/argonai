"use client";

import React, { useState } from "react";
import {
  UserPlus,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ListPlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OutreachRecipientItem } from "./types";

interface AddRecipientsDialogProps {
  isOpen: boolean;
  groupId: string;
  groupName: string;
  onClose: () => void;
  onSuccess: (newRecipients: OutreachRecipientItem[]) => void;
}

interface ParsedEntry {
  companyName: string;
  email: string;
  customNotes?: string;
  isValid: boolean;
}

export function AddRecipientsDialog({
  isOpen,
  groupId,
  groupName,
  onClose,
  onSuccess,
}: AddRecipientsDialogProps) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Infer company name from domain (e.g. jobs@stripe.com -> Stripe)
  const inferCompanyName = (email: string): string => {
    try {
      const parts = email.split("@");
      if (parts.length > 1) {
        const domain = parts[1].split(".")[0];
        if (domain && domain !== "gmail" && domain !== "yahoo" && domain !== "outlook" && domain !== "hotmail") {
          return domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
    } catch {}
    return "Company";
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const lines = text.split("\n").filter((l) => l.trim().length > 0);

    const entries: ParsedEntry[] = lines.map((line) => {
      // Check for CSV / tab / comma split (e.g., "Stripe, jobs@stripe.com, hiring for infra")
      const tokens = line.split(/[,\t|]/).map((t) => t.trim());
      let company = "";
      let email = "";
      let notes = "";

      if (tokens.length >= 2) {
        // Find which token has the @ sign
        const emailIdx = tokens.findIndex((t) => t.includes("@"));
        if (emailIdx !== -1) {
          email = tokens[emailIdx];
          const remaining = tokens.filter((_, i) => i !== emailIdx);
          company = remaining[0] || inferCompanyName(email);
          notes = remaining.slice(1).join(", ");
        } else {
          company = tokens[0];
          email = tokens[1];
        }
      } else {
        email = tokens[0];
        company = inferCompanyName(email);
      }

      return {
        companyName: company || "Company",
        email: email.trim(),
        customNotes: notes || undefined,
        isValid: emailRegex.test(email.trim()),
      };
    });

    setParsed(entries);
  };

  const removeRow = (index: number) => {
    const updated = parsed.filter((_, i) => i !== index);
    setParsed(updated);
    // Also update raw text
    setRawText(updated.map((u) => `${u.companyName}, ${u.email}${u.customNotes ? `, ${u.customNotes}` : ""}`).join("\n"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRecipients = parsed.filter((p) => p.isValid);
    if (validRecipients.length === 0) {
      setErrorMsg("Please enter at least one valid email address");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/outreach/groups/${groupId}/recipients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: validRecipients.map((r) => ({
            companyName: r.companyName,
            email: r.email,
            customNotes: r.customNotes,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add recipients");
      }

      const data = await res.json();
      onSuccess(data.recipients || []);
      onClose();
      setRawText("");
      setParsed([]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add recipients");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Add Outreach Recipients
              </h2>
              <p className="text-xs text-muted-foreground">
                Adding to group: <span className="text-foreground font-medium">{groupName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="overflow-y-auto mt-4 space-y-4 flex-1 pr-1">
          {/* Paste Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-foreground">
                Paste Company &amp; Email List
              </label>
              <span className="text-[11px] text-muted-foreground">
                Format: <code className="bg-muted px-1 rounded">Company, email@domain.com, notes</code>
              </span>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={5}
              placeholder={`Stripe, jobs@stripe.com, looking for tech lead&#10;OpenAI, careers@openai.com&#10;Vercel, talent@vercel.com`}
              className="w-full p-3 text-xs rounded-xl border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none font-mono resize-none leading-relaxed"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsed.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <ListPlus className="w-3.5 h-3.5 text-primary" />
                  Preview ({parsed.filter((p) => p.isValid).length} valid of {parsed.length})
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-border/80 divide-y divide-border/60">
                {parsed.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 flex items-center justify-between gap-3 text-xs ${
                      !item.isValid ? "bg-rose-500/5 text-rose-500" : "bg-card"
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {item.companyName}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {item.email}
                      </span>
                      {item.customNotes && (
                        <span className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[140px]">
                          {item.customNotes}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!item.isValid ? (
                        <span className="text-[10px] text-rose-500 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Invalid email
                        </span>
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/60 mt-4 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-8 text-xs px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || parsed.filter((p) => p.isValid).length === 0}
            className="h-8 text-xs px-5 gap-1.5"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <UserPlus className="w-3.5 h-3.5" />
            )}
            Add {parsed.filter((p) => p.isValid).length} Recipients
          </Button>
        </div>
      </div>
    </div>
  );
}
