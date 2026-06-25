"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/components/providers/loading-provider";
import { authClient } from "@/lib/auth-client";

// Modular components
import { DashboardSidebar } from "./components/DashboardSidebar";
import { DashboardHeader } from "./components/DashboardHeader";
import { ChatPanel } from "./components/ChatPanel";
import { InboxPanel } from "./components/InboxPanel";
import { CalendarPanel } from "./components/CalendarPanel";
import { CalendarManualForm } from "./components/CalendarManualForm";
import { ConfigurationPanel } from "./components/ConfigurationPanel";
import { SearchResultsPanel } from "./components/SearchResultsPanel";
import { CommandPaletteDialog } from "./components/CommandPaletteDialog";

// Types & utils
import {
  WorkspaceClientProps,
  EmailItem,
  CalendarItem,
  ChatConversation,
} from "./components/types";
import { getMessageText, formatDateTimeLocal } from "./components/utils";

export function WorkspaceClient({
  userId,
  userEmail,
  userName,
  userImage,
  initialHasGmail,
  initialHasCalendar,
  initialConversations = [],
  activeChatIdParam,
}: WorkspaceClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Tab / Layout state ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"chat" | "inbox" | "calendar" | "configuration">("chat");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [openCommandPalette, setOpenCommandPalette] = useState(false);
  const [calendarRightPanelMode, setCalendarRightPanelMode] = useState<"assistant" | "manual">("assistant");

  // ── URL query param handling ─────────────────────────────────────────────
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "configuration") {
      router.push("/settings");
    } else if (tab === "inbox") {
      setActiveTab("inbox");
    } else if (tab === "calendar") {
      setActiveTab("calendar");
    } else {
      setActiveTab("chat");
    }
  }, [searchParams, router]);

  // Keyboard ⌘K shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommandPalette((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // ── OAuth notification (success/error from URL) ──────────────────────────
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      setNotification({
        type: "success",
        message: `Successfully connected ${success === "gmail" ? "Gmail" : "Google Calendar"} integration!`,
      });
      router.replace("/dashboard?tab=configuration");
    } else if (error) {
      setNotification({
        type: "error",
        message: `Failed to link account: ${error}. Please try again.`,
      });
      router.replace("/dashboard?tab=configuration");
    }
  }, [searchParams, router]);

  // ── Data cache states ────────────────────────────────────────────────────
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [events, setEvents] = useState<CalendarItem[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [activeLabel, setActiveLabel] = useState<string>("INBOX");

  const fetchEmails = async (label = "INBOX") => {
    setEmailsLoading(true);
    try {
      const res = await fetch(`/api/emails?label=${label}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
      }
      setActiveLabel(label);
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setEmailsLoading(false);
    }
  };

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
    if (activeTab === "inbox") fetchEmails(activeLabel);
    else if (activeTab === "calendar") fetchEvents();
  }, [activeTab]);




  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    emails: EmailItem[];
    events: CalendarItem[];
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setShowSearchResults(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch (err) {
        console.error("Search query failed:", err);
      } finally {
        setSearchLoading(false);
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Inbox detail + AI actions ────────────────────────────────────────────
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiDraft, setAiDraft] = useState("");
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [draftInstructions, setDraftInstructions] = useState("");
  const [sendingInboxReply, setSendingInboxReply] = useState(false);
  const [inboxReplyStatus, setInboxReplyStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSummarizeEmail = async (gmailId: string) => {
    setAiSummaryLoading(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/emails/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailId }),
      });
      const data = await res.json();
      setAiSummary(res.ok ? data.summary : "Failed to generate summary. Verify integration credentials.");
    } catch {
      setAiSummary("Error calling AI summarizing system.");
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleDraftReply = async (gmailId: string) => {
    setAiDraftLoading(true);
    setAiDraft("");
    try {
      const res = await fetch("/api/emails/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailId, instructions: draftInstructions }),
      });
      const data = await res.json();
      setAiDraft(res.ok ? data.draft : "Failed to generate response draft content.");
    } catch {
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
      const subject = selectedEmail.subject.toLowerCase().startsWith("re:")
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`;
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedEmail.sender,
          subject,
          body: aiDraft,
          threadId: selectedEmail.threadId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInboxReplyStatus({ type: "success", message: "Reply sent successfully!" });
        setAiDraft("");
        setDraftInstructions("");
      } else {
        throw new Error(data.error || "Failed to send reply");
      }
    } catch (err: any) {
      setInboxReplyStatus({ type: "error", message: err.message || "Failed to send reply" });
    } finally {
      setSendingInboxReply(false);
    }
  };

  // ── Calendar manual form ─────────────────────────────────────────────────
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("");
  const [eventEnd, setEventEnd] = useState("");
  const [eventGuests, setEventGuests] = useState("");
  const [eventCreating, setEventCreating] = useState(false);
  const [eventStatus, setEventStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventStart || !eventEnd) {
      setEventStatus({ type: "error", message: "Please fill out all required fields." });
      return;
    }
    setEventCreating(true);
    setEventStatus(null);
    try {
      const guestsArr = eventGuests.split(",").map((g) => g.trim()).filter(Boolean);
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: eventTitle, startTime: eventStart, endTime: eventEnd, attendees: guestsArr }),
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
    } catch {
      setEventStatus({ type: "error", message: "Error scheduling event." });
    } finally {
      setEventCreating(false);
    }
  };

  // ── Chat / AI ────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ChatConversation[]>(
    initialConversations.length > 0
      ? initialConversations
      : [{ id: activeChatIdParam || `chat-${Date.now()}`, title: "New Conversation", messages: [] }]
  );
  const activeChatId = activeChatIdParam || (initialConversations.length > 0 ? initialConversations[0].id : conversations[0]?.id || "default-chat");

  // Clear search query and results when tab or conversation changes
  useEffect(() => {
    setSearchQuery("");
    setShowSearchResults(false);
  }, [activeTab, activeChatId]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { messages, sendMessage, setMessages, status, addToolResult } = useChat({});

  // Sync messages into conversation store
  useEffect(() => {
    setConversations((prev) => {
      let changed = false;
      const next = prev.map((c) => {
        if (c.id !== activeChatId) return c;
        if (
          c.messages.length === messages.length &&
          c.messages.every(
            (m, idx) =>
              m.id === (messages[idx] as any)?.id &&
              m.content === (messages[idx] as any)?.content &&
              (m as any).toolInvocations?.length === (messages[idx] as any).toolInvocations?.length
          )
        ) {
          return c;
        }
        changed = true;
        let title = c.title;
        if (c.title.startsWith("New Conversation") || c.title.startsWith("Conversation ")) {
          const first = messages.find((m) => m.role === "user");
          if (first) title = getMessageText(first).slice(0, 30) || c.title;
        }
        return { ...c, title, messages: messages as any };
      });
      return changed ? next : prev;
    });
  }, [messages, activeChatId]);

  // Sync URL active chat ID with conversations state and restore messages
  // This ONLY depends on activeChatId to prevent rendering loops when conversations list updates
  useEffect(() => {
    setInput("");
    setSelectedFiles([]);
    setConversations((prev) => {
      const hasChat = prev.some((c) => c.id === activeChatId);
      if (activeChatId && !hasChat) {
        setMessages([]);
        return [
          { id: activeChatId, title: "New Conversation", messages: [] },
          ...prev,
        ];
      } else {
        const active = prev.find((c) => c.id === activeChatId);
        if (active) {
          setMessages(active.messages as any);
        } else {
          setMessages([]);
        }
        return prev;
      }
    });
  }, [activeChatId]);

  const isLoading = status === "submitted" || status === "streaming";

  const selectConversation = (chatId: string) => {
    setActiveTab("chat");
    setShowSearchResults(false);
    router.push(`/dashboard/${chatId}`);
  };

  const createNewChat = () => {
    const newId = `chat-${Date.now()}`;
    router.push(`/dashboard/${newId}`);
  };

  const deleteConversation = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this conversation?")) return;

    try {
      const res = await fetch(`/api/chat?id=${chatId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setConversations((prev) => {
          const next = prev.filter((c) => c.id !== chatId);
          if (chatId === activeChatId) {
            setTimeout(() => {
              if (next.length > 0) {
                router.push(`/dashboard/${next[0].id}`);
              } else {
                createNewChat();
              }
            }, 0);
          }
          return next;
        });
      } else {
        alert("Failed to delete conversation from database.");
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      alert("Error deleting conversation.");
    }
  };


  const getFilesWithDataUrls = async (files: File[]) =>
    Promise.all(
      files.map(
        (file) =>
          new Promise<{ filename: string; mediaType: string; url: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({ filename: file.name, mediaType: file.type, url: reader.result as string });
            reader.readAsDataURL(file);
          })
      )
    );

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0) || isLoading) return;

    const fileParts =
      selectedFiles.length > 0 ? await getFilesWithDataUrls(selectedFiles) : [];
    const textPart = input.trim() ? [{ type: "text" as const, text: input }] : [];

    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: input,
      parts: [
        ...textPart,
        ...fileParts.map((f) => ({
          type: "file" as const,
          filename: f.filename,
          mediaType: f.mediaType,
          url: f.url,
        })),
      ],
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] as any } : c
      )
    );

    const dt = new DataTransfer();
    selectedFiles.forEach((f) => dt.items.add(f));
    sendMessage({ text: input, files: dt.files }, { body: { conversationId: activeChatId } });
    setInput("");
    setSelectedFiles([]);
  };

  const submitMessageDirectly = (promptText: string) => {
    if (isLoading) return;
    setShowSearchResults(false);
    router.push(`/dashboard/${activeChatId}`);
    const userMsg = {
      id: `user-${Date.now()}`,
      role: "user" as const,
      content: promptText,
      parts: [{ type: "text" as const, text: promptText }],
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, messages: [...c.messages, userMsg] as any } : c
      )
    );
    sendMessage({ text: promptText }, { body: { conversationId: activeChatId } });
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") console.error("Speech recognition error", event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const chatPanelProps = {
    messages,
    isLoading,
    status,
    input,
    setInput,
    selectedFiles,
    setSelectedFiles,
    addToolResult,
    activeTab,
    onSubmit: handleChatSubmit,
    onFileChange: handleFileChange,
    onToggleListening: toggleListening,
    isListening,
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">

      {/* LEFT: Sidebar */}
      <DashboardSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeTab={activeTab}
        showSearchResults={showSearchResults}
        activeChatId={activeChatId}
        conversations={conversations}
        createNewChat={createNewChat}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
        onSettings={() => router.push("/settings")}
        onSignOut={handleSignOut}
        deleteConversation={deleteConversation}
        hasGmail={initialHasGmail}
        hasCalendar={initialHasCalendar}
      />

      {/* MIDDLE: Main content */}
      <section className="flex-1 flex flex-col bg-background border-r border-border/60 overflow-hidden relative">
        <DashboardHeader
          activeTab={activeTab}
          showSearchResults={showSearchResults}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenCommandPalette={() => setOpenCommandPalette(true)}
        />

        <div className="flex-1 overflow-y-auto relative">
          {/* Search results overlay */}
          {showSearchResults && (
            <SearchResultsPanel
              searchLoading={searchLoading}
              searchResults={searchResults}
              onSelectEmail={(email) => {
                setSelectedEmail(email);
                router.push(`/dashboard/${activeChatId}?tab=inbox`);
                setShowSearchResults(false);
                setSearchQuery("");
              }}
              onSelectEvent={() => {
                router.push(`/dashboard/${activeChatId}?tab=calendar`);
                setShowSearchResults(false);
                setSearchQuery("");
              }}
            />
          )}

          {/* AI Chat */}
          {activeTab === "chat" && !showSearchResults && (
            <ChatPanel {...chatPanelProps} />
          )}

          {/* Inbox */}
          {activeTab === "inbox" && !showSearchResults && (
            <InboxPanel
              emailsLoading={emailsLoading}
              emails={emails}
              selectedEmail={selectedEmail}
              setSelectedEmail={setSelectedEmail}
              setAiSummary={setAiSummary}
              setAiDraft={setAiDraft}
              aiSummaryLoading={aiSummaryLoading}
              aiSummary={aiSummary}
              aiDraftLoading={aiDraftLoading}
              aiDraft={aiDraft}
              setAiDraftValue={setAiDraft}
              draftInstructions={draftInstructions}
              setDraftInstructions={setDraftInstructions}
              sendingInboxReply={sendingInboxReply}
              inboxReplyStatus={inboxReplyStatus}
              onSummarize={handleSummarizeEmail}
              onDraftReply={handleDraftReply}
              onSendReply={handleSendInboxReply}
              onAskAI={(subject, sender, threadId) => {
                setInput(`Reply to email: "${subject}" from "${sender}" (threadId: ${threadId})`);
                router.push(`/dashboard/${activeChatId}`);
              }}
              copyToClipboard={(text) => navigator.clipboard.writeText(text)}
              activeLabel={activeLabel}
              onFilterChange={(lbl) => fetchEmails(lbl)}
            />
          )}

          {/* Calendar */}
          {activeTab === "calendar" && !showSearchResults && (
            <CalendarPanel eventsLoading={eventsLoading} events={events} />
          )}

          {/* Configuration — redirects to /settings, kept for graceful fallback */}
          {activeTab === "configuration" && !showSearchResults && (
            <ConfigurationPanel
              userId={userId}
              initialHasGmail={initialHasGmail}
              initialHasCalendar={initialHasCalendar}
              notification={notification}
            />
          )}
        </div>
      </section>

      {/* RIGHT: Persistent AI sidecar (when not on Chat tab) */}
      {activeTab !== "chat" && (
        <section className="w-[380px] flex flex-col overflow-hidden shrink-0 border-l border-border/60 bg-card/25">
          {activeTab === "inbox" && (
            <ChatPanel {...chatPanelProps} compact />
          )}
          {activeTab === "calendar" && (
            calendarRightPanelMode === "assistant" ? (
              <ChatPanel
                {...chatPanelProps}
                compact
                activeTab="calendar"
                setCalendarRightPanelMode={setCalendarRightPanelMode}
              />
            ) : (
              <CalendarManualForm
                eventTitle={eventTitle}
                setEventTitle={setEventTitle}
                eventStart={eventStart}
                setEventStart={setEventStart}
                eventEnd={eventEnd}
                setEventEnd={setEventEnd}
                eventGuests={eventGuests}
                setEventGuests={setEventGuests}
                eventCreating={eventCreating}
                eventStatus={eventStatus}
                onSubmit={handleCreateEvent}
                onSwitchToAssistant={() => setCalendarRightPanelMode("assistant")}
              />
            )
          )}
        </section>
      )}

      {/* Command Palette ⌘K */}
      <CommandPaletteDialog
        open={openCommandPalette}
        onOpenChange={setOpenCommandPalette}
        onNavigate={(tab) => {
          setShowSearchResults(false);
          if (tab === "chat") {
            router.push(`/dashboard/${activeChatId}`);
          } else {
            router.push(`/dashboard/${activeChatId}?tab=${tab}`);
          }
        }}
        onSettings={() => router.push("/settings")}
        onAskAI={submitMessageDirectly}
        onScheduleTemplate={(title, start, end) => {
          setEventTitle(title);
          setEventStart(formatDateTimeLocal(start));
          setEventEnd(formatDateTimeLocal(end));
          setEventGuests("");
          router.push(`/dashboard/${activeChatId}?tab=calendar`);
          setCalendarRightPanelMode("manual");
        }}
      />
    </div>
  );
}
