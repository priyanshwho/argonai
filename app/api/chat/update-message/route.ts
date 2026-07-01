import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { messageId, parts } = await req.json();

  if (!messageId || !parts) {
    return new Response('Missing required fields', { status: 400 });
  }

  try {
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return new Response('Message not found', { status: 404 });
    }

    // Ensure the message belongs to the current user's conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: existingMessage.conversationId,
        userId: session.user.id,
      },
    });

    if (!conversation) {
      return new Response('Unauthorized', { status: 401 });
    }

    let parsedContent: any = {};
    if (existingMessage.content.startsWith('{') || existingMessage.content.startsWith('[')) {
      try {
        parsedContent = JSON.parse(existingMessage.content);
      } catch {}
    } else {
      parsedContent.text = existingMessage.content;
    }

    parsedContent.parts = parts;

    await prisma.message.update({
      where: { id: messageId },
      data: {
        content: JSON.stringify(parsedContent),
      },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Failed to update message:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
