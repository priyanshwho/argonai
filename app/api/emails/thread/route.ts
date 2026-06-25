import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
}

function getEmailBody(messageData: any): string {
  if (!messageData) return '';
  const snippet = messageData.snippet || '';
  
  let body = '';
  const payload = messageData.payload;
  if (payload) {
    if (payload.body && payload.body.data) {
      try {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      } catch {}
    } else if (payload.parts) {
      const findTextPart = (parts: any[]): string => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            try {
              return Buffer.from(part.body.data, 'base64').toString('utf-8');
            } catch {}
          }
          if (part.parts) {
            const bodyStr = findTextPart(part.parts);
            if (bodyStr) return bodyStr;
          }
        }
        return '';
      };
      body = findTextPart(payload.parts);
    }
  }
  return body || snippet;
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(req.url);
  const threadId = url.searchParams.get('threadId');

  if (!threadId) {
    return NextResponse.json({ error: 'Missing threadId' }, { status: 400 });
  }

  try {
    const tenantClient = corsair.withTenant(session.user.id);
    const apiResponse = await tenantClient.gmail.api.threads.get({
      userId: 'me',
      id: threadId,
    });

    const messages = apiResponse.messages || [];
    const formattedMessages = messages.map((msg: any) => {
      const headersList = msg.payload?.headers || [];
      const sender = headersList.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender';
      const body = decodeHtmlEntities(getEmailBody(msg));
      
      const internalDateMs = parseInt(msg.internalDate);
      const dateStr = isNaN(internalDateMs) ? new Date().toISOString() : new Date(internalDateMs).toISOString();

      return {
        id: msg.id,
        sender,
        body,
        date: dateStr,
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (err: any) {
    console.error('Failed to retrieve thread details:', err);
    return NextResponse.json({ error: err.message || 'Failed to retrieve thread' }, { status: 500 });
  }
}
