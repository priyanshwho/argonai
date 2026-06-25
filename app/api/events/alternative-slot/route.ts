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
    const duration = proposedEnd.getTime() - proposedStart.getTime();

    if (isNaN(proposedStart.getTime()) || isNaN(proposedEnd.getTime()) || duration <= 0) {
      return NextResponse.json({ error: 'Invalid dates/times provided' }, { status: 400 });
    }

    const searchStart = new Date(proposedStart);
    const searchEnd = new Date(searchStart.getTime() + 7 * 24 * 60 * 60 * 1000); // Check next 7 days

    const eventsList: Array<{ start: Date; end: Date }> = [];

    // 1. Fetch calendar events from local cache
    const dbEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        startTime: { lt: searchEnd },
        endTime: { gt: searchStart },
      },
    });

    for (const e of dbEvents) {
      eventsList.push({ start: e.startTime, end: e.endTime });
    }

    // 2. Fetch from Google Calendar API
    try {
      const tenantClient = corsair.withTenant(session.user.id);
      const apiResponse = await tenantClient.googlecalendar.api.events.getMany({
        calendarId: 'primary',
        timeMin: searchStart.toISOString(),
        timeMax: searchEnd.toISOString(),
        singleEvents: true,
      });

      const apiEvents = apiResponse.items || [];
      for (const item of apiEvents) {
        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;
        if (startStr && endStr) {
          eventsList.push({ start: new Date(startStr), end: new Date(endStr) });
        }
      }
    } catch (apiErr) {
      console.warn('Google Calendar API fetch for alternative slots failed:', apiErr);
    }

    // Sort events chronologically to speed up checks
    eventsList.sort((a, b) => a.start.getTime() - b.start.getTime());

    // 3. Find the next free slot
    // We search by advancing in 30-minute intervals starting from the proposed start
    let candidateStart = new Date(proposedStart.getTime());
    let alternativeSlot = null;

    // Limit candidate checks to avoid infinite loops (max 336 steps = 7 days of 30-min slots)
    for (let i = 0; i < 336; i++) {
      // Advance by 30 mins (skip the first iteration which is the conflicted proposed time)
      if (i > 0) {
        candidateStart = new Date(candidateStart.getTime() + 30 * 60 * 1000);
      }

      const candidateEnd = new Date(candidateStart.getTime() + duration);

      // Check if candidate overlaps with any known event
      let hasOverlap = false;
      for (const event of eventsList) {
        if (candidateStart < event.end && candidateEnd > event.start) {
          hasOverlap = true;
          break;
        }
      }

      if (!hasOverlap) {
        alternativeSlot = {
          startTime: candidateStart.toISOString(),
          endTime: candidateEnd.toISOString(),
        };
        break;
      }
    }

    if (alternativeSlot) {
      return NextResponse.json({ success: true, alternativeSlot });
    } else {
      return NextResponse.json({ error: 'No alternative slots found in the next 7 days' }, { status: 404 });
    }
  } catch (err: any) {
    console.error('Failed to find alternative slot:', err);
    return NextResponse.json({ error: err.message || 'Failed to find alternative slot' }, { status: 500 });
  }
}
