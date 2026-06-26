import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { eventId, calendarId = 'primary' } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const tenantClient = corsair.withTenant(session.user.id);

    // Delete from Google Calendar
    try {
      await tenantClient.googlecalendar.api.events.delete({
        calendarId,
        id: eventId,
      });
    } catch (googleError: any) {
      console.warn("Google Calendar deletion error (may already be deleted):", googleError);
      // We log but continue, as we want to make sure it's removed from local DB anyway
    }

    // Delete from local cache
    const corsairAccount = await prisma.corsairAccount.findFirst({
      where: {
        tenantId: session.user.id,
        integrationId: 'googlecalendar',
      },
    });

    if (corsairAccount) {
      await prisma.corsairEntity.deleteMany({
        where: {
          accountId: corsairAccount.id,
          entityId: eventId,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Failed to delete calendar event:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete event' },
      { status: 500 }
    );
  }
}
