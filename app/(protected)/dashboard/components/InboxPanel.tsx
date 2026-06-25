"use client";

import React from "react";
import {
  RefreshCw, Inbox, Sparkles, Send, Edit3, Clipboard,
  Check, AlertCircle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmailItem } from "./types";

interface InboxPanelProps {
  emailsLoading: boolean;
  emails: EmailItem[];
  selectedEmail: EmailItem | null;
  setSelectedEmail: (e: EmailItem | null) => void;
  setAiSummary: (v: string) => void;
  setAiDraft: (v: string) => void;
  aiSummaryLoading: boolean;
  aiSummary: string;
  aiDraftLoading: boolean;
  aiDraft: string;
  setAiDraftValue: (v: string) => void;
  draftInstructions: string;
  setDraftInstructions: (v: string) => void;
  sendingInboxReply: boolean;
  inboxReplyStatus: { type: "success" | "error"; message: string } | null;
  onSummarize: (gmailId: string) => void;
  onDraftReply: (gmailId: string) => void;
  onSendReply: () => void;
  onAskAI: (subject: string, sender: string, threadId: string) => void;
  copyToClipboard: (text: string) => void;
}

export function InboxPanel({
  emailsLoading,
  emails,
  selectedEmail,
  setSelectedEmail,
  setAiSummary,
  setAiDraft,
  aiSummaryLoading,
  aiSummary,
  aiDraftLoading,
  aiDraft,
  setAiDraftValue,
  draftInstructions,
  setDraftInstructions,
  sendingInboxReply,
  inboxReplyStatus,
  onSummarize,
  onDraftReply,
  onSendReply,
  onAskAI,
  copyToClipboard,
}: InboxPanelProps) {
  return (
    <div className="flex h-full divide-x divide-border/60 overflow-hidden w-full">
      {/* Email List */}
      <div
        className={`overflow-y-auto p-4 space-y-3 shrink-0 transition-all ${
          selectedEmail ? "w-[360px]" : "flex-1"
        }`}
      >
        {emailsLoading ? (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-24">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading Gmail cache...</span>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
              <Inbox className="h-7 w-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-semibold text-foreground/60">No emails synced</p>
            <p className="text-xs text-muted-foreground">
              Connect Gmail to sync your inbox cache.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {emails.map((email) => {
              const initials = email.sender
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();
              const colors = [
                "bg-red-500",
                "bg-blue-500",
                "bg-emerald-500",
                "bg-violet-500",
                "bg-amber-500",
                "bg-pink-500",
              ];
              const color = colors[email.sender.charCodeAt(0) % colors.length];
              return (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    setAiSummary("");
                    setAiDraft("");
                  }}
                  className={`w-full p-3 flex items-start gap-2.5 text-left rounded-xl border transition-all ${
                    selectedEmail?.id === email.id
                      ? "bg-accent border-primary/30 shadow-sm"
                      : "bg-card/60 border-border/60 hover:bg-muted/60 hover:border-border"
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full ${color} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm`}
                  >
                    {initials || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-foreground truncate">
                        {email.sender}
                      </span>
                      <span className="text-[9px] text-muted-foreground shrink-0">
                        {new Date(email.receivedAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 block truncate">
                      {email.subject}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 line-clamp-1 leading-relaxed">
                      {email.snippet}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Email Detail */}
      {selectedEmail && (
        <div className="flex-1 overflow-y-auto p-6 bg-card/10 select-text flex flex-col gap-6">
          <div className="flex justify-between items-center pb-3 border-b border-border/60">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Email Details
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEmail(null)}
              className="text-xs hover:bg-muted text-muted-foreground shrink-0 cursor-pointer h-8"
            >
              Close Details
            </Button>
          </div>

          <div className="space-y-6">
            {/* Email metadata */}
            <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4 shadow-xl select-text">
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">
                  Sender
                </span>
                <p className="text-sm font-bold text-foreground break-words leading-snug">
                  {selectedEmail.sender}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">
                  Subject
                </span>
                <p className="text-base font-extrabold text-foreground leading-snug break-words">
                  {selectedEmail.subject}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">
                  Received
                </span>
                <p className="text-xs text-muted-foreground font-medium">
                  {new Date(selectedEmail.receivedAt).toLocaleString()}
                </p>
              </div>
              <div className="pt-4 border-t border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-2">
                  {selectedEmail.body ? "Message Content" : "Snippet"}
                </span>
                <div className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap select-text max-h-[300px] overflow-y-auto pr-1">
                  {selectedEmail.body || selectedEmail.snippet}
                </div>
              </div>
            </div>

            {/* Ask AI quick button */}
            <button
              onClick={() =>
                onAskAI(selectedEmail.subject, selectedEmail.sender, selectedEmail.threadId)
              }
              className="w-full flex items-center justify-between p-3 rounded-xl border border-border/60 bg-card/30 hover:bg-muted/40 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground/80">
                  Ask AI to reply to this email
                </span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/80 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
            </button>

            {/* AI Actions */}
            <div className="space-y-5 pt-4 border-t border-border/60">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                AI Assistant Actions
              </h4>

              {/* Summary */}
              <div className="space-y-2">
                <Button
                  onClick={() => onSummarize(selectedEmail.gmailId)}
                  disabled={aiSummaryLoading}
                  className="w-full bg-secondary hover:bg-muted text-secondary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 border border-border rounded-xl cursor-pointer"
                >
                  {aiSummaryLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 text-primary" />
                  )}
                  <span>Generate Bullet Summary</span>
                </Button>

                {aiSummary && (
                  <div className="p-4 rounded-2xl border border-border bg-card/35 text-sm text-foreground/90 leading-relaxed relative whitespace-pre-wrap select-text shadow-inner animate-in fade-in duration-200">
                    <button
                      onClick={() => copyToClipboard(aiSummary)}
                      className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                      title="Copy Summary"
                    >
                      <Clipboard className="h-4 w-4" />
                    </button>
                    <strong className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block pb-2">
                      AI Summary
                    </strong>
                    {aiSummary}
                  </div>
                )}
              </div>

              {/* Draft Reply */}
              <div className="space-y-3.5 pt-4 border-t border-border">
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Drafting instructions (optional)
                  </span>
                  <input
                    type="text"
                    placeholder="e.g., politely decline, ask to reschedule..."
                    value={draftInstructions}
                    onChange={(e) => setDraftInstructions(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 h-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80 focus:ring-1 focus:ring-ring"
                  />
                </div>

                <Button
                  onClick={() => onDraftReply(selectedEmail.gmailId)}
                  disabled={aiDraftLoading}
                  className="w-full bg-secondary hover:bg-muted text-secondary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 border border-border rounded-xl cursor-pointer"
                >
                  {aiDraftLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Edit3 className="h-4 w-4 text-foreground/80" />
                  )}
                  <span>Generate Response Draft</span>
                </Button>

                {aiDraft && (
                  <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <textarea
                        value={aiDraft}
                        onChange={(e) => setAiDraftValue(e.target.value)}
                        rows={8}
                        className="w-full bg-background border border-border rounded-xl p-3.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80 focus:ring-1 focus:ring-ring select-text leading-relaxed resize-y shadow-inner"
                        placeholder="Edit the reply draft here..."
                      />
                      <button
                        onClick={() => copyToClipboard(aiDraft)}
                        className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        title="Copy Draft"
                      >
                        <Clipboard className="h-4 w-4" />
                      </button>
                    </div>

                    {inboxReplyStatus && (
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                          inboxReplyStatus.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                            : "bg-destructive/10 border-destructive/20 text-destructive"
                        }`}
                      >
                        {inboxReplyStatus.type === "success" ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <AlertCircle className="h-4 w-4" />
                        )}
                        <span>{inboxReplyStatus.message}</span>
                      </div>
                    )}

                    <Button
                      onClick={onSendReply}
                      disabled={sendingInboxReply}
                      className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 rounded-xl font-bold shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
                    >
                      {sendingInboxReply ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      <span>Send Reply</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
