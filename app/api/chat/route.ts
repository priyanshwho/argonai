import { streamText, stepCountIs } from 'ai';
import { googleModel } from '@/lib/ai';
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

  const result = streamText({
    model: googleModel,
    system: `You are Atria, an AI-powered workspace assistant. 
You manage the user's Gmail and Google Calendar.
You can read their emails, draft responses, find calendar availability, and schedule meetings.
Always verify availability first before scheduling any meetings or calendar events.
Be concise, helpful, and professional.`,
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


