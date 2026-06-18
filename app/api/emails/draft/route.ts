import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { googleModel } from '@/lib/ai';

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
    const { gmailId, instructions } = await req.json();

    if (!gmailId) {
      return NextResponse.json({ error: 'Missing gmailId' }, { status: 400 });
    }

    // Look up entity directly from corsair_entities — avoids dependency on gmailCache table
    const entity = await prisma.corsairEntity.findFirst({
      where: {
        entityId: gmailId,
        account: {
          tenantId: session.user.id,
        },
      },
    });

    if (!entity) {
      return NextResponse.json({ error: 'Email not found in cache' }, { status: 404 });
    }

    const data = entity.data as any || {};
    const headersList = data.payload?.headers || [];
    const subject = headersList.find((h: any) => h.name.toLowerCase() === 'subject')?.value || data.subject || 'No Subject';
    const sender = headersList.find((h: any) => h.name.toLowerCase() === 'from')?.value || data.from || 'Unknown';
    const bodyText = getEmailBody(data);

    const emailContext = `From: ${sender}\nSubject: ${subject}\nSnippet: ${data.snippet || ''}\nBody:\n${bodyText}`.trim();

    const result = await generateText({
      model: googleModel,
      system: 'You are an email drafting assistant. Draft a professional, contextual reply to the provided email. Adhere to any special instructions provided. Write only the email reply text body, without template fields or subject lines.',
      prompt: `Email received:\n${emailContext}\n\nDrafting instructions: ${instructions || 'Write a polite, professional reply.'}`,
    });

    return NextResponse.json({ draft: result.text });
  } catch (err) {
    console.error('Failed to generate draft:', err);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}

