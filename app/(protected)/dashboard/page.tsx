import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { WorkspaceClient } from "./workspace-client";
import { SIGN_IN_PATH } from "@/features/auth/utils";

export default async function DashboardPage() {
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
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
  }));

  return (
    <WorkspaceClient
      userId={session.user.id}
      userEmail={session.user.email}
      userName={session.user.name}
      userImage={session.user.image}
      initialHasGmail={hasGmail}
      initialHasCalendar={hasCalendar}
      initialConversations={initialConversations}
    />
  );
}

