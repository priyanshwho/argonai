import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';
import { syncCalendarCache } from '@/lib/sync';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { title, startTime, endTime, attendees } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Call Corsair client under user session to create calendar event
    const result = await corsair.withTenant(session.user.id).googlecalendar.api.events.create({
      calendarId: 'primary',
      event: {
        summary: title,
        start: { dateTime: new Date(startTime).toISOString() },
        end: { dateTime: new Date(endTime).toISOString() },
        attendees: (attendees || []).map((email: string) => ({ email })),
      },
    });

    // Refresh calendar cache locally
    await syncCalendarCache(session.user.id);

    return NextResponse.json({ success: true, event: result });
  } catch (err) {
    console.error('Failed to create calendar event:', err);
    return NextResponse.json({ error: 'Failed to create calendar event' }, { status: 500 });
  }
}
