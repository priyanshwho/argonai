import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { UNSLOP_PROMPT, cleanPunctuationAndFormatting } from '@/lib/unslop';

function parseNameFromSender(sender: string): string {
  if (!sender) return '';
  // Match "Name <email>"
  const match = sender.match(/^([^<]+)/);
  if (match) {
    const name = match[1].replace(/['"]/g, '').trim();
    if (name && !name.includes('@')) {
      return name;
    }
  }
  // If only email, return username part
  const emailMatch = sender.match(/([^@\s<>]+)@/);
  if (emailMatch) {
    return emailMatch[1];
  }
  return sender;
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

    const model = await getGoogleModel();

    const senderName = session.user.name || 'User';
    const recipientName = parseNameFromSender(sender);

    const result = await generateText({
      model,
      system: `You are an email drafting assistant. Draft a human, contextual reply to the provided email. Adhere to any special instructions.
- Output ONLY the single email reply text body. Do not write subject, options, markdown format, code fences, headers, annotations, or tips.
- Use plain text formatting only. Do not use bold tags like **, markdown headers, or other markdown punctuation.
- Automatically use "${senderName}" as the sender's name at the end of the email (do not use placeholders like [Your Name] or [User Name]).
- Automatically address the recipient as "${recipientName}". If no name can be parsed or deduced, use a pleasant greeting like "Hi," or "Hello," without brackets or placeholders. Never leave placeholders like [Recipient's Name] or [Recipient Name].
${UNSLOP_PROMPT}`,
      prompt: `Email received:\n${emailContext}\n\nDrafting instructions: ${instructions || 'Write a polite, professional reply.'}`,
    });

    const cleanDraft = cleanPunctuationAndFormatting(result.text.trim());
    return NextResponse.json({ draft: cleanDraft });
  } catch (err) {
    console.error('Failed to generate draft:', err);
    return NextResponse.json({ error: 'Failed to generate draft' }, { status: 500 });
  }
}

