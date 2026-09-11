import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WorkspaceClient } from "../workspace-client";
import { SIGN_IN_PATH } from "@/features/auth/utils";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    chatId?: string[];
  }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const resolvedParams = await params;
  const chatIdParam = resolvedParams.chatId?.[0];

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect(SIGN_IN_PATH);
  }

  // Query connected integrations for the current user (using session.user.id as tenantId)
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId: session.user.id },
    include: { integration: true },
  });

  const hasGmail = accounts.some((a) => a.integration.name === "gmail");
  const hasCalendar = accounts.some((a) => a.integration.name === "googlecalendar");

  // Fetch past conversations and messages to ensure persistence
  const dbConversations = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  const initialConversations = dbConversations.map((c) => ({
    id: c.id,
    title: c.title,
    messages: c.messages.map((m) => {
      let content = m.content;
      let toolInvocations: any[] = [];
      let parts: any[] = [];
      
      if (m.content.startsWith('{') || m.content.startsWith('[')) {
        try {
          const parsed = JSON.parse(m.content);
          if (parsed && typeof parsed === 'object') {
            content = parsed.text !== undefined ? parsed.text : (parsed.content || '');
            toolInvocations = parsed.toolInvocations || [];
            parts = parsed.parts || [];
          }
        } catch (e) {
          // Fallback to raw string content
        }
      }
      
      return {
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content,
        ...(toolInvocations.length > 0 ? { toolInvocations } : {}),
        ...(parts.length > 0 ? { parts } : {}),
      };
    }),
  }));

  // Handle route param redirects to keep the URL matching the active chat
  // When no chat ID is provided (e.g. after login), always start a fresh new chat
  if (!chatIdParam || chatIdParam === "new") {
    redirect(`/dashboard/chat-${Date.now()}`);
  }

  // Check if user has admin access (Super Admin by env var OR admin/super_admin role in DB)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const userRole = dbUser?.role || "client";
  const isSuperAdminByEmail = !!process.env.ADMIN_EMAIL && session.user.email === process.env.ADMIN_EMAIL;
  const hasAdminAccess = isSuperAdminByEmail || userRole === "admin" || userRole === "super_admin";

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-10 w-10 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
          <span className="text-sm text-muted-foreground font-medium">Loading workspace...</span>
        </div>
      </div>
    }>
      <WorkspaceClient
        userId={session.user.id}
        userEmail={session.user.email}
        userName={session.user.name}
        userImage={session.user.image}
        initialHasGmail={hasGmail}
        initialHasCalendar={hasCalendar}
        initialConversations={initialConversations}
        activeChatIdParam={chatIdParam}
        isAdmin={hasAdminAccess}
      />
    </Suspense>
  );
}
