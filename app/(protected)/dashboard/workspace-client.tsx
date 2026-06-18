"use client";

import React, { useState, useEffect, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { 
  Star, Bot, User, Send, Plus, Settings, LogOut, Mail, 
  Calendar, CheckCircle2, MessageSquare, AlertCircle, RefreshCw, 
  Sparkles, Search, ArrowRight, UserCheck, Inbox, ShieldAlert, 
  ChevronRight, CalendarDays, Edit3, Clipboard, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
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
        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-sm font-bold mb-2 text-zinc-100">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xs font-bold mb-1.5 text-zinc-100">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xs font-semibold mb-1 text-zinc-200">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-0.5 pl-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-0.5 pl-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
        em: ({ children }) => <em className="italic text-zinc-300">{children}</em>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 my-2 text-[10px] font-mono text-emerald-400 overflow-x-auto whitespace-pre">{children}</code>
          ) : (
            <code className="bg-zinc-800 rounded px-1 py-0.5 text-[10px] font-mono text-emerald-400">{children}</code>
          );
        },
        pre: ({ children }) => <pre className="my-2">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-600 pl-3 my-2 text-zinc-400 italic">{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">{children}</a>
        ),
        hr: () => <hr className="border-zinc-800 my-3" />,
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
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans overflow-hidden">
      
      {/* 1. LEFT COLUMN: Sidebar Navigation Layout */}
      <aside className={`bg-zinc-900 border-r border-zinc-800 flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}>
        
        {/* Top Logo and New Chat */}
        <div className="p-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between px-1 py-1">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 shadow-inner shrink-0">
                <Star className="h-4.5 w-4.5 fill-current text-zinc-950" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-lg font-bold font-serif tracking-tight text-white transition-opacity duration-300">
                  Locus
                </span>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-zinc-500 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition-colors shrink-0"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronRight className={`h-4.5 w-4.5 transform transition-transform duration-300 ${sidebarCollapsed ? "" : "rotate-180"}`} />
            </button>
          </div>

          <Button 
            onClick={createNewChat}
            variant="outline" 
            className={`justify-start gap-2 border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all ${
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
                    ? "bg-zinc-800 text-white font-medium shadow-sm"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
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
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2 pb-1.5">
                Recent Conversations
              </div>
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all text-left truncate ${
                    activeTab === "chat" && activeChatId === c.id && !showSearchResults
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
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
        <div className="p-4 border-t border-zinc-800">
          <div className={`flex items-center justify-between p-2 rounded-xl bg-zinc-950/40 border border-zinc-900 transition-all ${
            sidebarCollapsed ? "flex-col gap-2 p-1" : ""
          }`}>
            <div className={`flex items-center gap-2.5 overflow-hidden ${
              sidebarCollapsed ? "flex-col justify-center" : ""
            }`}>
              {userImage ? (
                <img src={userImage} alt={userName} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-350 shrink-0">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="flex flex-col truncate transition-opacity duration-300">
                  <span className="text-xs font-semibold text-zinc-200 truncate">{userName}</span>
                  <span className="text-[10px] text-zinc-500 truncate">{userEmail}</span>
                </div>
              )}
            </div>
            <button 
              onClick={handleSignOut}
              className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-md hover:bg-zinc-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MIDDLE COLUMN: Main dynamic dashboard views */}
      <section className="flex-1 flex flex-col bg-zinc-950 border-r border-zinc-900 overflow-hidden relative">
        
        {/* Top Header with Unified Search Input */}
        <header className="h-14 border-b border-zinc-900 flex items-center justify-between px-6 shrink-0 bg-zinc-950/60 backdrop-blur-sm z-10 gap-4">
          <div className="text-sm font-semibold text-zinc-200 shrink-0">
            {showSearchResults ? "Search Results" : activeTab === "chat" ? "AI Assistant" : activeTab === "inbox" ? "Emails Inbox" : "Calendar Events"}
          </div>

          <div className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-550" />
              <input
                type="text"
                placeholder="Search emails or events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-1.5 text-xs placeholder-zinc-500 text-zinc-200 focus:outline-none focus:border-zinc-700 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-550 hover:text-zinc-200"
                >
                  Clear
                </button>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenCommandPalette(true)}
              className="h-8 border-zinc-850 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 text-xs px-2 gap-1 cursor-pointer"
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
              <h2 className="text-lg font-bold font-serif text-white">Search matches found in cache</h2>
              
              {searchLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-12">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Parsing search criteria...</span>
                </div>
              ) : !searchResults || (searchResults.emails.length === 0 && searchResults.events.length === 0) ? (
                <div className="text-center py-12 space-y-2">
                  <ShieldAlert className="h-9 w-9 text-zinc-650 mx-auto" />
                  <p className="text-xs text-zinc-500 font-medium">No matching emails or meetings registered in cache database.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Email matches */}
                  {searchResults.emails.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Emails</h3>
                      <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/15">
                        {searchResults.emails.map((email) => (
                          <button
                            key={email.id}
                            onClick={() => {
                              setSelectedEmail(email);
                              setActiveTab("inbox");
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-zinc-900/60 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-zinc-350">{email.sender}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(email.receivedAt).toLocaleDateString()}</span>
                            </div>
                            <span className="text-xs text-white font-semibold line-clamp-1">{email.subject}</span>
                            <span className="text-[11px] text-zinc-500 line-clamp-1">{email.snippet}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calendar matches */}
                  {searchResults.events.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Meetings</h3>
                      <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl overflow-hidden bg-zinc-900/15">
                        {searchResults.events.map((event) => (
                          <button
                            key={event.id}
                            onClick={() => {
                              setActiveTab("calendar");
                              setShowSearchResults(false);
                              setSearchQuery("");
                            }}
                            className="w-full p-4 flex flex-col gap-1 items-start text-left hover:bg-zinc-900/60 transition-colors"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold text-zinc-300">{event.title}</span>
                              <span className="text-[10px] text-zinc-550">{new Date(event.startTime).toLocaleDateString()}</span>
                            </div>
                            <span className="text-[11px] text-zinc-400">
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
                  <div className="h-full flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-350 shadow-inner">
                      <Sparkles className="h-6 w-6 text-zinc-150" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold font-serif text-white">Workspace AI Assistant</h2>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        Query your cached correspondence, draft response text, check calendar conflicts, or trigger direct event creation via command parameters.
                      </p>
                    </div>
                    <div className="grid gap-2.5 w-full pt-4">
                      {[
                        "Summarize my recent Gmail messages",
                        "Do I have any calendar conflicts tomorrow?",
                        "Schedule a 30m slot with team next Monday",
                      ].map((promptText, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(promptText)}
                          className="p-3 text-left rounded-xl border border-zinc-900 bg-zinc-900/20 text-xs text-zinc-350 hover:border-zinc-800 hover:bg-zinc-900/60 transition-all font-semibold"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-3.5 items-start ${m.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div className={`h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm ${
                          m.role === "user" ? "bg-zinc-100 text-zinc-950" : "bg-zinc-850 border border-zinc-700 text-zinc-200"
                        }`}>
                          {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5 text-zinc-250" />}
                        </div>
                        <div className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-xs leading-relaxed ${
                          m.role === "user" ? "bg-zinc-800 text-zinc-100 font-medium" : "bg-zinc-900 border border-zinc-900/50 text-zinc-300"
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
                      <div className="flex gap-3.5 items-start">
                        <div className="h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold bg-zinc-800 border border-zinc-700 text-zinc-250">
                          <Bot className="h-3.5 w-3.5 text-zinc-250" />
                        </div>
                        <div className="rounded-2xl px-4 py-2 bg-zinc-900 text-zinc-500 text-[11px] flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin text-zinc-550" />
                          <span>Atria is thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-sm shrink-0">
                <form 
                  onSubmit={handleChatSubmit}
                  className="max-w-2xl mx-auto relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-1.5 hover:border-zinc-700 focus-within:border-zinc-650 transition-all shadow-inner"
                >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask AI assistant to search mail or book meetings..."
                    className="flex-1 bg-transparent border-0 outline-none ring-0 text-xs py-1.5 placeholder-zinc-550 text-zinc-150 focus:outline-none"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit"
                    size="icon"
                    className="h-7 w-7 rounded-lg bg-zinc-100 text-zinc-950 hover:bg-zinc-200 shrink-0 shadow-sm"
                    disabled={isLoading || !input.trim()}
                  >
                    <Send className="h-3.5 w-3.5 text-zinc-950" />
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* B. INBOX TAB VIEWPORT */}
          {activeTab === "inbox" && !showSearchResults && (
            <div className="p-4 space-y-4">
              {emailsLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-24">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading Gmail cache...</span>
                </div>
              ) : emails.length === 0 ? (
                <div className="text-center py-24 space-y-2">
                  <Inbox className="h-12 w-12 text-zinc-650 mx-auto" />
                  <p className="text-xs text-zinc-500">Inbox cache database is empty or links are initializing.</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-900 border border-zinc-900 rounded-xl bg-zinc-900/10 overflow-hidden">
                  {emails.map((email) => (
                    <button
                      key={email.id}
                      onClick={() => {
                        setSelectedEmail(email);
                        setAiSummary("");
                        setAiDraft("");
                      }}
                      className={`w-full p-4 flex flex-col gap-1 items-start text-left transition-colors ${
                        selectedEmail?.id === email.id 
                          ? "bg-zinc-900/80 hover:bg-zinc-900/80" 
                          : "hover:bg-zinc-900/40"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-zinc-350">{email.sender}</span>
                        <span className="text-[10px] text-zinc-500">
                          {new Date(email.receivedAt).toLocaleDateString()} {new Date(email.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-white line-clamp-1">{email.subject}</span>
                      <span className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed">{email.snippet}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. CALENDAR BOARD VIEWPORT */}
          {activeTab === "calendar" && !showSearchResults && (
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="text-base font-bold font-serif text-white">Upcoming Events List</h2>
                <p className="text-xs text-zinc-550">Track date conflicts and guest responses linked under calendar.</p>
              </div>

              {eventsLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-24">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Loading events...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-24 space-y-2">
                  <CalendarDays className="h-12 w-12 text-zinc-655 mx-auto" />
                  <p className="text-xs text-zinc-500">No scheduled events found in calendar cache.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const start = new Date(event.startTime);
                    const end = new Date(event.endTime);
                    const guests = Array.isArray(event.attendees) ? event.attendees : [];
                    return (
                      <div key={event.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white leading-tight">{event.title}</h4>
                          <p className="text-[11px] text-zinc-400">
                            {start.toLocaleDateString()} @ {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {guests.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-1">
                              <UserCheck className="h-3 w-3 text-zinc-500" />
                              <span className="text-[10px] text-zinc-500 truncate max-w-sm">
                                Guests: {guests.join(", ")}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-mono shrink-0">
                          Primary
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
            <div className="p-6 space-y-6 max-w-2xl mx-auto w-full">
              
              <div className="space-y-1">
                <h1 className="text-xl font-bold font-serif text-white">Integrations Settings</h1>
                <p className="text-xs text-zinc-400">
                  Manage external API credentials and link your personal workspace tools.
                </p>
              </div>

              {notification && (
                <div className={`p-4 rounded-xl border flex gap-3 items-start ${
                  notification.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {notification.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                  )}
                  <div className="text-sm leading-relaxed">{notification.message}</div>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                
                {/* Gmail connection card */}
                <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold">Gmail Inbox</CardTitle>
                      <CardDescription className="text-zinc-500 text-[10px]">Read, draft, and query mailboxes</CardDescription>
                    </div>
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                      <Mail className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px] flex items-center">
                      Authorizes Atria's sync agent to read, organize, and build index caches for your Gmail correspondence.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      {initialHasGmail ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Connected</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-200 text-xs hover:bg-zinc-800" disabled>
                            Configure
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-zinc-500 font-medium">Not linked</div>
                          <a href="/api/integrations/gmail/connect">
                            <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">
                              Connect Gmail
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Google Calendar connection card */}
                <Card className="bg-zinc-900 border-zinc-800 text-zinc-50 shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                    <div>
                      <CardTitle className="text-sm font-bold">Google Calendar</CardTitle>
                      <CardDescription className="text-zinc-500 text-[10px]">Manage events and schedules</CardDescription>
                    </div>
                    <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                      <Calendar className="h-4.5 w-4.5" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-zinc-400 leading-relaxed min-h-[40px] flex items-center">
                      Allows scheduling meetings, checking conflict parameters, and posting calendar updates via prompt.
                    </p>
                    <div className="flex items-center justify-between pt-2">
                      {initialHasCalendar ? (
                        <>
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Connected</span>
                          </div>
                          <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-zinc-200 text-xs hover:bg-zinc-800" disabled>
                            Configure
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs text-zinc-500 font-medium">Not linked</div>
                          <a href="/api/integrations/googlecalendar/connect">
                            <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">
                              Connect Calendar
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0" />
                <div className="text-xs text-zinc-450 leading-relaxed">
                  <strong>Multi-Tenancy note:</strong> Linking these services automatically binds them under your unique Tenant ID: <code className="text-zinc-200 bg-zinc-900 border border-zinc-800 px-1 rounded">{userId}</code>. Your personal emails and events will never be shared with other users.
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* 3. RIGHT COLUMN: Context panels */}
      <section className="w-80 bg-zinc-900/50 flex flex-col overflow-y-auto shrink-0 p-4 space-y-6">
        
        {/* A. CONTEXT: CHAT TAB */}
        {activeTab === "chat" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Workspace Context</h3>
              <p className="text-[11px] text-zinc-500 leading-normal">
                Atria coordinates cache queries and active integrations. Use natural language to schedule meetings or write email drafts.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-300">Integration Checklist</h4>
              <div className="space-y-2">
                {[
                  { name: "Gmail Connection", active: initialHasGmail },
                  { name: "Calendar Connection", active: initialHasCalendar },
                  { name: "Prisma Sync Cache Pool", active: initialHasGmail && initialHasCalendar },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${item.active ? "text-emerald-400" : "text-zinc-650"}`} />
                    <span className={item.active ? "text-zinc-300" : "text-zinc-500"}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/20 space-y-2 text-xs">
              <h4 className="text-xs font-semibold text-zinc-300">System Commands</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Type <code className="text-zinc-305 font-mono bg-zinc-900 border border-zinc-800 px-1 rounded">Summarize emails</code> or <code className="text-zinc-305 font-mono bg-zinc-900 border border-zinc-800 px-1 rounded">Book slot</code> to interact with Gmail or Google Calendar.
              </p>
            </div>
          </div>
        )}

        {/* B. CONTEXT: INBOX TAB */}
        {activeTab === "inbox" && (
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email Details</h3>
            
            {!selectedEmail ? (
              <div className="text-center py-12 space-y-2">
                <FileText className="h-8 w-8 text-zinc-700 mx-auto" />
                <p className="text-xs text-zinc-500 font-medium">Select an email from the inbox list to read details.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Details layout */}
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/40 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Sender</span>
                    <p className="font-semibold text-zinc-200 line-clamp-1">{selectedEmail.sender}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Subject</span>
                    <p className="font-bold text-white leading-snug">{selectedEmail.subject}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Received</span>
                    <p className="text-zinc-400">{new Date(selectedEmail.receivedAt).toLocaleString()}</p>
                  </div>
                  <div className="pt-2 border-t border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Snippet</span>
                    <p className="text-zinc-405 leading-relaxed pt-1 select-text">{selectedEmail.snippet}</p>
                  </div>
                </div>

                {/* AI Actions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-300">AI Assistant Actions</h4>
                  
                  {/* Summary action */}
                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleSummarizeEmail(selectedEmail.gmailId)}
                      disabled={aiSummaryLoading}
                      size="xs"
                      className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs py-1.5 flex items-center justify-center gap-1.5 border border-zinc-800"
                    >
                      {aiSummaryLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />}
                      <span>Generate Bullet Summary</span>
                    </Button>

                    {aiSummary && (
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/20 text-xs text-zinc-300 leading-relaxed relative whitespace-pre-wrap select-text">
                        <button 
                          onClick={() => copyToClipboard(aiSummary)}
                          className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-900 transition-colors"
                          title="Copy Summary"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        <strong className="text-[10px] font-bold text-zinc-500 uppercase block pb-1.5">AI Summary</strong>
                        {aiSummary}
                      </div>
                    )}
                  </div>

                  {/* AI drafting replies */}
                  <div className="space-y-2.5 pt-2 border-t border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">Drafting instructions (optional)</span>
                    <input 
                      type="text" 
                      placeholder="e.g., politely decline, ask to reschedule..." 
                      value={draftInstructions}
                      onChange={(e) => setDraftInstructions(e.target.value)}
                      className="w-full bg-zinc-955 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-zinc-700"
                    />

                    <Button 
                      onClick={() => handleDraftReply(selectedEmail.gmailId)}
                      disabled={aiDraftLoading}
                      size="xs"
                      className="w-full bg-zinc-850 hover:bg-zinc-800 text-zinc-200 text-xs py-1.5 flex items-center justify-center gap-1.5 border border-zinc-800"
                    >
                      {aiDraftLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Edit3 className="h-3.5 w-3.5 text-zinc-300" />}
                      <span>Generate Response Draft</span>
                    </Button>

                    {aiDraft && (
                      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/20 text-xs text-zinc-300 leading-relaxed relative whitespace-pre-wrap select-text">
                        <button 
                          onClick={() => copyToClipboard(aiDraft)}
                          className="absolute right-2 top-2 p-1 text-zinc-500 hover:text-zinc-200 rounded hover:bg-zinc-900 transition-colors"
                          title="Copy Draft"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                        <strong className="text-[10px] font-bold text-zinc-500 uppercase block pb-1.5">Reply Draft</strong>
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
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Visual Scheduler</h3>
              <p className="text-[11px] text-zinc-550">Create new Google calendar events dynamically.</p>
            </div>

            {/* Event Form creation */}
            <form onSubmit={handleCreateEvent} className="p-4 rounded-xl border border-zinc-850 bg-zinc-950/20 space-y-4 text-xs">
              <h4 className="text-xs font-bold text-zinc-200 font-serif">Schedule Meeting</h4>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">Meeting Title *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Sync with HR, Review roadmap..."
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">Start Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={eventStart}
                  onChange={(e) => setEventStart(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">End Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={eventEnd}
                  onChange={(e) => setEventEnd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase block">Guests (comma-separated)</label>
                <input 
                  type="text" 
                  placeholder="e.g. john@domain.com, team@locus.co"
                  value={eventGuests}
                  onChange={(e) => setEventGuests(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>

              {eventStatus && (
                <div className={`p-2.5 rounded-lg border text-[11px] leading-relaxed ${
                  eventStatus.type === "success" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {eventStatus.message}
                </div>
              )}

              <Button 
                type="submit"
                disabled={eventCreating}
                size="xs"
                className="w-full bg-zinc-100 text-zinc-950 hover:bg-zinc-200 text-xs py-1.5 font-bold rounded-lg flex items-center justify-center gap-1"
              >
                {eventCreating ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span>Booking...</span>
                  </>
                ) : (
                  <>
                    <Calendar className="h-3.5 w-3.5 text-zinc-950" />
                    <span>Post Event</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

      </section>

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
