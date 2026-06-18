import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Query direct cache from Corsair DB client
    const rawEvents = await corsair.withTenant(session.user.id).googlecalendar.db.events.list({});
    
    // Map CorsairEntity database format into CalendarItem representation
    const formattedEvents = (rawEvents || []).map((evt: any) => {
      const data = evt.data || {};
      const startStr = data.start?.dateTime || data.start?.date;
      const endStr = data.end?.dateTime || data.end?.date;
      const startTime = startStr ? new Date(startStr).toISOString() : new Date().toISOString();
      const endTime = endStr ? new Date(endStr).toISOString() : new Date().toISOString();
      const attendees = (data.attendees || [])
        .map((a: any) => a.email)
        .filter(Boolean);

      return {
        id: evt.id,
        eventId: evt.entityId,
        title: data.summary || "No Title",
        startTime,
        endTime,
        attendees,
      };
    }).sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json({ events: formattedEvents });
  } catch (err) {
    console.error('Failed to retrieve calendar events via Corsair DB:', err);
    return NextResponse.json({ events: [] }, { status: 500 });
  }
}
