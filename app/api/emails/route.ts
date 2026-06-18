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
    const messages = await corsair.withTenant(session.user.id).gmail.db.messages.list({});
    
    // Map CorsairEntity database format into EmailItem representation
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
    }).sort((a: any, b: any) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return NextResponse.json({ emails: formattedEmails });
  } catch (err) {
    console.error('Failed to retrieve emails via Corsair DB:', err);
    return NextResponse.json({ emails: [] }, { status: 500 });
  }
}
