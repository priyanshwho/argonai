"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { 
  Star, Bot, User, Send, Plus, Settings, LogOut, Mail, 
  Calendar, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, 
  Sparkles, Search, ArrowRight, UserCheck, Inbox, ShieldAlert, 
  ChevronRight, CalendarDays, Edit3, Clipboard, FileText, Mic, MicOff,
  Paperclip, ChevronDown, ChevronUp, Trash2, Check, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/components/providers/loading-provider";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";



// Types
interface WorkspaceClientProps {
  userId: string;
  userEmail: string;
  userName: string;
  userImage?: string | null;
  initialHasGmail: boolean;
  initialHasCalendar: boolean;
  initialConversations?: ChatConversation[];
}


interface EmailItem {
  id: string;
  gmailId: string;
  threadId: string;
  subject: string;
  sender: string;
  snippet: string;
  body?: string;
  receivedAt: string;
}

interface CalendarItem {
  id: string;
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: any; // string[] JSON
}

interface ChatConversation {
  id: string;
  title: string;
  messages: Array<{ id: string; role: "user" | "assistant" | "system"; content: string }>;
}

function getMessageText(message: any): string {
  if (typeof message.content === "string") {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  }
  return message.content || "";
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-foreground/90">{children}</p>,
        h1: ({ children }) => <h1 className="text-sm font-bold mb-2 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold mb-1.5 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold mb-1 text-foreground/90">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1 text-foreground/90">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1 text-foreground/90">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed text-foreground/90">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic text-foreground/85">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block bg-muted/40 border border-border/80 rounded-lg px-3 py-2 my-2 text-[10px] font-mono text-primary overflow-x-auto whitespace-pre">{children}</code>
          ) : (
            <code className="bg-muted border border-border/30 rounded px-1 py-0.5 text-[10px] font-mono text-primary">{children}</code>
          );
        },
        pre: ({ children }) => <pre className="my-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-border/80 pl-3 my-2 text-muted-foreground italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-2 font-medium">{children}</a>
        ),
        hr: () => <hr className="border-border/60 my-3" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}


function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

interface EmailAttachment {
  filename: string;
  content: string; // Base64 data
}

function EmailThreadAccordion({ threadId }: { threadId: string | null | undefined }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!threadId || !isOpen || messages.length > 0) return;

    const fetchThread = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/emails/thread?threadId=${threadId}`);
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to load thread history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();
  }, [threadId, isOpen]);

  if (!threadId) return null;

  return (
    <div className="border border-border/40 rounded-xl bg-muted/20 overflow-hidden my-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          <span>View Previous Conversation History</span>
        </span>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="border-t border-border/40 p-3.5 space-y-3 max-h-60 overflow-y-auto bg-card/20">
          {loading ? (
            <div className="flex items-center justify-center py-4 gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Loading thread history...</span>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No previous thread messages found.</p>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className="text-xs space-y-1 pb-2 border-b border-border/30 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                  <span className="truncate max-w-[150px]">{msg.sender}</span>
                  <span>{new Date(msg.date).toLocaleString()}</span>
                </div>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap select-text">{msg.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EmailDraftCard({
  to: initialTo,
  subject: initialSubject,
  body: initialBody,
  threadId,
  toolCallId,
  addToolResult
}: {
  to: string;
  subject: string;
  body: string;
  threadId?: string | null;
  toolCallId: string;
  addToolResult: (args: { toolCallId: string; result: any }) => void;
}) {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'draft' | 'refining' | 'sending' | 'sent' | 'error'>('draft');
  const [errorMessage, setErrorMessage] = useState('');

  const handleRefine = async (tone: string) => {
    setStatus('refining');
    try {
      const res = await fetch('/api/emails/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, tone })
      });
      const data = await res.json();
      if (data.refinedBody) {
        setBody(data.refinedBody);
        setStatus('draft');
      } else {
        throw new Error(data.error || 'Failed to refine email');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to refine email');
      setStatus('error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setAttachments(prev => [...prev, { filename: file.name, content: base64 }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setStatus('sending');
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, body, attachments })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('sent');
        addToolResult({
          toolCallId,
          result: { success: true, message: 'Email sent successfully' }
        });
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send email');
      setStatus('error');
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 my-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draft Email (Google Mail)</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'sent' && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Sent</span>}
          {status === 'sending' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Sending...</span>}
          {status === 'refining' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Refining...</span>}
        </div>
      </div>

      {threadId && <EmailThreadAccordion threadId={threadId} />}

      <div className="space-y-3">
        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-muted-foreground/60 w-16 uppercase">To:</span>
          {isEditing ? (
            <input
              type="text"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            />
          ) : (
            <span className="text-sm font-semibold text-foreground">{to}</span>
          )}
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-xs font-bold text-muted-foreground/60 w-16 uppercase">Subject:</span>
          {isEditing ? (
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            />
          ) : (
            <span className="text-sm font-bold text-foreground">{subject}</span>
          )}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-muted-foreground/60 uppercase block">Message Body:</span>
          {isEditing ? (
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={6}
              className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none"
            />
          ) : (
            <div className="p-3 bg-muted/40 border border-border/40 rounded-xl text-sm whitespace-pre-wrap text-foreground/90 max-h-60 overflow-y-auto leading-relaxed select-text">
              {body}
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-muted border border-border/80 rounded-lg px-2.5 py-1 text-xs">
                <Paperclip className="h-3 w-3 text-muted-foreground" />
                <span className="max-w-[120px] truncate text-foreground/80">{att.filename}</span>
                {status === 'draft' && (
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive cursor-pointer ml-1">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {status === 'draft' && (
        <div className="pt-2 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-muted/40 border border-border/40 rounded-xl">
            <span className="text-[10px] font-bold text-muted-foreground/60 uppercase px-2">Refine Tone:</span>
            <button onClick={() => handleRefine('professional')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">👔 Prof</button>
            <button onClick={() => handleRefine('friendly')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">😊 Friendly</button>
            <button onClick={() => handleRefine('casual')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">⚡ Casual</button>
            <button onClick={() => handleRefine('short')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">🤏 Short</button>
            <button onClick={() => handleRefine('long')} className="text-[11px] px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition cursor-pointer flex items-center gap-1">📖 Long</button>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded-lg hover:bg-muted/50 transition">
              <Paperclip className="h-3.5 w-3.5" />
              <span>Attach File</span>
              <input type="file" multiple onChange={handleFileChange} className="hidden" />
            </label>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsEditing(!isEditing)}
                variant="outline"
                className="text-xs py-1.5 h-8 border border-border rounded-xl cursor-pointer"
              >
                {isEditing ? 'Save Edit' : 'Edit Draft'}
              </Button>
              <Button
                onClick={handleSend}
                className="text-xs py-1.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer flex items-center gap-1.5 font-bold shadow-md"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Email</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarDraftCard({
  title: initialTitle,
  startTime: initialStartTime,
  endTime: initialEndTime,
  attendees: initialAttendees,
  toolCallId,
  addToolResult
}: {
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  toolCallId: string;
  addToolResult: (args: { toolCallId: string; result: any }) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [attendees, setAttendees] = useState<string[]>(initialAttendees || []);
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<'checking' | 'ready' | 'creating' | 'created' | 'conflict' | 'error'>('checking');
  const [currentStep, setCurrentStep] = useState(0); 
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [refiningAlternative, setRefiningAlternative] = useState(false);

  const steps = [
    { text: "Parsing date and time range...", icon: Search },
    { text: "Checking calendar availability...", icon: Calendar },
    { text: "Analyzing conflicts...", icon: ShieldAlert }
  ];

  const runConflictValidation = async (start: string, end: string) => {
    setStatus('checking');
    setCurrentStep(0);
    
    for (let step = 0; step < 3; step++) {
      setCurrentStep(step);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    setCurrentStep(3);

    try {
      const res = await fetch('/api/events/check-conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: start, endTime: end })
      });
      const data = await res.json();
      if (data.hasConflict) {
        setConflicts(data.conflicts);
        setStatus('conflict');
      } else {
        setConflicts([]);
        setStatus('ready');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Conflict check failed');
      setStatus('error');
    }
  };

  useEffect(() => {
    runConflictValidation(startTime, endTime);
  }, []);

  const handleSuggestAlternative = async () => {
    setRefiningAlternative(true);
    try {
      const res = await fetch('/api/events/alternative-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime, endTime })
      });
      const data = await res.json();
      if (data.alternativeSlot) {
        setStartTime(data.alternativeSlot.startTime);
        setEndTime(data.alternativeSlot.endTime);
        setRefiningAlternative(false);
        runConflictValidation(data.alternativeSlot.startTime, data.alternativeSlot.endTime);
      } else {
        throw new Error(data.error || 'No alternative slots found');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to find alternative slot');
      setStatus('error');
      setRefiningAlternative(false);
    }
  };

  const handleCreate = async () => {
    setStatus('creating');
    try {
      const res = await fetch('/api/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, startTime, endTime, attendees })
      });
      const data = await res.json();
      if (data.success) {
        setStatus('created');
        addToolResult({
          toolCallId,
          result: { success: true, message: 'Event scheduled successfully' }
        });
      } else {
        throw new Error(data.error || 'Failed to schedule event');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to schedule event');
      setStatus('error');
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur-md space-y-4 shadow-lg w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 my-3 select-text">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draft Calendar Event (Google Calendar)</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'created' && <span className="text-xs font-semibold text-emerald-500 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Scheduled</span>}
          {status === 'creating' && <span className="text-xs text-muted-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Scheduling...</span>}
        </div>
      </div>

      {status === 'checking' && (
        <div className="p-6 border border-border/40 bg-muted/20 rounded-xl space-y-4">
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isPending = idx > currentStep;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={idx} className="flex items-center gap-3 transition-opacity duration-300">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border text-xs font-bold transition-all ${
                    isCompleted ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                    isActive ? "bg-primary/10 border-primary/30 text-primary animate-pulse" :
                    "bg-muted border-border text-muted-foreground/60"
                  }`}>
                    {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                  </div>
                  <span className={`text-xs ${
                    isCompleted ? "text-foreground/70 line-through decoration-muted-foreground/30" :
                    isActive ? "text-foreground font-semibold" :
                    "text-muted-foreground/60"
                  }`}>{step.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {status !== 'checking' && (
        <div className="space-y-3">
          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">Title:</span>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
            ) : (
              <span className="text-sm font-semibold text-foreground">{title}</span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">Start:</span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={startTime.slice(0, 16)}
                onChange={e => setStartTime(new Date(e.target.value).toISOString())}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
            ) : (
              <span className="text-sm text-foreground">{new Date(startTime).toLocaleString()}</span>
            )}
          </div>

          <div className="flex gap-2 items-center">
            <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase">End:</span>
            {isEditing ? (
              <input
                type="datetime-local"
                value={endTime.slice(0, 16)}
                onChange={e => setEndTime(new Date(e.target.value).toISOString())}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
              />
            ) : (
              <span className="text-sm text-foreground">{new Date(endTime).toLocaleString()}</span>
            )}
          </div>

          {attendees && attendees.length > 0 && (
            <div className="flex gap-2 items-start">
              <span className="text-xs font-bold text-muted-foreground/60 w-20 uppercase mt-0.5">Attendees:</span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {attendees.map((email, idx) => (
                  <span key={idx} className="bg-muted border border-border/80 rounded-lg px-2 py-0.5 text-xs text-foreground/80">{email}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {status === 'conflict' && (
        <div className="p-4 border border-destructive/20 bg-destructive/10 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="flex gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold">⚠️ Calendar Conflict Detected</p>
              <p className="text-xs text-destructive/80">The proposed slot overlaps with these events in your schedule:</p>
            </div>
          </div>
          <div className="space-y-1.5 pl-6">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="text-xs text-foreground/80 leading-relaxed border-l-2 border-destructive/50 pl-2">
                <strong>{conf.title}</strong>
                <span className="text-muted-foreground text-[10px] block">
                  {new Date(conf.startTime).toLocaleTimeString()} - {new Date(conf.endTime).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer"
            >
              Edit proposed time manually
            </button>
            <Button
              onClick={handleSuggestAlternative}
              disabled={refiningAlternative}
              className="text-xs py-1.5 h-8 border border-border bg-background hover:bg-muted text-foreground rounded-xl flex items-center gap-1 cursor-pointer"
            >
              {refiningAlternative ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
              <span>Find Alternative Slot</span>
            </Button>
          </div>
        </div>
      )}

      {status === 'ready' && (
        <div className="p-3 border border-emerald-500/20 bg-emerald-500/10 rounded-xl flex items-center gap-2 text-emerald-500 text-xs font-bold animate-in slide-in-from-top-2 duration-300">
          <Check className="h-4 w-4 shrink-0" />
          <span>✓ Time Slot is Available! No conflicts found.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-3 bg-destructive/15 border border-destructive/20 rounded-xl text-xs text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {(status === 'ready' || isEditing || status === 'conflict') && (
        <div className="pt-2 flex items-center justify-end gap-2">
          <Button
            onClick={() => {
              if (isEditing) {
                setIsEditing(false);
                runConflictValidation(startTime, endTime);
              } else {
                setIsEditing(true);
              }
            }}
            variant="outline"
            className="text-xs py-1.5 h-8 border border-border rounded-xl cursor-pointer"
          >
            {isEditing ? 'Save & Recheck' : 'Edit Event'}
          </Button>
          {!isEditing && status !== 'conflict' && status !== 'created' && (
            <Button
              onClick={handleCreate}
              className="text-xs py-1.5 h-8 bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl cursor-pointer flex items-center gap-1 font-bold shadow-md"
            >
              <span>Confirm & Schedule</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkspaceClient({
  userId,
  userEmail,
  userName,
  userImage,
  initialHasGmail,
  initialHasCalendar,
  initialConversations = [],
}: WorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Tab navigation: "chat" | "inbox" | "calendar" | "configuration"
  const [activeTab, setActiveTab] = useState<"chat" | "inbox" | "calendar" | "configuration">("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openCommandPalette, setOpenCommandPalette] = useState(false);

  // Load active tab from URL query param if present
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "configuration") {
      router.push("/settings");
    } else if (tabParam === "inbox") {
      setActiveTab("inbox");
    } else if (tabParam === "calendar") {
      setActiveTab("calendar");
    }
  }, [searchParams, router]);

  // Keydown listener for Command Palette (⌘K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommandPalette((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);


  // Toast / Notification status from OAuth callbacks
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success) {
      setNotification({
        type: "success",
        message: `Successfully connected ${success === "gmail" ? "Gmail" : "Google Calendar"} integration!`,
      });
      // Clean up URL query parameters
      router.replace("/dashboard?tab=configuration");
    } else if (error) {
      setNotification({
        type: "error",
        message: `Failed to link account: ${error}. Please try again.`,
      });
      router.replace("/dashboard?tab=configuration");
    }
  }, [searchParams, router]);

  // Cache data states
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Selected email details states
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState<string>("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState("");

  // Event creation form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventGuests, setEventGuests] = useState("");
  const [eventCreating, setEventCreating] = useState(false);
  const [eventStatus, setEventStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ emails: EmailItem[]; events: CalendarItem[] } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Chat conversation threads management
  const [conversations, setConversations] = useState<ChatConversation[]>(
    initialConversations.length > 0
      ? initialConversations
      : [{ id: "default-chat", title: "New Conversation", messages: [] }]
  );
  const [activeChatId, setActiveChatId] = useState<string>(
    initialConversations.length > 0 ? initialConversations[0].id : "default-chat"
  );
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
          setIsListening(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result: any) => result.transcript)
            .join("");
          setInput(transcript);
        };
        
        recognition.onerror = (event: any) => {
          if (event.error !== "no-speech") {
            console.error("Speech recognition error", event.error);
          }
          setIsListening(false);
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.start();
      } else {
        alert("Speech Recognition is not supported in this browser.");
      }
    }
  };

  // Vercel AI SDK chat hook using Gemini 3.1 Flash-Lite
  const { messages, sendMessage, setMessages, status } = useChat({
    onFinish: ({ message }) => {
      setConversations((prev) => 
        prev.map((c) => {
          if (c.id === activeChatId) {
            const allMessages = [...messages as any, { id: message.id, role: "assistant" as const, content: getMessageText(message) }];
            // Update title on first assistant response
            let title = c.title;
            if (c.title.startsWith("New Conversation") || c.title.startsWith("Conversation ")) {
              const firstUserMsg = allMessages.find(m => m.role === "user");
              if (firstUserMsg) {
                title = getMessageText(firstUserMsg).slice(0, 30) || c.title;
              }
            }
            return {
              ...c,
              title,
              messages: allMessages,
            };
          }
          return c;
        })
      );
    }
  });

  // Sync initial conversation messages into useChat hook on mount
  useEffect(() => {
    const activeConv = conversations.find(c => c.id === activeChatId);
    if (activeConv && activeConv.messages.length > 0) {
      setMessages(activeConv.messages as any);
    }
  }, []);

  const isLoading = status === "submitted" || status === "streaming";

  // Fetch emails cache
  const fetchEmails = async () => {
    setEmailsLoading(true);
    try {
      const res = await fetch("/api/emails");
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setEmailsLoading(false);
    }
  };

  // Fetch events cache
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "inbox") {
      fetchEmails();
    } else if (activeTab === "calendar") {
      fetchEvents();
    }
  }, [activeTab]);

  // Unified search debouncer
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearchLoading(true);
      setShowSearchResults(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Summarize selected email via AI API
  const handleSummarizeEmail = async (gmailId: string) => {
    setAiSummaryLoading(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/emails/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailId }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSummary(data.summary);
      } else {
        setAiSummary("Failed to generate summary. Verify integration credentials.");
      }
    } catch (err) {
      setAiSummary("Error calling AI summarizing system.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  // Draft reply for email via AI API
  const handleDraftReply = async (gmailId: string) => {
    setAiDraftLoading(true);
    setAiDraft("");
    try {
      const res = await fetch("/api/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailId, instructions: draftInstructions }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiDraft(data.draft);
      } else {
        setAiDraft("Failed to generate response draft content.");
      }
    } catch (err) {
      setAiDraft("Error calling AI draft editor.");
    } finally {
      setAiDraftLoading(false);
    }
  };

  // Schedule meeting via direct Corsair scheduler API
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart || !eventEnd) {
      setEventStatus({ type: "error", message: "Please fill out all required fields." });
      return;
    }

    setEventCreating(true);
    setEventStatus(null);

    try {
      const guestsArr = eventGuests
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: eventTitle,
          startTime: eventStart,
          endTime: eventEnd,
          attendees: guestsArr,
        }),
      });

      if (res.ok) {
        setEventStatus({ type: "success", message: "Calendar event booked successfully!" });
        setEventTitle("");
        setEventStart("");
        setEventEnd("");
        setEventGuests("");
        fetchEvents();
      } else {
        const data = await res.json();
        setEventStatus({ type: "error", message: data.error || "Failed to create event." });
      }
    } catch (err) {
      setEventStatus({ type: "error", message: "Error scheduling event." });
    } finally {
      setEventCreating(false);
    }
  };

  // Switch conversation thread
  const selectConversation = (chatId: string) => {
    setActiveTab("chat");
    setShowSearchResults(false);
    setActiveChatId(chatId);
    const selected = conversations.find((c) => c.id === chatId);
    if (selected) {
      setMessages(selected.messages as any);
    }
  };

  // Create new conversation thread
  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatConversation = {
      id: newId,
      title: `Conversation ${conversations.length + 1}`,
      messages: [],
    };
    setConversations((prev) => [newChat, ...prev]);
    setActiveChatId(newId);
    setActiveTab("chat");
    setShowSearchResults(false);
    setMessages([]);
  };

  // Handle message submission
  const handleChatSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, content: input };
    const updatedMessages = [...messages, userMsg];
    
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeChatId 
          ? { ...c, messages: updatedMessages as any } 
          : c
      )
    );
    
    sendMessage({ text: input }, { body: { conversationId: activeChatId } });
    setInput("");
  };

  const submitMessageDirectly = (promptText: string) => {
    if (isLoading) return;
    setActiveTab("chat");
    setShowSearchResults(false);
    
    const userMsg = { id: `user-${Date.now()}`, role: "user" as const, content: promptText };
    const updatedMessages = [...messages, userMsg];
    
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeChatId 
          ? { ...c, messages: updatedMessages as any } 
          : c
      )
    );
    
    sendMessage({ text: promptText }, { body: { conversationId: activeChatId } });
  };


  // Copy helpers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* 1. LEFT COLUMN: Sidebar Navigation Layout */}
      <aside className={`bg-card border-r border-border flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        
        {/* Top Logo and New Chat */}
        <div className="p-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2 overflow-hidden select-none">
              {sidebarCollapsed ? (
                <Link href="/" className="flex items-center shrink-0 justify-center w-12 h-12 overflow-hidden rounded-lg -mt-2">
                  <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-11 max-w-none w-auto object-contain" />
                  <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-11 max-w-none w-auto object-contain" />
                </Link>
              ) : (
                <Link href="/" className="flex items-center shrink-0 -mt-2">
                  <img src="/BL-ARGON.png" alt="ARGON AI" className="dark:hidden h-16 w-auto object-contain" />
                  <img src="/WL-ARGON.png" alt="ARGON AI" className="hidden dark:block h-16 w-auto object-contain" />
                </Link>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors shrink-0"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronRight className={`h-4.5 w-4.5 transform transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>

          <Button 
            onClick={createNewChat}
            variant="outline" 
            className={`justify-start gap-2 border-border bg-background text-foreground hover:bg-muted hover:text-foreground transition-all ${
              sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3"
            }`}
            title={sidebarCollapsed ? "New Chat" : undefined}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>New Chat</span>}
          </Button>

          {/* Core navigation tabs */}
          <nav className="space-y-1">
            {[
              { id: "chat", label: "AI Assistant", icon: Bot },
              { id: "inbox", label: "Inbox Workspace", icon: Inbox },
              { id: "calendar", label: "Calendar Board", icon: CalendarDays },
              { id: "configuration", label: "Configuration", icon: Settings, action: () => router.push("/settings") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.action) {
                    tab.action();
                  } else {
                    setActiveTab(tab.id as any);
                    setShowSearchResults(false);
                  }
                }}
                title={tab.label}
                className={`flex items-center rounded-lg text-sm transition-all text-left ${
                  activeTab === tab.id && !showSearchResults && !tab.action
                    ? "bg-accent text-accent-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${
                  sidebarCollapsed ? "w-10 h-10 p-0 justify-center mx-auto" : "w-full px-3 py-2 gap-2.5"
                }`}
              >
                <tab.icon className="h-4.5 w-4.5 shrink-0 opacity-85" />
                {!sidebarCollapsed && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>

          {/* Conversations Log */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-y-auto space-y-1.5 pt-3 pr-1 transition-opacity duration-300">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 pb-1.5">
                Recent Conversations
              </div>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-all text-left truncate ${
                    activeTab === "chat" && activeChatId === c.id && !showSearchResults
                      ? "bg-accent text-accent-foreground font-medium"
                      : "text-muted-foreground/90 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Card and Sign Out */}
        <div className="p-4 border-t border-border">
          <div className={`flex items-center justify-between p-2 rounded-xl bg-background/40 border border-border/50 transition-all ${
            sidebarCollapsed ? "flex-col gap-2 p-1" : ""
          }`}>
            <div className={`flex items-center gap-2.5 overflow-hidden ${
              sidebarCollapsed ? "flex-col justify-center" : ""
            }`}>
              {userImage ? (
                <img src={userImage} alt={userName} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="flex flex-col truncate transition-opacity duration-300">
                  <span className="text-xs font-semibold text-foreground truncate">{userName}</span>
                  <span className="text-[10px] text-muted-foreground truncate">{userEmail}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <AnimatedThemeToggler className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors" />
              <button 
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MIDDLE COLUMN: Main dynamic dashboard views */}
      <section className="flex-1 flex flex-col bg-background border-r border-border/60 overflow-hidden relative">
        
        {/* Top Header with Unified Search Input */}
        <header className="h-14 border-b border-border/60 flex items-center justify-between px-6 shrink-0 bg-background/60 backdrop-blur-sm z-10 gap-4">
          <div className="text-sm font-semibold text-foreground/90 shrink-0">
            {showSearchResults ? "Search Results" : activeTab === "chat" ? "AI Assistant" : activeTab === "inbox" ? "Emails Inbox" : "Calendar Events"}
          </div>

          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
              <input
                type="text"
                placeholder="Search emails or events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs placeholder-muted-foreground text-foreground focus:outline-none focus:border-border/80 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenCommandPalette(true)}
              className="h-8 border-border/80 bg-card text-muted-foreground hover:bg-muted hover:text-foreground text-xs px-2 gap-1 cursor-pointer"
              title="Open Command Palette (⌘K)"
            >
              <span className="font-mono text-[10px]">⌘K</span>
            </Button>
          </div>
        </header>

        {/* Dynamic content viewport */}
        <div className="flex-1 overflow-y-auto relative">
          
          {/* SEARCH MATCHES OVERLAY */}
          {showSearchResults && (
            <div className="p-6 space-y-6">
              <h2 className="text-lg font-bold font-serif text-foreground">Search matches found in cache</h2>
              
              {searchLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-12">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Parsing search criteria...</span>
                </div>
              ) : !searchResults || (searchResults.emails.length === 0 && searchResults.events.length === 0) ? (
                <div className="text-center py-12 space-y-2">
                  <ShieldAlert className="h-9 w-9 text-muted-foreground/70 mx-auto" />
                  <p className="text-xs text-muted-foreground font-medium">No matching emails or meetings registered in cache database.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email matches */}
                  {searchResults.emails.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Emails</h3>
                      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-muted/15">
                        {searchResults.emails.map((email) => (
                          <button
                            key={email.id}
                            onClick={() => {
                              setSelectedEmail(email);
                              setActiveTab("inbox");
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-bold text-foreground/90">{email.sender}</span>
                              <span className="text-xs text-muted-foreground/60">{new Date(email.receivedAt).toLocaleDateString()}</span>
                            </div>
                            <span className="text-sm text-foreground font-semibold line-clamp-1">{email.subject}</span>
                            <span className="text-xs text-muted-foreground/85 line-clamp-1">{email.snippet}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar matches */}
                  {searchResults.events.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Meetings</h3>
                      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-muted/15">
                        {searchResults.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setActiveTab("calendar");
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-sm font-bold text-foreground/90">{event.title}</span>
                              <span className="text-xs text-muted-foreground/60">{new Date(event.startTime).toLocaleDateString()}</span>
                            </div>
                            <span className="text-xs text-muted-foreground/80">
                              Time: {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* A. AI ASSISTANT VIEWPORT */}
          {activeTab === "chat" && !showSearchResults && (
            <div className="h-full flex flex-col justify-between">
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-8 py-10">
                    <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground shadow-lg relative group transition-all duration-300 hover:border-border/80">
                      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Sparkles className="h-7 w-7 text-foreground/90" />
                    </div>
                    
                    <div className="space-y-2">
                      <h2 className="text-3xl font-extrabold font-serif text-foreground tracking-tight leading-tight">
                        Workspace AI Assistant
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Query your cached correspondence, draft response text, check calendar conflicts, or trigger direct event creation via command parameters.
                      </p>
                    </div>

                    <div className="grid gap-3 w-full pt-4">
                      {[
                        "Summarize my recent Gmail messages",
                        "Do I have any calendar conflicts tomorrow?",
                        "Schedule a 30m slot with team next Monday",
                      ].map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(promptText)}
                          className="group p-4 flex items-center justify-between text-left rounded-xl border border-border/80 bg-card/35 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-all duration-200 font-semibold shadow-sm cursor-pointer"
                        >
                          <span>{promptText}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground/80 group-hover:text-foreground group-hover:translate-x-1 transition-all duration-200" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {messages
                      .filter(m => getMessageText(m).trim() !== "" || m.role === "user")
                      .map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-3.5 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm ${
                          m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-foreground/90"
                        }`}>
                          {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-muted-foreground/80" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-3.5 max-w-[85%] text-sm leading-relaxed ${
                          m.role === "user" ? "bg-primary/90 text-primary-foreground font-medium animate-in fade-in slide-in-from-bottom-2 duration-300" : "bg-card border border-border/50 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
                        }`}>
                          {m.role === "user" ? (
                            <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
                          ) : (
                            <MarkdownMessage content={getMessageText(m)} />
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      (() => {
                        const visibleMessages = messages.filter(m => getMessageText(m).trim() !== "" || m.role === "user");
                        const lastVisible = visibleMessages[visibleMessages.length - 1];
                        return !lastVisible || lastVisible.role !== "assistant";
                      })()
                    ) && (
                      <div className="flex gap-3.5 items-start">
                        <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold bg-secondary border border-border text-foreground/90">
                          <Bot className="h-3.5 w-3.5 text-muted-foreground/80" />
                        </div>
                        <div className="rounded-2xl px-4 py-2 bg-card border border-border/50 text-muted-foreground text-[11px] flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground/60" />
                          <span>Argon is On it...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <div className="p-4 border-t border-border bg-background/80 backdrop-blur-sm shrink-0">
                <form 
                  onSubmit={handleChatSubmit}
                  className="max-w-2xl mx-auto relative flex items-center bg-card border border-border rounded-xl px-3.5 py-1.5 hover:border-border/80 focus-within:border-border transition-all shadow-inner"
                >
                  <input 
                    type="text" 
                    placeholder="Ask AI assistant to search mail or book meetings..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground py-2.5 pl-4 pr-24 focus:outline-none focus:ring-0"
                  />
                  <div className="absolute right-3 flex items-center gap-2 z-10">
                    <button
                      type="button"
                      onClick={toggleListening}
                      title="Voice input"
                      className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {isListening ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="p-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-30 disabled:hover:bg-primary transition-all cursor-pointer shadow-sm animate-in fade-in"
                    >
                      <Send className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "inbox" && !showSearchResults && (
            <div className="p-4 space-y-3">
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
                  <p className="text-xs text-muted-foreground">Connect Gmail to sync your inbox cache.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {emails.map((email) => {
                    const initials = email.sender.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();
                    const colors = ["bg-red-500","bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500","bg-pink-500"];
                    const color = colors[email.sender.charCodeAt(0) % colors.length];
                    return (
                      <button
                        key={email.id}
                        onClick={() => {
                          setSelectedEmail(email);
                          setAiSummary("");
                          setAiDraft("");
                        }}
                        className={`w-full p-3.5 flex items-start gap-3 text-left rounded-xl border transition-all ${
                          selectedEmail?.id === email.id 
                            ? "bg-accent border-primary/30 shadow-sm" 
                            : "bg-card/60 border-border/60 hover:bg-muted/60 hover:border-border"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-full ${color} flex items-center justify-center text-[11px] font-bold text-white shrink-0 shadow-sm`}>
                          {initials || "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className="text-xs font-bold text-foreground truncate">{email.sender}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {new Date(email.receivedAt).toLocaleDateString([], { month:'short', day:'numeric' })}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-foreground/80 block truncate">{email.subject}</span>
                          <span className="text-[11px] text-muted-foreground/70 line-clamp-1 leading-relaxed">{email.snippet}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* C. CALENDAR BOARD VIEWPORT */}
          {activeTab === "calendar" && !showSearchResults && (
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold font-serif text-foreground">Upcoming Events</h2>
                <p className="text-xs text-muted-foreground/60">Track date conflicts and guest responses linked under calendar.</p>
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-24">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-24 space-y-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto">
                    <CalendarDays className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-semibold text-foreground/60">No events found</p>
                  <p className="text-xs text-muted-foreground">Connect Google Calendar to see your upcoming events.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {events.map((event) => {
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);
                    const guests = Array.isArray(event.attendees) ? event.attendees : [];
                    const isToday = start.toDateString() === new Date().toDateString();
                    return (
                      <div key={event.id} className="p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors flex gap-4 items-start animate-in fade-in group">
                        <div className={`shrink-0 flex flex-col items-center justify-center rounded-xl w-12 h-12 text-center border shadow-sm ${
                          isToday ? "bg-primary border-primary/30 text-primary-foreground" : "bg-muted/60 border-border text-foreground"
                        }`}>
                          <span className="text-[10px] font-bold uppercase opacity-70">{start.toLocaleDateString([],{month:'short'})}</span>
                          <span className="text-lg font-extrabold leading-none">{start.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <h4 className="text-sm font-bold text-foreground leading-tight truncate">{event.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {guests.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <UserCheck className="h-3 w-3 text-muted-foreground/60" />
                              <span className="text-[10px] text-muted-foreground/60 truncate">{guests.join(", ")}</span>
                            </div>
                          )}
                        </div>
                        <div className={`text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 border ${
                          isToday ? "bg-primary/10 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border/40"
                        }`}>
                          {isToday ? "Today" : "Upcoming"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* D. CONFIGURATION SETTINGS VIEWPORT */}
          {activeTab === "configuration" && !showSearchResults && (
            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full animate-in fade-in">
              
              <div className="space-y-1">
                <h1 className="text-xl font-bold font-serif text-foreground">Integrations Settings</h1>
                <p className="text-xs text-muted-foreground">
                  Manage external API credentials and link your personal workspace tools.
                </p>
              </div>

              {notification && (
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${
                  notification.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}>
                  {notification.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
                  )}
                  <div className="text-sm leading-relaxed">{notification.message}</div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                
                {/* Gmail connection card */}
                <Card className="bg-card border-border/80 text-card-foreground shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold">Gmail Inbox</CardTitle>
                      <CardDescription className="text-muted-foreground text-[10px]">Read, draft, and query mailboxes</CardDescription>
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[40px] flex items-center">
                      Authorizes ArgonAI's sync agent to read, organize, and build index caches for your Gmail correspondence.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      {initialHasGmail ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Connected</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted" disabled>
                            Configure
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                          <a href="/api/integrations/gmail/connect">
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold">
                              Connect Gmail
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Google Calendar connection card */}
                <Card className="bg-card border-border/80 text-card-foreground shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold">Google Calendar</CardTitle>
                      <CardDescription className="text-muted-foreground text-[10px]">Manage events and schedules</CardDescription>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed min-h-[40px] flex items-center">
                      Allows scheduling meetings, checking conflict parameters, and posting calendar updates via prompt.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      {initialHasCalendar ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Connected</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs hover:bg-muted" disabled>
                            Configure
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-muted-foreground font-medium">Not linked</div>
                          <a href="/api/integrations/googlecalendar/connect">
                            <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/95 font-semibold">
                              Connect Calendar
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-xl border border-border bg-card/10 p-4 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 animate-pulse" />
                <div className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Multi-Tenancy note:</strong> Linking these services automatically binds them under your unique Tenant ID: <code className="text-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono">{userId}</code>. Your personal emails and events will never be shared with other users.
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 3. RIGHT COLUMN: Context panels */}
      {activeTab !== "chat" && (
        <section className={`${activeTab === "inbox" ? "w-[400px]" : "w-80"} bg-card/40 flex flex-col overflow-y-auto shrink-0 p-5 space-y-6 border-l border-border/60`}>
          
          {/* B. CONTEXT: INBOX TAB */}
          {activeTab === "inbox" && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Email Details</h3>
              
              {!selectedEmail ? (
                <div className="text-center py-16 space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground/60 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">Select an email from the inbox list to read details.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Details layout - premium card */}
                  <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4 shadow-xl select-text">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Sender</span>
                      <p className="text-sm font-bold text-foreground break-words leading-snug">{selectedEmail.sender}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Subject</span>
                      <p className="text-base font-extrabold text-foreground leading-snug break-words">{selectedEmail.subject}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Received</span>
                      <p className="text-sm text-muted-foreground font-medium">{new Date(selectedEmail.receivedAt).toLocaleString()}</p>
                    </div>
                    <div className="pt-4 border-t border-border/60">
                      <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block mb-2">{selectedEmail.body ? "Message Content" : "Snippet"}</span>
                      <div className="text-sm text-foreground/90 leading-relaxed break-words select-text whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-1">
                        {selectedEmail.body || selectedEmail.snippet}
                      </div>
                    </div>
                  </div>

                  {/* AI Actions */}
                  <div className="space-y-5">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Assistant Actions</h4>
                    
                    {/* Summary action */}
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleSummarizeEmail(selectedEmail.gmailId)}
                        disabled={aiSummaryLoading}
                        className="w-full bg-secondary hover:bg-muted text-secondary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 border border-border rounded-xl cursor-pointer"
                      >
                        {aiSummaryLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary animate-pulse" />}
                        <span>Generate Bullet Summary</span>
                      </Button>

                      {aiSummary && (
                        <div className="p-4 rounded-2xl border border-border bg-card/35 text-sm text-foreground/90 leading-relaxed relative whitespace-pre-wrap select-text shadow-inner">
                          <button 
                            onClick={() => copyToClipboard(aiSummary)}
                            className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                            title="Copy Summary"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                          <strong className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block pb-2">AI Summary</strong>
                          {aiSummary}
                        </div>
                      )}
                    </div>

                    {/* AI drafting replies */}
                    <div className="space-y-3.5 pt-4 border-t border-border">
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-muted-foreground block">Drafting instructions (optional)</span>
                        <input 
                          type="text" 
                          placeholder="e.g., politely decline, ask to reschedule..." 
                          value={draftInstructions}
                          onChange={(e) => setDraftInstructions(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl p-3 h-10 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80 focus:ring-1 focus:ring-ring"
                        />
                      </div>

                      <Button 
                        onClick={() => handleDraftReply(selectedEmail.gmailId)}
                        disabled={aiDraftLoading}
                        className="w-full bg-secondary hover:bg-muted text-secondary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 border border-border rounded-xl cursor-pointer"
                      >
                        {aiDraftLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4 text-foreground/80" />}
                        <span>Generate Response Draft</span>
                      </Button>

                      {aiDraft && (
                        <div className="p-4 rounded-2xl border border-border bg-card/35 text-sm text-foreground/90 leading-relaxed relative whitespace-pre-wrap select-text shadow-inner">
                          <button 
                            onClick={() => copyToClipboard(aiDraft)}
                            className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted transition-colors cursor-pointer"
                            title="Copy Draft"
                          >
                            <Clipboard className="h-4 w-4" />
                          </button>
                          <strong className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider block pb-2">Reply Draft</strong>
                          {aiDraft}
                        </div>
                      )}
                    </div>

                  </div>

                </div>
              )}
            </div>
        )}

        {/* C. CONTEXT: CALENDAR TAB */}
        {activeTab === "calendar" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Visual Scheduler</h3>
              <p className="text-[11px] text-muted-foreground/60">Create new Google calendar events dynamically.</p>
            </div>

            {/* Event Form creation */}
            <form onSubmit={handleCreateEvent} className="p-4 rounded-xl border border-border bg-card/25 space-y-4 text-xs">
              <h4 className="text-xs font-bold text-foreground font-serif">Schedule Meeting</h4>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/85 font-bold uppercase block">Meeting Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sync with HR, Review roadmap..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/85 font-bold uppercase block">Start Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-border/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/85 font-bold uppercase block">End Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-border/80"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground/85 font-bold uppercase block">Guests (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. john@domain.com, team@locus.co"
                  value={eventGuests}
                  onChange={(e) => setEventGuests(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-border/80"
                />
              </div>

              {eventStatus && (
                <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  eventStatus.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                    : "bg-destructive/10 border-destructive/20 text-destructive"
                }`}>
                  {eventStatus.message}
                </div>
              )}

              <Button 
                type="submit"
                disabled={eventCreating}
                size="xs"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs py-1.5 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer animate-in fade-in"
              >
                {eventCreating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3.5 w-3.5 text-primary-foreground" />
                    <span>Post Event</span>
                  </>
                )}
              </Button>
            </form>
          </div>
          )}

        </section>
      )}

      <CommandDialog open={openCommandPalette} onOpenChange={setOpenCommandPalette}>
        <Command>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => { setActiveTab("chat"); setOpenCommandPalette(false); }}>
              <Bot className="mr-2 h-4 w-4" />
              <span>Go to AI Assistant</span>
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setActiveTab("inbox"); setOpenCommandPalette(false); }}>
              <Inbox className="mr-2 h-4 w-4" />
              <span>Go to Emails Inbox</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setActiveTab("calendar"); setOpenCommandPalette(false); }}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>Go to Calendar Board</span>
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { router.push("/settings"); setOpenCommandPalette(false); }}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Go to Settings Panel</span>
              <CommandShortcut>⌘4</CommandShortcut>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Scheduling Templates">
            <CommandItem onSelect={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(10, 0, 0, 0);
              const tomorrowEnd = new Date(tomorrow);
              tomorrowEnd.setHours(10, 30, 0, 0);

              setEventTitle("Daily Standup");
              setEventStart(formatDateTimeLocal(tomorrow));
              setEventEnd(formatDateTimeLocal(tomorrowEnd));
              setEventGuests("");
              setActiveTab("calendar");
              setOpenCommandPalette(false);
            }}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Daily Standup (Tomorrow 10:00 AM)</span>
            </CommandItem>
            
            <CommandItem onSelect={() => {
              const today = new Date();
              today.setHours(16, 0, 0, 0);
              const todayEnd = new Date(today);
              todayEnd.setHours(16, 30, 0, 0);

              setEventTitle("Coffee Chat");
              setEventStart(formatDateTimeLocal(today));
              setEventEnd(formatDateTimeLocal(todayEnd));
              setEventGuests("");
              setActiveTab("calendar");
              setOpenCommandPalette(false);
            }}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Coffee Chat (Today 4:00 PM)</span>
            </CommandItem>

            <CommandItem onSelect={() => {
              const nextMonday = new Date();
              nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
              nextMonday.setHours(14, 0, 0, 0);
              const nextMondayEnd = new Date(nextMonday);
              nextMondayEnd.setHours(15, 0, 0, 0);

              setEventTitle("Weekly Planning Sync");
              setEventStart(formatDateTimeLocal(nextMonday));
              setEventEnd(formatDateTimeLocal(nextMondayEnd));
              setEventGuests("");
              setActiveTab("calendar");
              setOpenCommandPalette(false);
            }}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Template: Weekly Planning Sync (Next Mon 2:00 PM)</span>
            </CommandItem>
          </CommandGroup>

          <CommandGroup heading="Ask AI Quick Actions">
            <CommandItem onSelect={() => {
              setOpenCommandPalette(false);
              submitMessageDirectly("Summarize my recent Gmail messages");
            }}>
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Ask AI: Summarize inbox messages</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              setOpenCommandPalette(false);
              submitMessageDirectly("Do I have any calendar conflicts tomorrow?");
            }}>
              <Sparkles className="mr-2 h-4 w-4 text-yellow-500" />
              <span>Ask AI: Check tomorrow's schedule conflicts</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>

    </div>
  );
}
