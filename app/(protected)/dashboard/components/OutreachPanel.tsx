"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FolderPlus,
  UserPlus,
  Sparkles,
  Send,
  CheckCheck,
  FileText,
  Search,
  Filter,
  Trash2,
  Edit3,
  Loader2,
  Layers,
  Inbox,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OutreachGroupItem,
  OutreachRecipientItem,
  OutreachRecipientStatus,
} from "./types";
import { OutreachDraftCard } from "./OutreachDraftCard";
import { CreateGroupDialog } from "./CreateGroupDialog";
import { EditGroupDialog } from "./EditGroupDialog";
import { AddRecipientsDialog } from "./AddRecipientsDialog";
import { SendConfirmDialog } from "./SendConfirmDialog";

interface OutreachPanelProps {
  hasGmail: boolean;
}

export function OutreachPanel({ hasGmail }: OutreachPanelProps) {
  const [groups, setGroups] = useState<OutreachGroupItem[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [activeGroupData, setActiveGroupData] = useState<OutreachGroupItem | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Dialog controls
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [addRecipientsOpen, setAddRecipientsOpen] = useState(false);
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OutreachRecipientStatus>("all");
  const [showInstructions, setShowInstructions] = useState(false);

  // Batch action loadings
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch all groups
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch("/api/outreach/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data);
        if (data.length > 0 && !activeGroupId) {
          setActiveGroupId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load outreach groups:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // 2. Fetch active group with all its recipients
  const fetchGroupDetails = async (groupId: string) => {
    setIsLoadingDetails(true);
    try {
      const res = await fetch(`/api/outreach/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveGroupData(data);
      }
    } catch (err) {
      console.error("Failed to load group details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (activeGroupId) {
      fetchGroupDetails(activeGroupId);
    } else {
      setActiveGroupData(null);
    }
  }, [activeGroupId]);

  // Overall stats
  const stats = useMemo(() => {
    if (!activeGroupData || !activeGroupData.recipients) {
      return { total: 0, draft: 0, generating: 0, approved: 0, sent: 0, error: 0 };
    }
    const r = activeGroupData.recipients;
    return {
      total: r.length,
      draft: r.filter((x) => x.status === "draft").length,
      generating: r.filter((x) => x.status === "generating").length,
      approved: r.filter((x) => x.status === "approved").length,
      sent: r.filter((x) => x.status === "sent").length,
      error: r.filter((x) => x.status === "error").length,
    };
  }, [activeGroupData]);

  // Filtered recipients
  const filteredRecipients = useMemo(() => {
    if (!activeGroupData?.recipients) return [];
    return activeGroupData.recipients.filter((item) => {
      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCompany = item.companyName.toLowerCase().includes(q);
        const matchEmail = item.email.toLowerCase().includes(q);
        const matchSubject = (item.subject || "").toLowerCase().includes(q);
        if (!matchCompany && !matchEmail && !matchSubject) return false;
      }
      return true;
    });
  }, [activeGroupData, statusFilter, searchQuery]);

  // Update recipient in local state
  const handleUpdateRecipient = (updated: OutreachRecipientItem) => {
    setActiveGroupData((prev) => {
      if (!prev || !prev.recipients) return prev;
      return {
        ...prev,
        recipients: prev.recipients.map((r) => (r.id === updated.id ? updated : r)),
      };
    });
  };

  // Delete recipient
  const handleDeleteRecipient = async (recipientId: string) => {
    if (!activeGroupId) return;
    try {
      const res = await fetch(`/api/outreach/groups/${activeGroupId}/recipients/${recipientId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setActiveGroupData((prev) => {
          if (!prev || !prev.recipients) return prev;
          return {
            ...prev,
            recipients: prev.recipients.filter((r) => r.id !== recipientId),
          };
        });
      }
    } catch (err) {
      console.error("Failed to delete recipient:", err);
    }
  };

  // Delete Group
  const handleDeleteGroup = async (groupId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this outreach group and all its email drafts?"
    );
    if (!confirm) return;

    try {
      const res = await fetch(`/api/outreach/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== groupId));
        if (activeGroupId === groupId) {
          const remaining = groups.filter((g) => g.id !== groupId);
          setActiveGroupId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error("Failed to delete group:", err);
    }
  };

  // Generate All AI Drafts in group
  const handleGenerateAll = async () => {
    if (!activeGroupId) return;
    setIsGeneratingAll(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/outreach/groups/${activeGroupId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate drafts");
      }

      setNotification({
        type: "success",
        text: `Generated ${data.results?.length || 0} personalized drafts!`,
      });
      await fetchGroupDetails(activeGroupId);
    } catch (err: any) {
      setNotification({
        type: "error",
        text: err.message || "Failed to generate drafts",
      });
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Approve All drafts
  const handleApproveAll = async () => {
    if (!activeGroupData || !activeGroupData.recipients || !activeGroupId) return;
    const drafts = activeGroupData.recipients.filter(
      (r) => (r.status === "draft" || r.status === "error") && r.subject && r.body
    );
    if (drafts.length === 0) return;

    setIsApprovingAll(true);
    try {
      // Approve each draft sequentially or in parallel
      await Promise.all(
        drafts.map((d) =>
          fetch(`/api/outreach/groups/${activeGroupId}/recipients/${d.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "approved" }),
          })
        )
      );
      await fetchGroupDetails(activeGroupId);
    } catch (err) {
      console.error("Failed to approve all:", err);
    } finally {
      setIsApprovingAll(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ── TOP HEADER BAR ── */}
      <div className="border-b border-border/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 bg-card/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-primary border border-primary/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Personalized Cold Outreach
              {!hasGmail && (
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Gmail Not Connected
                </span>
              )}
            </h1>
            <p className="text-xs text-muted-foreground">
              Segment companies by group, attach dedicated PDFs, and generate tailored cold emails with AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCreateGroupOpen(true)}
            className="h-8 text-xs px-3.5 gap-1.5 shadow-sm"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Group
          </Button>
        </div>
      </div>

      {/* ── NOTIFICATION TOAST ── */}
      {notification && (
        <div
          className={`mx-6 mt-3 p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            notification.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-rose-500/10 border-rose-500/20 text-rose-500"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── LEFT COLUMN: GROUP SELECTOR ── */}
        <div className="w-full md:w-72 lg:w-80 border-r border-border/80 flex flex-col shrink-0 bg-muted/10">
          <div className="p-3 border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outreach Groups ({groups.length})
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoadingGroups ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading groups...
              </div>
            ) : groups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground space-y-2">
                <Layers className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No outreach groups created yet.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateGroupOpen(true)}
                  className="h-7 text-xs px-3"
                >
                  Create First Group
                </Button>
              </div>
            ) : (
              groups.map((g) => {
                const isActive = g.id === activeGroupId;
                return (
                  <div
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-card border-primary/40 shadow-sm ring-1 ring-primary/20"
                        : "bg-card/40 border-border/60 hover:bg-card/80 hover:border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-foreground truncate">
                        {g.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted font-mono text-muted-foreground">
                        {g._count?.recipients ?? 0}
                      </span>
                    </div>

                    {g.attachmentName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-primary truncate">
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{g.attachmentName}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: ACTIVE GROUP WORKSPACE ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              Loading group details...
            </div>
          ) : !activeGroupData ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-3">
              <Inbox className="w-12 h-12 opacity-30" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Select or create a group</h3>
                <p className="text-xs max-w-sm mt-1">
                  Choose an outreach group on the left to review recipients, generate personalized emails, and send.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* ── GROUP HEADER & STATS ── */}
              <div className="p-4 border-b border-border/80 bg-card/30 shrink-0 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      {activeGroupData.name}
                      {activeGroupData.attachmentName && (
                        <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {activeGroupData.attachmentName}
                        </span>
                      )}
                    </h2>
                  </div>

                  {/* Group Top Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddRecipientsOpen(true)}
                      className="h-8 text-xs px-3 gap-1.5 border-border/80"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Companies
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAll}
                      disabled={isGeneratingAll || stats.total === 0}
                      className="h-8 text-xs px-3 gap-1.5 border-border/80 bg-primary/5 hover:bg-primary/10 text-primary"
                    >
                      {isGeneratingAll ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      Generate All AI Drafts
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleApproveAll}
                      disabled={isApprovingAll || stats.draft === 0}
                      className="h-8 text-xs px-3 gap-1.5 border-border/80 text-blue-500 hover:text-blue-600"
                    >
                      {isApprovingAll ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5" />
                      )}
                      Approve All
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setSendConfirmOpen(true)}
                      disabled={stats.approved === 0 && stats.draft === 0}
                      className="h-8 text-xs px-3.5 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Outreach ({stats.approved})
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditGroupOpen(true)}
                      className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Edit Group"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGroup(activeGroupData.id)}
                      className="h-8 px-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                      title="Delete Group"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Instructions Collapsible */}
                {activeGroupData.instructions && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 text-xs">
                    <button
                      onClick={() => setShowInstructions(!showInstructions)}
                      className="w-full flex items-center justify-between text-muted-foreground hover:text-foreground font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        AI Instructions for this Group
                      </span>
                      {showInstructions ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {showInstructions && (
                      <p className="mt-2 text-foreground/80 leading-relaxed whitespace-pre-wrap border-t border-border/40 pt-2 font-mono text-[11px]">
                        {activeGroupData.instructions}
                      </p>
                    )}
                  </div>
                )}

                {/* Stats Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-muted-foreground mr-1">Status Overview:</span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                    Total: {stats.total}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-foreground font-medium">
                    Drafts: {stats.draft}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-medium">
                    Approved: {stats.approved}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-medium">
                    Sent: {stats.sent}
                  </span>
                  {stats.error > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-medium">
                      Errors: {stats.error}
                    </span>
                  )}
                </div>
              </div>

              {/* ── FILTER & SEARCH BAR ── */}
              <div className="px-4 py-2.5 border-b border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto">
                  {(
                    [
                      { id: "all", label: `All (${stats.total})` },
                      { id: "draft", label: `Drafts (${stats.draft})` },
                      { id: "approved", label: `Approved (${stats.approved})` },
                      { id: "sent", label: `Sent (${stats.sent})` },
                      { id: "error", label: `Errors (${stats.error})` },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id as any)}
                      className={`h-7 px-2.5 text-xs rounded-lg transition-all font-medium ${
                        statusFilter === tab.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search company or email..."
                    className="w-full h-7 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* ── RECIPIENTS CARDS LIST ── */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredRecipients.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-2">
                    <UserPlus className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-xs">
                      {activeGroupData.recipients?.length === 0
                        ? "No companies added to this group yet."
                        : "No recipients match your filter criteria."}
                    </p>
                    {activeGroupData.recipients?.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => setAddRecipientsOpen(true)}
                        className="h-7 text-xs px-3"
                      >
                        Add Recipients Now
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredRecipients.map((recipient) => (
                    <OutreachDraftCard
                      key={recipient.id}
                      recipient={recipient}
                      groupId={activeGroupData.id}
                      attachmentName={activeGroupData.attachmentName}
                      onUpdate={handleUpdateRecipient}
                      onDelete={handleDeleteRecipient}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── DIALOGS ── */}
      <CreateGroupDialog
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onSuccess={(newGroup) => {
          setGroups((prev) => [newGroup, ...prev]);
          setActiveGroupId(newGroup.id);
        }}
      />

      {activeGroupData && (
        <>
          <EditGroupDialog
            isOpen={editGroupOpen}
            group={activeGroupData}
            onClose={() => setEditGroupOpen(false)}
            onSuccess={(updated) => {
              setActiveGroupData((prev) => (prev ? { ...prev, ...updated } : updated));
              setGroups((prev) =>
                prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g))
              );
            }}
          />

          <AddRecipientsDialog
            isOpen={addRecipientsOpen}
            groupId={activeGroupData.id}
            groupName={activeGroupData.name}
            onClose={() => setAddRecipientsOpen(false)}
            onSuccess={() => {
              fetchGroupDetails(activeGroupData.id);
            }}
          />

          <SendConfirmDialog
            isOpen={sendConfirmOpen}
            group={activeGroupData}
            recipients={activeGroupData.recipients || []}
            onClose={() => setSendConfirmOpen(false)}
            onSendComplete={(result) => {
              setNotification({
                type: "success",
                text: `Successfully sent ${result.sent} emails! (${result.failed} failed)`,
              });
              fetchGroupDetails(activeGroupData.id);
            }}
          />
        </>
      )}
    </div>
  );
}
