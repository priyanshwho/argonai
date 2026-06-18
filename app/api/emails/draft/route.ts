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

    const cacheRecord = await prisma.gmailCache.findUnique({
      where: { gmailId },
    });

    if (!cacheRecord) {
      return NextResponse.json({ error: 'Email cache record not found' }, { status: 404 });
    }

    const entity = await prisma.corsairEntity.findFirst({
      where: {
        entityId: gmailId,
        account: {
          tenantId: session.user.id,
        },
      },
    });

    const bodyText = getEmailBody(entity?.data);
    const emailContext = `
From: ${cacheRecord.sender}
Subject: ${cacheRecord.subject}
Snippet: ${cacheRecord.snippet}
Body:
${bodyText}
    `.trim();

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
