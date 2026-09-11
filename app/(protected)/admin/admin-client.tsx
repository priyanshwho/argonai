"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  Activity,
  Mail,
  Calendar,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  ChevronDown,
  ChevronUp,
  Crown,
  Loader2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";

// ─── Types ────────────────────────────────────────────────────────────────────
interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  emailVerified: boolean;
  authMethods: string[];
  hasGmail: boolean;
  hasCalendar: boolean;
  role: string; // "client" | "admin" | "super_admin"
  createdAt: string;
  lastActive: string | null;
}

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  gmailConnected: number;
  calendarConnected: number;
  totalAdmins: number;
  totalClients: number;
}

type SortField = "name" | "email" | "createdAt" | "lastActive" | "role";
type SortDir = "asc" | "desc";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatIST(isoString: string | null): string {
  if (!isoString) return "Never";
  return new Date(isoString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getAuthBadge(provider: string) {
  switch (provider) {
    case "google":
      return { label: "Google", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    case "github":
      return { label: "GitHub", className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" };
    case "credential":
      return { label: "Email", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
    default:
      return { label: provider, className: "bg-muted text-muted-foreground border-border" };
  }
}

function getRoleBadge(role: string) {
  switch (role) {
    case "super_admin":
      return {
        label: "Super Admin",
        className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
        icon: Crown,
      };
    case "admin":
      return {
        label: "Admin",
        className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
        icon: ShieldCheck,
      };
    default:
      return {
        label: "Client",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
        icon: Users,
      };
  }
}

function relativeTime(isoString: string | null): string {
  if (!isoString) return "Never";
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return formatIST(isoString);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 flex items-center gap-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2.5 rounded-xl border shadow-sm shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
      </div>
    </div>
  );
}

// ─── Role Badge Component ─────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const badge = getRoleBadge(role);
  const BadgeIcon = badge.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${badge.className}`}>
      <BadgeIcon className="h-3 w-3" />
      {badge.label}
    </span>
  );
}

// ─── Role Action Button ───────────────────────────────────────────────────────
function RoleAction({
  user,
  isSuperAdmin,
  onRoleChange,
  changingUserId,
}: {
  user: AdminUser;
  isSuperAdmin: boolean;
  onRoleChange: (userId: string, newRole: string) => void;
  changingUserId: string | null;
}) {
  // Super Admin row — locked badge, no action
  if (user.role === "super_admin") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-500/70 px-2 py-1">
        <Shield className="h-3 w-3" />
        Protected
      </span>
    );
  }

  // Only Super Admin can change roles
  if (!isSuperAdmin) {
    return <span className="text-xs text-muted-foreground/50">—</span>;
  }

  const isChanging = changingUserId === user.id;
  const newRole = user.role === "admin" ? "client" : "admin";
  const actionLabel = user.role === "admin" ? "Demote to Client" : "Promote to Admin";
  const actionColor =
    user.role === "admin"
      ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20"
      : "text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/20";

  return (
    <button
      onClick={() => onRoleChange(user.id, newRole)}
      disabled={isChanging}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border bg-transparent transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${actionColor}`}
    >
      {isChanging ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <UserCog className="h-3 w-3" />
      )}
      {isChanging ? "Updating..." : actionLabel}
    </button>
  );
}

// ─── Main Admin Client ───────────────────────────────────────────────────────
export function AdminClient() {
  const [data, setData] = useState<{
    isSuperAdmin: boolean;
    stats: AdminStats;
    users: AdminUser[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changingUserId, setChangingUserId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [authFilter, setAuthFilter] = useState<string>("all");
  const [integrationFilter, setIntegrationFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/users");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // ── Role change handler ─────────────────────────────────────────────────
  const handleRoleChange = useCallback(
    async (userId: string, newRole: string) => {
      if (!data) return;
      setChangingUserId(userId);

      // Optimistic update
      const prevUsers = data.users;
      const updatedUsers = data.users.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      );
      const totalAdmins = updatedUsers.filter(
        (u) => u.role === "admin" || u.role === "super_admin"
      ).length;
      const totalClients = updatedUsers.filter((u) => u.role === "client").length;
      setData({
        ...data,
        users: updatedUsers,
        stats: { ...data.stats, totalAdmins, totalClients },
      });

      try {
        const res = await fetch("/api/admin/users/role", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, role: newRole }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
      } catch (err: any) {
        // Revert on failure
        const revertAdmins = prevUsers.filter(
          (u) => u.role === "admin" || u.role === "super_admin"
        ).length;
        const revertClients = prevUsers.filter((u) => u.role === "client").length;
        setData({
          ...data,
          users: prevUsers,
          stats: { ...data.stats, totalAdmins: revertAdmins, totalClients: revertClients },
        });
        alert(`Failed to update role: ${err.message}`);
      } finally {
        setChangingUserId(null);
      }
    },
    [data]
  );

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    let users = [...data.users];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    // Auth filter
    if (authFilter !== "all") {
      users = users.filter((u) => u.authMethods.includes(authFilter));
    }

    // Integration filter
    if (integrationFilter === "gmail") {
      users = users.filter((u) => u.hasGmail);
    } else if (integrationFilter === "calendar") {
      users = users.filter((u) => u.hasCalendar);
    } else if (integrationFilter === "both") {
      users = users.filter((u) => u.hasGmail && u.hasCalendar);
    } else if (integrationFilter === "none") {
      users = users.filter((u) => !u.hasGmail && !u.hasCalendar);
    }

    // Role filter
    if (roleFilter !== "all") {
      users = users.filter((u) => u.role === roleFilter);
    }

    // Sort
    users.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "lastActive":
          cmp =
            (a.lastActive ? new Date(a.lastActive).getTime() : 0) -
            (b.lastActive ? new Date(b.lastActive).getTime() : 0);
          break;
        case "role": {
          const order: Record<string, number> = { super_admin: 0, admin: 1, client: 2 };
          cmp = (order[a.role] ?? 3) - (order[b.role] ?? 3);
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return users;
  }, [data, search, authFilter, integrationFilter, roleFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3 inline ml-0.5" />
    ) : (
      <ChevronDown className="h-3 w-3 inline ml-0.5" />
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto animate-pulse">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive font-medium">{error || "Failed to load data"}</p>
          <Link href="/dashboard">
            <Button variant="outline" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header
        className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md px-4 sm:px-8 py-3.5"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.875rem)" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 rounded-xl cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold font-serif text-foreground truncate flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary shrink-0" />
                {data.isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard"}
              </h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                {data.isSuperAdmin
                  ? "Full control — system overview and user management"
                  : "System overview — read-only access"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ModeToggle />
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs h-8 sm:h-9 px-3 sm:px-4 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <span className="hidden xs:inline">Back to </span>Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-200 pb-16">
        {/* ── Stats Cards ── */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <StatCard icon={Users} label="Total Users" value={data.stats.totalUsers} color="bg-primary/10 text-primary border-primary/20" />
          <StatCard icon={Activity} label="Active Today" value={data.stats.activeToday} color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" />
          <StatCard icon={Mail} label="Gmail Connected" value={data.stats.gmailConnected} color="bg-red-500/10 text-red-500 border-red-500/20" />
          <StatCard icon={Calendar} label="Calendar Connected" value={data.stats.calendarConnected} color="bg-blue-500/10 text-blue-500 border-blue-500/20" />
          <StatCard icon={ShieldCheck} label="Admins" value={data.stats.totalAdmins} color="bg-red-500/10 text-red-500 border-red-500/20" />
          <StatCard icon={Users} label="Clients" value={data.stats.totalClients} color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20" />
        </section>

        {/* ── Filters ── */}
        <section className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
          </select>
          <select
            value={authFilter}
            onChange={(e) => setAuthFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Auth Methods</option>
            <option value="google">Google</option>
            <option value="github">GitHub</option>
            <option value="credential">Email/Password</option>
          </select>
          <select
            value={integrationFilter}
            onChange={(e) => setIntegrationFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Integrations</option>
            <option value="gmail">Gmail Connected</option>
            <option value="calendar">Calendar Connected</option>
            <option value="both">Both Connected</option>
            <option value="none">No Integrations</option>
          </select>
        </section>

        {/* ── User Table ── */}
        <section className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <div className="px-4 sm:px-5 py-3.5 border-b border-border/60 flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Users ({filteredUsers.length})
            </h2>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th
                    className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("name")}
                  >
                    User <SortIcon field="name" />
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Auth
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Gmail
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Calendar
                  </th>
                  <th
                    className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("role")}
                  >
                    Role <SortIcon field="role" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("createdAt")}
                  >
                    Joined <SortIcon field="createdAt" />
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("lastActive")}
                  >
                    Last Active (IST) <SortIcon field="lastActive" />
                  </th>
                  {data.isSuperAdmin && (
                    <th className="text-center px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border/40 last:border-b-0 hover:bg-muted/20 transition-colors"
                  >
                    {/* User */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-8 w-8 rounded-xl border border-border object-cover shrink-0"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center text-xs font-bold shrink-0">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Auth */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {user.authMethods.length > 0 ? (
                          user.authMethods.map((method) => {
                            const badge = getAuthBadge(method);
                            return (
                              <span
                                key={method}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                              >
                                {badge.label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    {/* Gmail */}
                    <td className="px-4 py-3.5 text-center">
                      {user.hasGmail ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                    {/* Calendar */}
                    <td className="px-4 py-3.5 text-center">
                      {user.hasCalendar ? (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-500">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      )}
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3.5 text-center">
                      <RoleBadge role={user.role} />
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatIST(user.createdAt)}
                    </td>
                    {/* Last Active */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-foreground whitespace-nowrap">
                          {relativeTime(user.lastActive)}
                        </span>
                        {user.lastActive && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatIST(user.lastActive)}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Actions (Super Admin only) */}
                    {data.isSuperAdmin && (
                      <td className="px-4 py-3.5 text-center">
                        <RoleAction
                          user={user}
                          isSuperAdmin={data.isSuperAdmin}
                          onRoleChange={handleRoleChange}
                          changingUserId={changingUserId}
                        />
                      </td>
                    )}
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={data.isSuperAdmin ? 8 : 7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      No users found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border/40">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                {/* User header */}
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="h-10 w-10 rounded-xl border border-border object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center text-sm font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <RoleBadge role={user.role} />
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  {user.authMethods.map((method) => {
                    const badge = getAuthBadge(method);
                    return (
                      <span
                        key={method}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    );
                  })}
                  {user.hasGmail && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Gmail ✓
                    </span>
                  )}
                  {user.hasCalendar && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-blue-500/10 text-blue-500 border-blue-500/20">
                      Calendar ✓
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-muted/30 rounded-lg py-1.5 px-2">
                    <p className="text-[10px] font-medium text-foreground">{formatIST(user.createdAt).split(",")[0]}</p>
                    <p className="text-[10px] text-muted-foreground">Joined</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg py-1.5 px-2">
                    <p className="text-[10px] font-medium text-foreground">{relativeTime(user.lastActive)}</p>
                    <p className="text-[10px] text-muted-foreground">Active</p>
                  </div>
                </div>

                {/* Role action for mobile (Super Admin only) */}
                {data.isSuperAdmin && user.role !== "super_admin" && (
                  <div className="pt-1">
                    <RoleAction
                      user={user}
                      isSuperAdmin={data.isSuperAdmin}
                      onRoleChange={handleRoleChange}
                      changingUserId={changingUserId}
                    />
                  </div>
                )}
              </div>
            ))}
            {filteredUsers.length === 0 && (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                No users found matching your filters.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
