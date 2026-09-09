import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const { isAdmin: admin, session } = await isAdmin();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Fetch all users with their accounts, latest session, conversations, messages counts
    const users = await prisma.user.findMany({
      include: {
        accounts: {
          select: {
            providerId: true,
            createdAt: true,
          },
        },
        sessions: {
          select: {
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
        conversations: {
          select: {
            id: true,
            _count: {
              select: { messages: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Corsair integration data for all users
    const corsairAccounts = await prisma.corsairAccount.findMany({
      include: { integration: true },
    });

    // Build a map: tenantId -> { hasGmail, hasCalendar }
    const integrationMap = new Map<string, { hasGmail: boolean; hasCalendar: boolean }>();
    for (const ca of corsairAccounts) {
      const existing = integrationMap.get(ca.tenantId) || { hasGmail: false, hasCalendar: false };
      const config = ca.config as Record<string, unknown>;
      if (ca.integration.name === "gmail" && !!config?.access_token) {
        existing.hasGmail = true;
      }
      if (ca.integration.name === "googlecalendar" && !!config?.access_token) {
        existing.hasCalendar = true;
      }
      integrationMap.set(ca.tenantId, existing);
    }

    // Format response
    const formattedUsers = users.map((user) => {
      const authMethods = user.accounts.map((a) => a.providerId);
      const lastSession = user.sessions[0];
      const conversationCount = user.conversations.length;
      const messageCount = user.conversations.reduce(
        (sum, c) => sum + c._count.messages,
        0
      );
      const integrations = integrationMap.get(user.id) || {
        hasGmail: false,
        hasCalendar: false,
      };

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        emailVerified: user.emailVerified,
        authMethods,
        hasGmail: integrations.hasGmail,
        hasCalendar: integrations.hasCalendar,
        conversationCount,
        messageCount,
        createdAt: user.createdAt.toISOString(),
        lastActive: lastSession?.updatedAt?.toISOString() || null,
      };
    });

    // Compute summary stats
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const totalUsers = formattedUsers.length;
    const activeToday = formattedUsers.filter(
      (u) => u.lastActive && new Date(u.lastActive) > twentyFourHoursAgo
    ).length;
    const gmailConnected = formattedUsers.filter((u) => u.hasGmail).length;
    const calendarConnected = formattedUsers.filter((u) => u.hasCalendar).length;
    const totalConversations = formattedUsers.reduce(
      (sum, u) => sum + u.conversationCount,
      0
    );
    const totalMessages = formattedUsers.reduce(
      (sum, u) => sum + u.messageCount,
      0
    );

    // Signup trend (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const signupTrend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = day.toISOString().split("T")[0];
      const count = formattedUsers.filter(
        (u) => u.createdAt.split("T")[0] === dayStr
      ).length;
      signupTrend.push({ date: dayStr, count });
    }

    return NextResponse.json({
      stats: {
        totalUsers,
        activeToday,
        gmailConnected,
        calendarConnected,
        totalConversations,
        totalMessages,
      },
      signupTrend,
      users: formattedUsers,
    });
  } catch (err) {
    console.error("Admin API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin data" },
      { status: 500 }
    );
  }
}
