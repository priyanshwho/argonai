import { streamText, stepCountIs } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { getCorsairAiTools } from '@/lib/ai-tools';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

function getMessageText(message: any): string {
  if (typeof message.content === 'string' && message.content) {
    return message.content;
  }
  if (Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('');
  }
  return message.content || '';
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messages, conversationId } = await req.json();

  // Ensure conversation exists and save the user message to keep database in sync
  if (conversationId && messages && messages.length > 0) {
    try {
      let conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            id: conversationId,
            userId: session.user.id,
            title: getMessageText(messages[0]).slice(0, 50) || 'New Conversation',
          },
        });
      }

      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        await prisma.message.create({
          data: {
            conversationId,
            role: 'user',
            content: getMessageText(lastMessage),
          },
        });
      }
    } catch (err) {
      console.error('Failed to sync conversation/message to database:', err);
    }
  }

  const aiTools = getCorsairAiTools(session.user.id);
  const coreMessages = (messages || []).map((m: any) => ({
    role: m.role,
    content: getMessageText(m),
  }));

  const model = await getGoogleModel();

  const result = streamText({
    model,
    system: `You are Atria, an AI-powered workspace assistant.
You manage the user's Gmail and Google Calendar.
You can read their emails, draft responses, find calendar availability, and schedule meetings.
Be concise, helpful, and professional.

To fetch and modify emails and calendar events, you MUST use the "run_script" tool.
The "run_script" tool takes a JavaScript code string to execute.
The "corsair" client variable is ALREADY in scope and pre-scoped to the user's tenant (do not call .withTenant).

## DATA FETCHING STRATEGY — CRITICAL RULE

Always follow this two-step pattern when reading data:

STEP 1 — Try the local cache first (.db). It is fast and avoids Google rate limits.
STEP 2 — Fall back to the live API (.api) in any of the following scenarios:
  a) The local .db query returns an empty list [].
  b) The user is requesting a total count/number of messages/events in their inbox/calendar (the local cache only holds recent/synced messages; the live API contains the true inbox count).
  c) The user asks to see/check a specific item index or range (e.g. "my 35th email", "emails from last month") that exceeds the size of the cached local list (if the cache has 31 items, you must query .api with maxResults set higher, e.g., 50 or 100, to check older emails).

Never tell the user their inbox or calendar is empty or that they only have N items based solely on the .db result if they are asking for more. Always query the live API (.api) first.

Example fallback pattern:
  let messages = await corsair.gmail.db.messages.list({});
  // Fall back if cache is cold, or if user requests more messages than the cache length
  if (!messages || messages.length < 40) {
    messages = await corsair.gmail.api.messages.list({ userId: 'me', maxResults: 50 });
  }
  return messages;

## OPERATIONS GUIDE

1. List Gmail messages (DB-first, API fallback):
   let messages = await corsair.gmail.db.messages.list({});
   if (!messages || messages.length === 0) {
     messages = await corsair.gmail.api.messages.list({ userId: 'me', maxResults: 20 });
   }
   return messages;
   // Each message data has: { id, data: { snippet, payload: { headers: [{name, value}] }, internalDate } }

2. Search Gmail messages (DB-first, API fallback):
   let messages = await corsair.gmail.db.messages.search({ data: { snippet: { contains: "searchTerm" } } });
   if (!messages || messages.length === 0) {
     messages = await corsair.gmail.api.messages.list({ userId: 'me', q: 'searchTerm', maxResults: 20 });
   }
   return messages;

3. List Calendar events (DB-first, API fallback):
   let events = await corsair.googlecalendar.db.events.list({});
   if (!events || events.length === 0) {
     events = await corsair.googlecalendar.api.events.getMany({ calendarId: 'primary', maxResults: 20 });
   }
   return events;

4. Create Calendar event (live API only — writes always go to .api):
   const result = await corsair.googlecalendar.api.events.create({
     event: {
       summary: "Meeting Title",
       start: { dateTime: new Date("2026-06-19T10:00:00").toISOString(), timeZone: "Asia/Kolkata" },
       end: { dateTime: new Date("2026-06-19T11:00:00").toISOString(), timeZone: "Asia/Kolkata" },
       attendees: [{ email: "guest@example.com" }]
     }
   });
   return result;

5. Send Email (live API only — writes always go to .api):
   const emailLines = [
     "To: recipient@example.com",
     "Subject: Email Subject Line",
     "",
     "Email message body content."
   ];
   const emailContent = emailLines.join("\\r\\n");
   const base64Safe = Buffer.from(emailContent).toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
   const result = await corsair.gmail.api.messages.send({ raw: base64Safe });
   return result;

Always write return statements inside your "run_script" code.`,
    messages: coreMessages,
    tools: aiTools,
    stopWhen: stepCountIs(10),
    async onFinish({ text }) {
      if (conversationId && text) {
        try {
          await prisma.message.create({
            data: {
              conversationId,
              role: 'assistant',
              content: text,
            }
          });
        } catch (err) {
          console.error('Failed to save assistant message to database:', err);
        }
      }
    }
  });

  return result.toUIMessageStreamResponse();
}


