import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { corsair } from '@/lib/corsair';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { startTime, endTime } = await req.json();

    if (!startTime || !endTime) {
      return NextResponse.json({ error: 'Missing startTime or endTime' }, { status: 400 });
    }

    const proposedStart = new Date(startTime);
    const proposedEnd = new Date(endTime);

    if (isNaN(proposedStart.getTime()) || isNaN(proposedEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid dates provided' }, { status: 400 });
    }

    // 1. Query the local cache database first
    const localConflicts = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        startTime: { lt: proposedEnd },
        endTime: { gt: proposedStart },
      },
    });

    const conflictsMap = new Map<string, { title: string; startTime: string; endTime: string }>();

    for (const event of localConflicts) {
      conflictsMap.set(event.eventId, {
        title: event.title,
        startTime: event.startTime.toISOString(),
        endTime: event.endTime.toISOString(),
      });
    }

    // 2. Query Google Calendar Live API to ensure fresh data
    try {
      const tenantClient = corsair.withTenant(session.user.id);
      const apiResponse = await tenantClient.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        timeMin: proposedStart.toISOString(),
        timeMax: proposedEnd.toISOString(),
        singleEvents: true,
      });

      const apiEvents = apiResponse.items || [];
      for (const item of apiEvents) {
        // Overlap logic: item.start.dateTime and item.end.dateTime
        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;
        if (startStr && endStr) {
          const itemStart = new Date(startStr);
          const itemEnd = new Date(endStr);
          if (itemStart < proposedEnd && itemEnd > proposedStart) {
            conflictsMap.set(item.id || Math.random().toString(), {
              title: item.summary || 'Busy',
              startTime: itemStart.toISOString(),
              endTime: itemEnd.toISOString(),
            });
          }
        }
      }
    } catch (apiErr) {
      console.warn('Google Calendar API conflict check failed (falling back on cache):', apiErr);
    }

    const conflicts = Array.from(conflictsMap.values());

    return NextResponse.json({
      hasConflict: conflicts.length > 0,
      conflicts,
    });
  } catch (err: any) {
    console.error('Failed checking conflicts:', err);
    return NextResponse.json({ error: err.message || 'Failed checking conflicts' }, { status: 500 });
  }
}
