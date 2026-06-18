import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { corsair } from '@/lib/corsair';
import { prisma } from '@/lib/db';
import crypto from 'node:crypto';

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

function mapMessageToEmail(msg: any) {
  const data = msg.data || {};
  const headersList = data.payload?.headers || [];
  const subject = headersList.find((h: any) => h.name.toLowerCase() === 'subject')?.value || data.subject || null;
  const sender = headersList.find((h: any) => h.name.toLowerCase() === 'from')?.value || data.from || null;

  // Return null for stub entries with no usable data
  if (!subject && !sender && !data.snippet) return null;

  const receivedAtMs = parseInt(data.internalDate);
  const receivedAt = isNaN(receivedAtMs) ? new Date().toISOString() : new Date(receivedAtMs).toISOString();

  return {
    id: msg.id,
    gmailId: msg.entityId || msg.id,
    threadId: data.threadId || '',
    subject: subject || 'No Subject',
    sender: sender || 'Unknown Sender',
    snippet: decodeHtmlEntities(data.snippet || ''),
    body: decodeHtmlEntities(getEmailBody(data)),
    receivedAt,
  };
}

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const tenantClient = corsair.withTenant(session.user.id);

    // Step 1: Try DB cache first
    let messages = await tenantClient.gmail.db.messages.list({});

    // Step 2: Map and filter out stub entries with no data
    let formattedEmails = (messages || [])
      .map(mapMessageToEmail)
      .filter(Boolean) as any[];

    // Step 3: If DB is empty or all entries were stubs, fall back to live API
    if (formattedEmails.length === 0) {
      console.info('Gmail DB cache empty or all stubs — falling back to live API');
      const apiResponse = await tenantClient.gmail.api.messages.list({
        userId: 'me',
        maxResults: 10, // Fetch fewer if we have to do N+1 API calls
        labelIds: ['INBOX'],
      });

      const rawMessages = apiResponse.messages || [];
      
      // Fetch the full message data for each stub ID
      const fullMessages = await Promise.all(
        rawMessages.map((msg: any) => 
          tenantClient.gmail.api.messages.get({
            userId: 'me',
            id: msg.id,
          }).catch(() => null)
        )
      );

      formattedEmails = fullMessages
        .filter(Boolean)
        .map((msg: any) => mapMessageToEmail({ ...msg, entityId: msg.id, data: msg }))
        .filter(Boolean) as any[];

      // Cache the full messages in the database for instant subsequent loads
      const corsairAccount = await prisma.corsairAccount.findFirst({
        where: {
          tenantId: session.user.id,
          integrationId: 'gmail',
        },
      });

      if (corsairAccount) {
        // Run cache writes concurrently in background (no await to avoid slowing down current request)
        Promise.all(
          fullMessages.filter(Boolean).map(async (msg: any) => {
            try {
              const existing = await prisma.corsairEntity.findFirst({
                where: {
                  accountId: corsairAccount.id,
                  entityId: msg.id,
                },
              });

              if (existing) {
                await prisma.corsairEntity.update({
                  where: { id: existing.id },
                  data: {
                    version: String(Date.now()),
                    data: msg,
                  },
                });
              } else {
                await prisma.corsairEntity.create({
                  data: {
                    id: crypto.randomUUID(),
                    accountId: corsairAccount.id,
                    entityId: msg.id,
                    entityType: 'messages',
                    version: String(Date.now()),
                    data: msg,
                  },
                });
              }
            } catch (cacheErr) {
              console.error(`Failed to cache message ${msg.id}:`, cacheErr);
            }
          })
        ).catch(err => {
          console.error('Failed to run batch Gmail cache write:', err);
        });
      }
    }

    formattedEmails.sort((a: any, b: any) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );

    return NextResponse.json({ emails: formattedEmails });
  } catch (err) {
    console.error('Failed to retrieve emails via Corsair:', err);
    return NextResponse.json({ emails: [] }, { status: 500 });
  }
}
