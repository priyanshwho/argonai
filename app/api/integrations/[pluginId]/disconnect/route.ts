import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { pluginId } = await params;
  const userId = session.user.id;

  try {
    // 1. Find the user's account for this plugin
    const accounts = await prisma.corsairAccount.findMany({
      where: { tenantId: userId },
      include: { integration: true },
    });

    const account = accounts.find((a) => a.integration.name === pluginId);

    if (!account) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // 2. Best-effort: revoke the Google OAuth token upstream
    const config = account.config as Record<string, unknown>;
    const accessToken = config?.access_token as string | undefined;

    if (accessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
      } catch {
        // Token may already be expired/revoked — ignore
        console.warn(`Failed to revoke upstream token for ${pluginId}, continuing cleanup.`);
      }
    }

    // 3. Delete the CorsairAccount (cascades to CorsairEntity + CorsairEvent)
    await prisma.corsairAccount.delete({
      where: { id: account.id },
    });

    // 4. Clear local cached data
    if (pluginId === 'gmail') {
      await prisma.gmailCache.deleteMany({
        where: { userId },
      });
    } else if (pluginId === 'googlecalendar') {
      await prisma.calendarEvent.deleteMany({
        where: { userId },
      });
    }

    console.info(`Successfully disconnected ${pluginId} for user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(`Failed to disconnect ${pluginId}:`, err);
    return NextResponse.json(
      { error: 'Failed to disconnect integration' },
      { status: 500 }
    );
  }
}
