"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Bot, User, Send, RefreshCw, Check, Paperclip,
  Mic, MicOff, Sparkles, ArrowRight, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarkdownMessage } from "./MarkdownMessage";
import { EmailDraftCard } from "./EmailDraftCard";
import { CalendarDraftCard } from "./CalendarDraftCard";
import { EmailAttachment } from "./types";
import { getMessageText } from "./utils";

// ─── Inline toast (replaces alert()) ────────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-foreground text-background text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200">
      <Check className="h-3.5 w-3.5" />
      {message}
    </div>
  );
}

// ─── Thinking steps indicator ────────────────────────────────────────────────
function ThinkingSteps({ messages }: { messages: any[] }) {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const userText = lastUserMessage ? getMessageText(lastUserMessage).toLowerCase() : "";
  const lastMsg = messages[messages.length - 1];
  const toolInvocations =
    lastMsg && lastMsg.role === "assistant" ? (lastMsg as any).toolInvocations : [];

  const isGmailRelevant =
    userText.includes("mail") ||
    userText.includes("send") ||
    userText.includes("inbox") ||
    userText.includes("draft") ||
    userText.includes("email") ||
    userText.includes("reply");
  const isCalendarRelevant =
    userText.includes("calendar") ||
    userText.includes("event") ||
    userText.includes("meet") ||
    userText.includes("schedule") ||
    userText.includes("remind") ||
    userText.includes("pm") ||
    userText.includes("am") ||
    userText.includes("tomorrow");
  const isDraftRelevant =
    userText.includes("send") ||
    userText.includes("draft") ||
    userText.includes("schedule") ||
    userText.includes("remind") ||
    userText.includes("meeting");

  const gmailCall = toolInvocations?.find(
    (t: any) =>
      t.toolName === "run_script" &&
      (t.args.code?.includes("gmail") || t.args.code?.includes("messages"))
  );
  const gmailStatus = !isGmailRelevant
    ? "not-needed"
    : gmailCall
    ? gmailCall.state === "result"
      ? "completed"
      : "active"
    : "pending";

  const calCall = toolInvocations?.find(
    (t: any) =>
      t.toolName === "run_script" &&
      (t.args.code?.includes("googlecalendar") || t.args.code?.includes("events"))
  );
  const calStatus = !isCalendarRelevant
    ? "not-needed"
    : calCall
    ? calCall.state === "result"
      ? "completed"
      : "active"
    : gmailStatus === "completed" || gmailStatus === "not-needed"
    ? "active"
    : "pending";

  const draftCall = toolInvocations?.find(
    (t: any) =>
      t.toolName === "draft_email" || t.toolName === "draft_calendar_event"
  );
  const draftStatus = !isDraftRelevant
    ? "not-needed"
    : draftCall
    ? draftCall.state === "result"
      ? "completed"
      : "active"
    : calStatus === "completed" || calStatus === "not-needed"
    ? "active"
    : "pending";

  const finalizeStatus =
    (draftStatus === "completed" || draftStatus === "not-needed") &&
    (calStatus === "completed" || calStatus === "not-needed") &&
    (gmailStatus === "completed" || gmailStatus === "not-needed")
      ? "active"
      : "pending";

  const steps = [
    { id: "analyze", label: "Analyzing request parameters", status: "completed" },
    { id: "gmail", label: "Scanning Gmail workspace", status: gmailStatus },
    { id: "calendar", label: "Searching Google Calendar board", status: calStatus },
    { id: "draft", label: "Generating draft confirmation", status: draftStatus },
    { id: "finalize", label: "Formulating final explanation", status: finalizeStatus },
  ];

  return (
    <div className="flex gap-3.5 items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold bg-secondary border border-border text-foreground/90">
        <Bot className="h-3.5 w-3.5 text-muted-foreground/80 animate-pulse" />
      </div>
      <div className="p-4 rounded-2xl border border-border/50 bg-card/45 backdrop-blur-md space-y-3.5 shadow-lg w-full max-w-sm">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
          <div className="flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3 animate-spin text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/90">
              Argon AI is working...
            </span>
          </div>
        </div>
        <div className="space-y-2.5">
          {steps.map((step) => {
            if (step.status === "not-needed") return null;
            return (
              <div key={step.id} className="flex items-center gap-2.5">
                <div
                  className={`h-4 w-4 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all ${
                    step.status === "completed"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                      : step.status === "active"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-500 animate-pulse"
                      : "bg-muted/40 border-border/40 text-muted-foreground/50"
                  }`}
                >
                  {step.status === "completed" ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : step.status === "active" ? (
                    <RefreshCw className="h-2 w-2 animate-spin" />
                  ) : null}
                </div>
                <span
                  className={`text-[11px] ${
                    step.status === "completed"
                      ? "text-muted-foreground line-through decoration-muted-foreground/30"
                      : step.status === "active"
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main ChatPanel ──────────────────────────────────────────────────────────
interface ChatPanelProps {
  compact?: boolean;
  messages: any[];
  isLoading: boolean;
  status: string;
  input: string;
  setInput: (v: string) => void;
  selectedFiles: File[];
  setSelectedFiles: (fn: (prev: File[]) => File[]) => void;
  addToolResult: (args: any) => void;
  activeTab: "chat" | "inbox" | "calendar" | "configuration";
  setCalendarRightPanelMode?: (v: "assistant" | "manual") => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleListening: () => void;
  isListening: boolean;
}

export function ChatPanel({
  compact = false,
  messages,
  isLoading,
  status,
  input,
  setInput,
  selectedFiles,
  setSelectedFiles,
  addToolResult,
  activeTab,
  setCalendarRightPanelMode,
  onSubmit,
  onFileChange,
  onToggleListening,
  isListening,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToastMsg("Copied to clipboard!");
  };

  const removeFile = (idx: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const isEmpty =
    messages.filter(
      (m) =>
        getMessageText(m).trim() !== "" ||
        m.role === "user" ||
        (m as any).toolInvocations?.length > 0
    ).length === 0;

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden bg-background">
      {/* Toast */}
      {toastMsg && <Toast message={toastMsg} onDone={() => setToastMsg(null)} />}

      {/* Header (compact mode only) */}
      {compact && (
        <div className="px-4 py-3 border-b border-border/60 bg-background/60 backdrop-blur-sm shrink-0 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground tracking-wider uppercase">
              Argon Assistant
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          {activeTab === "calendar" && setCalendarRightPanelMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCalendarRightPanelMode("manual")}
              className="text-[10px] h-7 px-2 hover:bg-muted text-muted-foreground cursor-pointer"
            >
              Manual Form
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6">
        {isEmpty ? (
          /* Empty state */
          <div
            className={`${
              compact ? "w-full px-4" : "max-w-2xl mx-auto px-4"
            } flex flex-col items-center justify-center h-full gap-8`}
          >
            <div className="text-center space-y-3">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Argon AI Assistant</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Your AI-powered Gmail & Calendar command center
                </p>
              </div>
            </div>

            {!compact && (
              <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                {[
                  {
                    icon: "📧",
                    title: "Read & Summarize",
                    desc: "Summarize your recent emails",
                    prompt: "Summarize my 5 most recent emails",
                  },
                  {
                    icon: "✉️",
                    title: "Draft Emails",
                    desc: "Compose and send messages",
                    prompt: "Draft an email to",
                  },
                  {
                    icon: "📅",
                    title: "Book Meetings",
                    desc: "Schedule with conflict checking",
                    prompt: "Schedule a meeting for tomorrow at 10am",
                  },
                  {
                    icon: "🔍",
                    title: "Search Inbox",
                    desc: "Find any email by topic",
                    prompt: "Find emails about",
                  },
                ].map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setInput(item.prompt)}
                    className="p-3 text-left rounded-xl border border-border bg-card/50 hover:bg-muted/60 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg">{item.icon}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            )}

            <div className="text-center space-y-1.5 max-w-xs">
              <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">
                Operations Guide
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Query your cached correspondence, draft response text, check calendar conflicts,
                or trigger direct event creation via command parameters.
              </p>
            </div>
          </div>
        ) : (
          /* Message list */
          <div className={`${compact ? "w-full" : "max-w-2xl mx-auto"} space-y-4 px-4`}>
            {messages
              .filter(
                (m) =>
                  getMessageText(m).trim() !== "" ||
                  m.role === "user" ||
                  (m as any).toolInvocations?.length > 0
              )
              .map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold shadow-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary border border-border text-foreground/90"
                    }`}
                  >
                    {m.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Bot className="h-3 w-3 text-muted-foreground/80" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[90%] text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary/90 text-primary-foreground font-medium animate-in fade-in slide-in-from-bottom-2 duration-300"
                        : "bg-card border border-border/50 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
                    }`}
                  >
                    {m.role === "user" ? (
                      <div className="space-y-1">
                        <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
                        {/* File attachments on user message */}
                        {Array.isArray((m as any).parts) &&
                          (m as any).parts.some((p: any) => p.type === "file") && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5">
                              {(m as any).parts
                                .filter((p: any) => p.type === "file")
                                .map((p: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 bg-primary-foreground/15 border border-primary-foreground/20 rounded px-1.5 py-0.5 text-[9px] text-primary-foreground/90"
                                  >
                                    <Paperclip className="h-2.5 w-2.5" />
                                    <span>{p.filename}</span>
                                  </div>
                                ))}
                            </div>
                          )}
                      </div>
                    ) : (
                      <>
                        <MarkdownMessage content={getMessageText(m)} />

                        {/* Tool card rendering */}
                        {(m as any).toolInvocations &&
                          (m as any).toolInvocations.map((toolInvocation: any) => {
                            const { toolCallId, toolName, args } = toolInvocation;

                            if (toolName === "draft_email") {
                              // Guard: don't render if args aren't populated yet
                              if (!args?.to || !args?.subject || !args?.body) return null;

                              // Collect file attachments from the preceding user message
                              let messageAttachments: EmailAttachment[] = [];
                              const msgIndex = messages.findIndex((msg) => msg.id === m.id);
                              if (msgIndex > 0) {
                                const prevMsg = messages[msgIndex - 1];
                                if (
                                  prevMsg &&
                                  prevMsg.role === "user" &&
                                  Array.isArray((prevMsg as any).parts)
                                ) {
                                  messageAttachments = (prevMsg as any).parts
                                    .filter((p: any) => p.type === "file")
                                    .map((p: any) => ({
                                      filename: p.filename,
                                      content: p.url,
                                    }));
                                }
                              }

                              return (
                                <EmailDraftCard
                                  key={toolCallId}
                                  to={args.to}
                                  subject={args.subject}
                                  body={args.body}
                                  attachments={args.attachments || messageAttachments}
                                  threadId={args.threadId}
                                  toolCallId={toolCallId}
                                  addToolResult={addToolResult}
                                />
                              );
                            }

                            if (toolName === "draft_calendar_event") {
                              // Guard: don't render if args aren't populated yet
                              if (!args?.title || !args?.startTime || !args?.endTime) return null;

                              return (
                                <CalendarDraftCard
                                  key={toolCallId}
                                  title={args.title}
                                  startTime={args.startTime}
                                  endTime={args.endTime}
                                  attendees={args.attendees || []}
                                  toolCallId={toolCallId}
                                  addToolResult={addToolResult}
                                />
                              );
                            }

                            // run_script email list results
                            if (toolName === "run_script" && toolInvocation.result) {
                              const list = Array.isArray(toolInvocation.result)
                                ? toolInvocation.result
                                : Array.isArray(toolInvocation.result.emails)
                                ? toolInvocation.result.emails
                                : [];
                              if (
                                list.length > 0 &&
                                (list[0].subject ||
                                  list[0].sender ||
                                  list[0].from ||
                                  list[0].snippet)
                              ) {
                                return (
                                  <div
                                    key={toolCallId}
                                    className="mt-3 space-y-2 w-full text-left"
                                  >
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                      Found Emails:
                                    </p>
                                    {list.map((email: any, idx: number) => {
                                      const subject = email.subject || "No Subject";
                                      const sender =
                                        email.sender || email.from || "Unknown Sender";
                                      const snippet = email.snippet || "";
                                      const threadId = email.threadId || "";
                                      return (
                                        <div
                                          key={idx}
                                          className="p-3 rounded-xl border border-border/85 bg-card/45 hover:bg-card/90 transition flex flex-col gap-2 shadow-sm select-text"
                                        >
                                          <div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">
                                              Sender
                                            </span>
                                            <span className="text-xs font-bold text-foreground">
                                              {sender}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">
                                              Subject
                                            </span>
                                            <span className="text-xs font-extrabold text-foreground">
                                              {subject}
                                            </span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">
                                              Snippet
                                            </span>
                                            <span className="text-xs text-muted-foreground leading-relaxed">
                                              {snippet}
                                            </span>
                                          </div>
                                          <div className="flex justify-end pt-1">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                setInput(
                                                  `Reply to email: "${subject}" from "${sender}" (threadId: ${threadId})`
                                                );
                                              }}
                                              className="text-[9px] h-6 px-2 bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-lg flex items-center gap-1 cursor-pointer"
                                            >
                                              <span>Reply via AI</span>
                                            </Button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              }
                            }

                            return null;
                          })}
                      </>
                    )}
                  </div>
                </div>
              ))}

            {/* Thinking indicator */}
            {isLoading && <ThinkingSteps messages={messages} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div
        className={`border-t border-border bg-background/85 backdrop-blur-sm shrink-0 ${
          compact ? "p-3" : "p-4"
        }`}
      >
        {/* Selected file chips */}
        {selectedFiles.length > 0 && (
          <div className="w-full max-w-2xl mx-auto flex flex-wrap gap-1.5 mb-2 px-1 animate-in fade-in duration-200">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2 py-1 text-[10px]"
              >
                <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                <span className="max-w-[150px] truncate text-foreground">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-muted-foreground hover:text-destructive cursor-pointer ml-1 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="w-full max-w-2xl mx-auto relative flex items-center bg-card border border-border rounded-xl px-2.5 py-1 hover:border-border/80 focus-within:border-border transition-all shadow-inner"
        >
          <input
            type="text"
            placeholder={
              compact
                ? "Ask Argon assistant..."
                : "Ask AI assistant to search mail or book meetings..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground py-2 pl-3 pr-28 focus:outline-none focus:ring-0"
          />
          <div className="absolute right-2 flex items-center gap-1.5 z-10">
            {/* Attach file */}
            <label
              title="Attach files"
              className="p-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-all cursor-pointer shadow-sm flex items-center justify-center"
            >
              <Paperclip className="h-3.5 w-3.5" />
              <input type="file" multiple onChange={onFileChange} className="hidden" />
            </label>
            {/* Voice */}
            <button
              type="button"
              onClick={onToggleListening}
              title="Voice input"
              className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {isListening ? (
                <Mic className="h-3.5 w-3.5" />
              ) : (
                <MicOff className="h-3.5 w-3.5" />
              )}
            </button>
            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
              className="p-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 disabled:hover:bg-primary transition-all cursor-pointer shadow-sm animate-in fade-in"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
