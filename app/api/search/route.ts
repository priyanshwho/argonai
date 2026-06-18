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

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';

  if (!query) {
    return NextResponse.json({ emails: [], events: [] });
  }

  try {
    // 1. Fetch raw cache data from Corsair DB
    const [messages, rawEvents] = await Promise.all([
      corsair.withTenant(session.user.id).gmail.db.messages.list({}),
      corsair.withTenant(session.user.id).googlecalendar.db.events.list({}),
    ]);

    // 2. Map & Filter Gmail messages in-memory
    const lowercaseQuery = query.toLowerCase();
    const formattedEmails = (messages || []).map((msg: any) => {
      const data = msg.data || {};
      const headersList = data.payload?.headers || [];
      const subject = headersList.find((h: any) => h.name.toLowerCase() === "subject")?.value || "No Subject";
      const sender = headersList.find((h: any) => h.name.toLowerCase() === "from")?.value || "Unknown Sender";
      
      const receivedAtMs = parseInt(data.internalDate);
      const receivedAt = isNaN(receivedAtMs) ? new Date().toISOString() : new Date(receivedAtMs).toISOString();

      return {
        id: msg.id,
        gmailId: msg.entityId,
        threadId: data.threadId || "",
        subject,
        sender,
        snippet: data.snippet || "",
        receivedAt,
      };
    });

    const matchedEmails = formattedEmails
      .filter((email: any) => 
        email.subject.toLowerCase().includes(lowercaseQuery) ||
        email.sender.toLowerCase().includes(lowercaseQuery) ||
        email.snippet.toLowerCase().includes(lowercaseQuery)
      )
      .sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, 15);

    // 3. Map & Filter Google Calendar events in-memory
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
    });

    const matchedEvents = formattedEvents
      .filter((event: any) => {
        const titleMatch = event.title.toLowerCase().includes(lowercaseQuery);
        const attendeeMatch = event.attendees.some((email: string) => 
          email.toLowerCase().includes(lowercaseQuery)
        );
        return titleMatch || attendeeMatch;
      })
      .sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 15);

    return NextResponse.json({ emails: matchedEmails, events: matchedEvents });
  } catch (err) {
    console.error('Failed to run unified search:', err);
    return NextResponse.json({ emails: [], events: [] }, { status: 500 });
  }
}

