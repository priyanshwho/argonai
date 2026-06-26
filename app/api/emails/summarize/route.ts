import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { corsair } from '@/lib/corsair';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';

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

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { gmailId } = await req.json();

    if (!gmailId) {
      return NextResponse.json({ error: 'Missing gmailId' }, { status: 400 });
    }

    let subject = 'No Subject';
    let sender = 'Unknown';
    let receivedAt = 'Unknown date';
    let bodyText = '';
    let snippet = '';

    // Try to find in DB cache — match by entityId (Gmail message ID) OR internal Prisma id
    const entity = await prisma.corsairEntity.findFirst({
      where: {
        OR: [
          { entityId: gmailId, account: { tenantId: session.user.id } },
          { id: gmailId, account: { tenantId: session.user.id } },
        ],
      },
    });

    if (entity) {
      const data = entity.data as any || {};
      const headersList = data.payload?.headers || [];
      subject = headersList.find((h: any) => h.name.toLowerCase() === 'subject')?.value || data.subject || 'No Subject';
      sender = headersList.find((h: any) => h.name.toLowerCase() === 'from')?.value || data.from || 'Unknown';
      const receivedAtMs = parseInt(data.internalDate);
      receivedAt = isNaN(receivedAtMs) ? 'Unknown date' : new Date(receivedAtMs).toLocaleString();
      bodyText = getEmailBody(data);
      snippet = data.snippet || '';
    } else {
      // Fallback: fetch directly from Gmail live API using entityId as the Gmail message ID
      try {
        const tenantClient = corsair.withTenant(session.user.id);
        const msg = await tenantClient.gmail.api.messages.get({ userId: 'me', id: gmailId });
        if (msg) {
          const headersList = msg.payload?.headers || [];
          subject = headersList.find((h: any) => h.name.toLowerCase() === 'subject')?.value || 'No Subject';
          sender = headersList.find((h: any) => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          const receivedAtMs = parseInt(msg.internalDate || '0');
          receivedAt = isNaN(receivedAtMs) ? 'Unknown date' : new Date(receivedAtMs).toLocaleString();
          bodyText = getEmailBody(msg);
          snippet = msg.snippet || '';
        }
      } catch (liveErr) {
        console.warn('Gmail live API fallback failed for summarize:', liveErr);
        return NextResponse.json({ error: 'Email not found' }, { status: 404 });
      }
    }

    const emailContext = `Subject: ${subject}\nSender: ${sender}\nDate: ${receivedAt}\nSnippet: ${snippet}\nBody:\n${bodyText}`.trim();

    const model = await getGoogleModel();

    const result = await generateText({
      model,
      system: 'You are an email summarization assistant. Generate a brief, clear, bulleted summary of the provided email content. Focus on actionable tasks, requests, and critical details. Keep it under 150 words.',
      prompt: emailContext,
    });

    return NextResponse.json({ summary: result.text });
  } catch (err) {
    console.error('Failed to summarize email:', err);
    return NextResponse.json({ error: 'Failed to summarize email' }, { status: 500 });
  }
}
