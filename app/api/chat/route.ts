import { streamText, tool, hasToolCall } from 'ai';
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
      // SDK v6: tool calls live in m.parts as { type: 'tool-<name>', toolCallId, input, output, state }
      const toolParts = Array.isArray(m.parts)
        ? m.parts.filter((p: any) => typeof p.type === 'string' && p.type.startsWith('tool-'))
        : [];
      
      const resolvedParts = toolParts.filter(
        (p: any) => p.state === 'output-available' || p.state === 'output-error'
      );

      // Also support legacy SDK v5 format (m.toolInvocations) for DB-restored messages
      const legacyInvocations = (m.toolInvocations || []).filter(
        (t: any) => t.state === 'result' || t.result !== undefined
      );

      const hasCalls = resolvedParts.length > 0 || legacyInvocations.length > 0;

      if (!hasCalls) {
        modelMessages.push({ role: 'assistant', content: getMessageText(m) });
      } else {
        const assistantContent: any[] = [];
        const contentText = getMessageText(m);
        if (contentText) {
          assistantContent.push({ type: 'text', text: contentText });
        }

        // SDK v6 parts
        for (const part of resolvedParts) {
          const toolName = part.type.replace(/^tool-/, '');
          assistantContent.push({
            type: 'tool-call',
            toolCallId: part.toolCallId,
            toolName,
            input: part.input ?? {}
          });
        }

        // Legacy v5 toolInvocations
        for (const call of legacyInvocations) {
          assistantContent.push({
            type: 'tool-call',
            toolCallId: call.toolCallId,
            toolName: call.toolName,
            input: call.args ?? {}
          });
        }

        modelMessages.push({ role: 'assistant', content: assistantContent });

        // Tool results
        const toolResultContent: any[] = [];

        for (const part of resolvedParts) {
          const toolName = part.type.replace(/^tool-/, '');
          const rawResult = part.output ?? part.errorText ?? {};
          const isError = part.state === 'output-error';

          let outputVal: any;
          if (typeof rawResult === 'string') {
            outputVal = { type: isError ? 'error-text' : 'text', value: rawResult };
          } else {
            outputVal = { type: isError ? 'error-json' : 'json', value: rawResult };
          }

          toolResultContent.push({
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName,
            output: outputVal
          });
        }
        for (const t of legacyInvocations) {
          const rawResult = t.result ?? {};

          let outputVal: any;
          if (typeof rawResult === 'string') {
            outputVal = { type: 'text', value: rawResult };
          } else {
            outputVal = { type: 'json', value: rawResult };
          }

          toolResultContent.push({
            type: 'tool-result',
            toolCallId: t.toolCallId,
            toolName: t.toolName,
            output: outputVal
          });
        }

        if (toolResultContent.length > 0) {
          modelMessages.push({ role: 'tool', content: toolResultContent });
        }
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

  const { messages, conversationId, timezone } = await req.json();

  // Compute current local time in user's timezone if provided
  const userTimezone = timezone || 'UTC';
  const currentLocalDatetime = new Date().toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
    timeZone: userTimezone,
  });

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

        // Touch the conversation's updatedAt timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
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

The current date and time is: ${currentLocalDatetime}. The user's local timezone is: ${userTimezone}. Use this to resolve relative dates like "today", "tomorrow", or "next Friday".
When creating calendar events, ALWAYS generate startTime and endTime as ISO 8601 strings that correctly represent the user's LOCAL time. For example, if the user says "6 PM today" and is in IST (UTC+5:30), startTime should be "2026-06-26T18:00:00+05:30" or the equivalent UTC "2026-06-26T12:30:00Z". Always account for the timezone offset.

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

Always follow this pattern when reading data:

1. For queries asking for "recent", "latest", "last", or real-time emails, you MUST query the live Gmail API (.api) first. This is because the local database cache (.db) is not updated in real-time unless the user manually visits the inbox workspace.
2. For Gmail list and search operations using the live API (.api), the list call only returns message stubs (ID and threadId). You MUST concurrently fetch full message details using Promise.all and corsair.gmail.api.messages.get for the top 5-10 stubs to read the subjects, senders, dates, and snippets.
3. Map all email responses to a simple, consistent JSON array format containing fields: id, subject, sender, date, snippet. This ensures you can easily inspect and list them.

## OPERATIONS GUIDE

1. List recent/latest Gmail messages (Real-time Live API query):
   const listRes = await corsair.gmail.api.messages.list({ userId: 'me', maxResults: 10 });
   const stubs = listRes.messages || [];
   const emails = await Promise.all(stubs.map(async (stub) => {
     try {
       const msg = await corsair.gmail.api.messages.get({ userId: 'me', id: stub.id });
       return {
         id: msg.id,
         subject: msg.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
         sender: msg.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender',
         date: msg.internalDate ? new Date(parseInt(msg.internalDate)).toLocaleString() : '',
         snippet: msg.snippet || ''
       };
     } catch {
       return null;
     }
   }));
   return emails.filter(Boolean);

2. Search Gmail messages (Real-time Live API query):
   const listRes = await corsair.gmail.api.messages.list({ userId: 'me', q: 'searchTerm', maxResults: 10 });
   const stubs = listRes.messages || [];
   const emails = await Promise.all(stubs.map(async (stub) => {
     try {
       const msg = await corsair.gmail.api.messages.get({ userId: 'me', id: stub.id });
       return {
         id: msg.id,
         subject: msg.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value || 'No Subject',
         sender: msg.payload?.headers?.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown Sender',
         date: msg.internalDate ? new Date(parseInt(msg.internalDate)).toLocaleString() : '',
         snippet: msg.snippet || ''
       };
     } catch {
       return null;
     }
   }));
   return emails.filter(Boolean);

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
    // Stop immediately after a draft card tool completes so the model
    // doesn't emit a follow-up text step that hides the interactive card.
    stopWhen: [
      hasToolCall('draft_email'),
      hasToolCall('draft_calendar_event'),
    ],
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

            // Touch the conversation's updatedAt timestamp and update title if it's default
            const conv = await prisma.conversation.findUnique({
              where: { id: conversationId }
            });
            const updateData: any = { updatedAt: new Date() };
            if (conv && (conv.title === 'New Conversation' || conv.title.startsWith('Conversation '))) {
              // Find first user message for title
              const firstMsg = await prisma.message.findFirst({
                where: { conversationId, role: 'user' },
                orderBy: { timestamp: 'asc' }
              });
              if (firstMsg) {
                let parsedText = firstMsg.content;
                if (firstMsg.content.startsWith('{') || firstMsg.content.startsWith('[')) {
                  try {
                    const parsed = JSON.parse(firstMsg.content);
                    parsedText = parsed.text || parsed.content || firstMsg.content;
                  } catch {}
                }
                updateData.title = parsedText.slice(0, 30) || 'New Conversation';
              }
            }
            await prisma.conversation.update({
              where: { id: conversationId },
              data: updateData
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

export async function DELETE(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('id');

  if (!conversationId) {
    return new Response('Missing conversation ID', { status: 400 });
  }

  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return new Response('Conversation not found', { status: 404 });
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Failed to delete conversation:', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to delete conversation' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}



