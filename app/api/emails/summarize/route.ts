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
    const { gmailId } = await req.json();

    if (!gmailId) {
      return NextResponse.json({ error: 'Missing gmailId' }, { status: 400 });
    }

    // Retrieve email content from cache
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
Subject: ${cacheRecord.subject}
Sender: ${cacheRecord.sender}
Date: ${cacheRecord.receivedAt}
Snippet: ${cacheRecord.snippet}
Body:
${bodyText}
    `.trim();

    const result = await generateText({
      model: googleModel,
      system: 'You are an email summarization assistant. Generate a brief, clear, bulleted summary of the provided email content. Focus on actionable tasks, requests, and critical details. Keep it under 150 words.',
      prompt: emailContext,
    });

    return NextResponse.json({ summary: result.text });
  } catch (err) {
    console.error('Failed to summarize email:', err);
    return NextResponse.json({ error: 'Failed to summarize email' }, { status: 500 });
  }
}
