import { streamText, tool } from 'ai';
import { z } from 'zod';
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

function convertClientMessagesToModelMessages(messages: any[]): any[] {
  const modelMessages: any[] = [];

  for (const m of messages || []) {
    if (m.role === 'user') {
      if (Array.isArray(m.parts) && m.parts.length > 0) {
        const parts = m.parts.map((p: any) => {
          if (p.type === 'text') {
            return { type: 'text', text: p.text };
          } else if (p.type === 'file') {
            const dataBase64 = p.url.includes(',') ? p.url.split(',')[1] : p.url;
            return {
              type: 'file',
              data: dataBase64,
              mimeType: p.mediaType || 'application/octet-stream'
            };
          }
          return p;
        });
        modelMessages.push({ role: 'user', content: parts });
      } else {
        modelMessages.push({ role: 'user', content: getMessageText(m) });
      }
    } else if (m.role === 'system') {
      modelMessages.push({ role: 'system', content: getMessageText(m) });
    } else if (m.role === 'assistant') {
      const toolInvocations = m.toolInvocations || [];
      const resolvedCalls = toolInvocations.filter(
        (t: any) => t.state === 'result' || t.result !== undefined
      );

      if (resolvedCalls.length === 0) {
        modelMessages.push({ role: 'assistant', content: getMessageText(m) });
      } else {
        const assistantContent: any[] = [];
        const contentText = getMessageText(m);
        if (contentText) {
          assistantContent.push({ type: 'text', text: contentText });
        }
        
        for (const call of resolvedCalls) {
          assistantContent.push({
            type: 'tool-call',
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            args: call.args
          });
        }
        
        modelMessages.push({ role: 'assistant', content: assistantContent });
        
        const toolResults = resolvedCalls.map((t: any) => ({
          type: 'tool-result',
          toolCallId: t.toolCallId,
          toolName: t.toolName,
          result: t.result
        }));
          
        modelMessages.push({ role: 'tool', content: toolResults });
      }
    }
  }

  return modelMessages;
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
        let contentToSave = getMessageText(lastMessage);
        if (Array.isArray(lastMessage.parts) && lastMessage.parts.length > 0) {
          contentToSave = JSON.stringify({
            text: getMessageText(lastMessage),
            parts: lastMessage.parts
          });
        }
        await prisma.message.create({
          data: {
            conversationId,
            role: 'user',
            content: contentToSave,
          },
        });
      }
    } catch (err) {
      console.error('Failed to sync conversation/message to database:', err);
    }
  }

  // Check if Gmail and Google Calendar integrations are configured
  const accounts = await prisma.corsairAccount.findMany({
    where: { tenantId: session.user.id },
    include: { integration: true },
  });
  const hasGmail = accounts.some((a) => a.integration.name === "gmail");
  const hasCalendar = accounts.some((a) => a.integration.name === "googlecalendar");

  const rawAiTools = getCorsairAiTools(session.user.id);
  const aiTools = {
    ...rawAiTools,
    draft_email: tool({
      description: 'Use this tool to draft an email when the user wants to send an email or message via Gmail. This will present a draft card to the user for confirmation, editing, tone refinement, and attachment selection before sending.',
      inputSchema: z.object({
        to: z.string().describe('The email address of the recipient.'),
        subject: z.string().describe('The subject line of the email.'),
        body: z.string().describe('The body text of the email.'),
        threadId: z.string().optional().describe('The threadId if this email is a reply to an existing conversation thread.')
      }),
      execute: async (args: any) => {
        return {
          to: args.to,
          subject: args.subject,
          body: args.body,
          threadId: args.threadId || null,
          status: 'draft'
        };
      }
    }),
    draft_calendar_event: tool({
      description: 'Use this tool to draft a Google Calendar event when the user wants to schedule a meeting, event, or reminder. This will present the event details to the user for animated conflict checking and approval before scheduling.',
      inputSchema: z.object({
        title: z.string().describe('The title of the meeting or event.'),
        startTime: z.string().describe('The start date and time of the event (ISO 8601 string or simple datetime).'),
        endTime: z.string().describe('The end date and time of the event (ISO 8601 string or simple datetime).'),
        attendees: z.array(z.string()).optional().describe('List of email addresses of attendees.')
      }),
      execute: async (args: any) => {
        return {
          title: args.title,
          startTime: args.startTime,
          endTime: args.endTime,
          attendees: args.attendees || [],
          status: 'draft'
        };
      }
    })
  };

  const model = await getGoogleModel();

  const result = streamText({
    model,
    system: `You are ArgonAI, an AI-powered workspace assistant.
You manage the user's Gmail and Google Calendar.
You can read their emails, draft responses, find calendar availability, and schedule meetings.
Be concise, helpful, and professional.

CRITICAL: When the user wants to write an email, draft an email, reply to an email, or send an email, you MUST call the "draft_email" tool to present a draft card to the user. Do NOT write the email subject, recipient, or body as plain text in your chat response. You must always invoke the "draft_email" tool so that the user receives an interactive card.
When the user wants to schedule, create, or book a calendar event, you MUST call the "draft_calendar_event" tool to present the event details to the user for approval. Do NOT write the event details as plain text in your chat response. You must always invoke the "draft_calendar_event" tool to render the animated visual conflict checker card.
Do NOT execute send or event creation via "run_script". All writes must go through the user-approved "draft_email" and "draft_calendar_event" cards.

${(!hasGmail || !hasCalendar) ? `
CRITICAL: Gmail and/or Google Calendar integrations are not configured for this user.
- Gmail Connected: ${hasGmail ? 'YES' : 'NO'}
- Google Calendar Connected: ${hasCalendar ? 'YES' : 'NO'}

If the user asks "do I need to configure the gmail and calendar?" or asks about setup, or if you run into connection/missing credentials errors, you MUST reply with this exact information:
"You have to setup the Gmail and Google Calendar configuration. In the sidebar, there is a configuration button. Click on that, and there is a page having Gmail and Google Calendar to configure. Follow the steps to configure the Gmail and Google Calendar."

Do not provide manual command line setup instructions or OAuth script code. Simply direct the user to the configuration button in the sidebar.
` : `
If the user asks "do I need to configure the gmail and calendar?", you should confirm they are already configured, but if they ever ask how to configure them or need to re-configure, direct them by replying:
"You have to setup the Gmail and Google Calendar configuration. In the sidebar, there is a configuration button. Click on that, and there is a page having Gmail and Google Calendar to configure. Follow the steps to configure the Gmail and Google Calendar."
`}

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
    messages: convertClientMessagesToModelMessages(messages),
    tools: aiTools,
    maxSteps: 5,
    // Stop immediately after a draft card tool completes so the model
    // doesn't emit a follow-up text step that hides the interactive card.
    stopWhen: ({ steps }) => {
      const lastStep = steps[steps.length - 1];
      return (
        lastStep?.toolResults?.some(
          (r: any) =>
            r.toolName === 'draft_email' || r.toolName === 'draft_calendar_event'
        ) ?? false
      );
    },
    async onFinish({ text, toolCalls, toolResults }) {
      if (conversationId) {
        let contentToSave = text;
        if (toolCalls && toolCalls.length > 0) {
          const toolInvocations = toolCalls.map(call => {
            const res = toolResults?.find(r => (r as any).toolCallId === (call as any).toolCallId);
            return {
              state: 'result',
              toolCallId: (call as any).toolCallId,
              toolName: (call as any).toolName,
              args: (call as any).args,
              result: res ? (res as any).result : undefined
            };
          });
          contentToSave = JSON.stringify({
            text,
            toolInvocations
          });
        }
        if (contentToSave) {
          try {
            await prisma.message.create({
              data: {
                conversationId,
                role: 'assistant',
                content: contentToSave,
              }
            });
          } catch (err) {
            console.error('Failed to save assistant message to database:', err);
          }
        }
      }
    }
  });

  return result.toUIMessageStreamResponse();
}


