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

// Modularized imports
import { 
  WorkspaceClientProps, 
  EmailItem, 
  CalendarItem, 
  ChatConversation, 
  EmailAttachment 
} from "./components/types";
import { getMessageText, formatDateTimeLocal } from "./components/utils";
import { MarkdownMessage } from "./components/MarkdownMessage";
import { EmailDraftCard } from "./components/EmailDraftCard";
import { CalendarDraftCard } from "./components/CalendarDraftCard";

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
  const [sendingInboxReply, setSendingInboxReply] = useState(false);
  const [inboxReplyStatus, setInboxReplyStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [draftInstructions, setDraftInstructions] = useState("");

  // Event creation form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventGuests, setEventGuests] = useState("");
  const [eventCreating, setEventCreating] = useState(false);
  const [eventStatus, setEventStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [calendarRightPanelMode, setCalendarRightPanelMode] = useState<"assistant" | "manual">("assistant");

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFilesWithDataUrls = async (files: File[]) => {
    return Promise.all(files.map(file => {
      return new Promise<{ filename: string; mediaType: string; url: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            filename: file.name,
            mediaType: file.type,
            url: reader.result as string
          });
        };
        reader.readAsDataURL(file);
      });
    }));
  };

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
  const { messages, sendMessage, setMessages, status, addToolResult } = useChat({
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

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  const handleSendInboxReply = async () => {
    if (!selectedEmail || !aiDraft) return;
    setSendingInboxReply(true);
    setInboxReplyStatus(null);
    try {
      const subject = selectedEmail.subject.toLowerCase().startsWith('re:') 
        ? selectedEmail.subject 
        : `Re: ${selectedEmail.subject}`;
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedEmail.sender,
          subject,
          body: aiDraft,
          threadId: selectedEmail.threadId
        })
      });
      const data = await res.json();
      if (data.success) {
        setInboxReplyStatus({ type: 'success', message: 'Reply sent successfully!' });
        setAiDraft('');
        setDraftInstructions('');
      } else {
        throw new Error(data.error || 'Failed to send reply');
      }
    } catch (err: any) {
      setInboxReplyStatus({ type: 'error', message: err.message || 'Failed to send reply' });
    } finally {
      setSendingInboxReply(false);
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
  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    const fileParts = selectedFiles.length > 0 ? await getFilesWithDataUrls(selectedFiles) : [];
    const textPart = input.trim() ? [{ type: "text" as const, text: input }] : [];
    
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: input,
      parts: [
        ...textPart,
        ...fileParts.map(f => ({
          type: "file" as const,
          filename: f.filename,
          mediaType: f.mediaType,
          url: f.url
        }))
      ]
    };
    const updatedMessages = [...messages, userMsg];
    
    setConversations((prev) => 
      prev.map((c) => 
        c.id === activeChatId 
          ? { ...c, messages: updatedMessages as any } 
          : c
      )
    );
    
    const dt = new DataTransfer();
    selectedFiles.forEach(file => dt.items.add(file));
    
    sendMessage({ text: input, files: dt.files }, { body: { conversationId: activeChatId } });
    setInput("");
    setSelectedFiles([]);
  };

  const submitMessageDirectly = (promptText: string) => {
    if (isLoading) return;
    setActiveTab("chat");
    setShowSearchResults(false);
    
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: promptText,
      parts: [{ type: "text" as const, text: promptText }]
    };
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

  const renderAssistantChat = (compact: boolean = false) => {
    return (
      <div className="h-full flex flex-col justify-between overflow-hidden bg-background">
        {/* Header */}
        {compact && (
          <div className="px-4 py-3 border-b border-border/60 bg-background/60 backdrop-blur-sm shrink-0 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground tracking-wider uppercase">Argon Assistant</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            {/* If we are in calendar tab, allow toggling back to manual scheduling form */}
            {activeTab === "calendar" && (
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

        <div className={`flex-1 overflow-y-auto ${compact ? "px-4 py-4 space-y-4" : "px-6 py-6 space-y-6"}`}>
          {messages.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center mx-auto text-center ${compact ? "space-y-4 max-w-[280px]" : "space-y-8 max-w-xl"} py-6`}>
              <div className={`rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground shadow-lg relative group transition-all duration-300 hover:border-border/80 ${compact ? "h-11 w-11" : "h-16 w-16"}`}>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className={compact ? "h-5 w-5 text-foreground/90" : "h-7 w-7 text-foreground/90"} />
              </div>
              
              <div className="space-y-1">
                <h2 className={`${compact ? "text-xs font-bold" : "text-3xl font-extrabold"} font-serif text-foreground tracking-tight leading-tight`}>
                  Argon Assistant
                </h2>
                {!compact && (
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Query your cached correspondence, draft response text, check calendar conflicts, or trigger direct event creation via command parameters.
                  </p>
                )}
              </div>

              {!compact && (
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
              )}
            </div>
          ) : (
            <div className={`${compact ? "w-full" : "max-w-2xl mx-auto"} space-y-4`}>
              {messages
                .filter(m => getMessageText(m).trim() !== "" || m.role === "user" || (m as any).toolInvocations?.length > 0)
                .map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-semibold shadow-sm ${
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary border border-border text-foreground/90"
                  }`}>
                    {m.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3 text-muted-foreground/80" />}
                  </div>
                  <div className={`rounded-xl px-3 py-2 max-w-[90%] text-xs leading-relaxed ${
                    m.role === "user" 
                      ? "bg-primary/90 text-primary-foreground font-medium animate-in fade-in slide-in-from-bottom-2 duration-300" 
                      : "bg-card border border-border/50 text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300"
                  }`}>
                    {m.role === "user" ? (
                      <div className="space-y-1">
                        <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
                        {Array.isArray((m as any).parts) && (m as any).parts.some((p: any) => p.type === 'file') && (
                          <div className="flex flex-wrap gap-1.5 pt-1.5">
                            {(m as any).parts.filter((p: any) => p.type === 'file').map((p: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-1 bg-primary-foreground/15 border border-primary-foreground/20 rounded px-1.5 py-0.5 text-[9px] text-primary-foreground/90">
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
                        
                        {/* Custom tool card rendering */}
                        {(m as any).toolInvocations && (m as any).toolInvocations.map((toolInvocation: any) => {
                          const { toolCallId, toolName, result, args } = toolInvocation;
                          
                          if (toolName === 'draft_email') {
                            // Find files from the user message immediately preceding this tool call if not passed in tool args
                            let messageAttachments: EmailAttachment[] = [];
                            const msgIndex = messages.findIndex(msg => msg.id === m.id);
                            if (msgIndex > 0) {
                              const prevMsg = messages[msgIndex - 1];
                              if (prevMsg && prevMsg.role === 'user' && Array.isArray((prevMsg as any).parts)) {
                                messageAttachments = (prevMsg as any).parts
                                  .filter((p: any) => p.type === 'file')
                                  .map((p: any) => ({
                                    filename: p.filename,
                                    content: p.url // Data URL containing base64
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
                          
                          if (toolName === 'draft_calendar_event') {
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

                          if (toolName === 'run_script' && result) {
                            const list = Array.isArray(result) ? result : Array.isArray(result.emails) ? result.emails : [];
                            if (list.length > 0 && (list[0].subject || list[0].sender || list[0].from || list[0].snippet)) {
                              return (
                                <div key={toolCallId} className="mt-3 space-y-2 w-full text-left">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Found Emails:</p>
                                  {list.map((email: any, idx: number) => {
                                    const subject = email.subject || 'No Subject';
                                    const sender = email.sender || email.from || 'Unknown Sender';
                                    const snippet = email.snippet || '';
                                    const threadId = email.threadId || '';
                                    return (
                                      <div key={idx} className="p-3 rounded-xl border border-border/85 bg-card/45 hover:bg-card/90 transition flex flex-col gap-2 shadow-sm select-text">
                                        <div>
                                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">Sender</span>
                                          <span className="text-xs font-bold text-foreground">{sender}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">Subject</span>
                                          <span className="text-xs font-extrabold text-foreground">{subject}</span>
                                        </div>
                                        <div>
                                          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase block">Snippet</span>
                                          <span className="text-xs text-muted-foreground leading-relaxed">{snippet}</span>
                                        </div>
                                        <div className="flex justify-end pt-1">
                                          <Button
                                            size="sm"
                                            onClick={() => {
                                              setInput(`Reply to email: "${subject}" from "${sender}" (threadId: ${threadId})`);
                                            }}
                                            className="text-[9px] h-6 px-2 bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-lg flex items-center gap-1 cursor-pointer"
                                          >
                                            <Edit3 className="h-2.5 w-2.5" />
                                            <span>Reply</span>
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
              {isLoading && (
                (() => {
                  const visibleMessages = messages.filter(m => getMessageText(m).trim() !== "" || m.role === "user" || (m as any).toolInvocations?.length > 0);
                  const lastVisible = visibleMessages[visibleMessages.length - 1];
                  return !lastVisible || lastVisible.role !== "assistant";
                })()
              ) && (
                <div className="flex gap-3.5 items-start">
                  <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold bg-secondary border border-border text-foreground/90">
                    <Bot className="h-3.5 w-3.5 text-muted-foreground/80" />
                  </div>
                  <div className="rounded-2xl px-3 py-1.5 bg-card border border-border/50 text-muted-foreground text-[10px] flex items-center gap-1.5">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin text-muted-foreground/60" />
                    <span>Argon is On it...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input form */}
        <div className={`border-t border-border bg-background/85 backdrop-blur-sm shrink-0 ${compact ? "p-3" : "p-4"}`}>
          {selectedFiles.length > 0 && (
            <div className="w-full max-w-2xl mx-auto flex flex-wrap gap-1.5 mb-2 px-1 animate-in fade-in duration-200">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-2 py-1 text-[10px]">
                  <Paperclip className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="max-w-[150px] truncate text-foreground">{file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => removeSelectedFile(idx)} 
                    className="text-muted-foreground hover:text-destructive cursor-pointer ml-1 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <form 
            onSubmit={handleChatSubmit}
            className="w-full max-w-2xl mx-auto relative flex items-center bg-card border border-border rounded-xl px-2.5 py-1 hover:border-border/80 focus-within:border-border transition-all shadow-inner"
          >
            <input 
              type="text" 
              placeholder={compact ? "Ask Argon assistant..." : "Ask AI assistant to search mail or book meetings..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full bg-transparent text-xs text-foreground placeholder-muted-foreground py-2 pl-3 pr-28 focus:outline-none focus:ring-0"
            />
            <div className="absolute right-2 flex items-center gap-1.5 z-10">
              <label 
                title="Attach files"
                className="p-1.5 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-all cursor-pointer shadow-sm flex items-center justify-center"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <input 
                  type="file" 
                  multiple 
                  onChange={handleChatFileChange} 
                  className="hidden" 
                />
              </label>
              <button
                type="button"
                onClick={toggleListening}
                title="Voice input"
                className={`p-1.5 rounded-xl transition-all cursor-pointer shadow-sm ${
                  isListening ? "bg-red-500 text-white animate-pulse" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {isListening ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
              </button>
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
          {activeTab === "chat" && !showSearchResults && renderAssistantChat(false)}

          {activeTab === "inbox" && !showSearchResults && (
            <div className="flex h-full divide-x divide-border/60 overflow-hidden w-full">
              {/* Email List Column */}
              <div className={`overflow-y-auto p-4 space-y-3 shrink-0 transition-all ${
                selectedEmail ? "w-[360px]" : "flex-1"
              }`}>
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
                          className={`w-full p-3 flex items-start gap-2.5 text-left rounded-xl border transition-all ${
                            selectedEmail?.id === email.id 
                              ? "bg-accent border-primary/30 shadow-sm" 
                              : "bg-card/60 border-border/60 hover:bg-muted/60 hover:border-border"
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-full ${color} flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm`}>
                            {initials || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5 mb-0.5">
                              <span className="text-xs font-bold text-foreground truncate">{email.sender}</span>
                              <span className="text-[9px] text-muted-foreground shrink-0">
                                {new Date(email.receivedAt).toLocaleDateString([], { month:'short', day:'numeric' })}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-foreground/80 block truncate">{email.subject}</span>
                            <span className="text-[10px] text-muted-foreground/70 line-clamp-1 leading-relaxed">{email.snippet}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Email Details Column */}
              {selectedEmail && (
                <div className="flex-1 overflow-y-auto p-6 bg-card/10 select-text flex flex-col gap-6">
                  <div className="flex justify-between items-center pb-3 border-b border-border/60">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Details</h3>
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
                    {/* Details content */}
                    <div className="p-5 rounded-2xl border border-border bg-card/50 space-y-4 shadow-xl select-text">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Sender</span>
                        <p className="text-sm font-bold text-foreground break-words leading-snug">{selectedEmail.sender}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Subject</span>
                        <p className="text-base font-extrabold text-foreground leading-snug break-words">{selectedEmail.subject}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-1">Received</span>
                        <p className="text-xs text-muted-foreground font-medium">{new Date(selectedEmail.receivedAt).toLocaleString()}</p>
                      </div>
                      <div className="pt-4 border-t border-border/60">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block mb-2">{selectedEmail.body ? "Message Content" : "Snippet"}</span>
                        <div className="text-sm text-foreground/90 leading-relaxed break-words whitespace-pre-wrap select-text max-h-[300px] overflow-y-auto pr-1">
                          {selectedEmail.body || selectedEmail.snippet}
                        </div>
                      </div>
                    </div>

                    {/* AI Actions in details column */}
                    <div className="space-y-5 pt-4 border-t border-border/60">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">AI Assistant Actions</h4>
                      
                      {/* Summary action */}
                      <div className="space-y-2">
                        <Button 
                          onClick={() => handleSummarizeEmail(selectedEmail.gmailId)}
                          disabled={aiSummaryLoading}
                          className="w-full bg-secondary hover:bg-muted text-secondary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 border border-border rounded-xl cursor-pointer"
                        >
                          {aiSummaryLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-primary" />}
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
                          <div className="space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="relative">
                              <textarea
                                value={aiDraft}
                                onChange={(e) => setAiDraft(e.target.value)}
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
                              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-in fade-in duration-150 ${
                                inboxReplyStatus.type === 'success' 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                  : 'bg-destructive/10 border-destructive/20 text-destructive'
                              }`}>
                                {inboxReplyStatus.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <span>{inboxReplyStatus.message}</span>
                              </div>
                            )}

                            <Button
                              onClick={handleSendInboxReply}
                              disabled={sendingInboxReply}
                              className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs py-2 h-10 flex items-center justify-center gap-1.5 rounded-xl font-bold shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98]"
                            >
                              {sendingInboxReply ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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

      {/* 3. RIGHT COLUMN: Persistent AI Assistant Sidecar */}
      {activeTab !== "chat" && (
        <section className="w-[380px] flex flex-col overflow-hidden shrink-0 border-l border-border/60 bg-card/25">
          {activeTab === "inbox" && renderAssistantChat(true)}

          {activeTab === "calendar" && (
            calendarRightPanelMode === "assistant" ? (
              renderAssistantChat(true)
            ) : (
              <div className="flex-1 overflow-y-auto p-5 space-y-6 select-text">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-foreground font-serif">Manual Scheduler</h3>
                    <p className="text-[10px] text-muted-foreground/60">Schedule Google calendar events manually.</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCalendarRightPanelMode("assistant")}
                    className="text-[10px] h-7 px-2 hover:bg-muted text-muted-foreground cursor-pointer flex items-center gap-1"
                  >
                    <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
                    <span>Use Assistant</span>
                  </Button>
                </div>

                {/* Event Form creation */}
                <form onSubmit={handleCreateEvent} className="p-4 rounded-xl border border-border bg-card/25 space-y-4 text-xs">
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
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs py-1.5 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
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
            )
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
