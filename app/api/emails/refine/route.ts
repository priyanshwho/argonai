import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { body, tone } = await req.json();

    if (!body || !tone) {
      return NextResponse.json({ error: 'Missing required fields (body, tone)' }, { status: 400 });
    }

    const model = await getGoogleModel();

    let systemInstruction = 'You are a professional email editor assistant. Rewrite the provided email body to improve its tone and style. Write only the modified body text, without headers, subjects, placeholders, or templates.';

    switch (tone) {
      case 'professional':
        systemInstruction = 'You are a professional communications assistant. Rewrite the provided email to be highly professional, polite, and polished. Use clear, active language, formal salutations, and a respectful tone suitable for business communication. Maintain all original core details (dates, names, links).';
        break;
      case 'friendly':
        systemInstruction = 'You are a helpful and warm personal assistant. Rewrite the provided email to sound friendly, warm, appreciative, and enthusiastic. Use positive language, exclamation marks where appropriate, and friendly greetings, while keeping it polite and clear.';
        break;
      case 'casual':
        systemInstruction = 'You are a helpful assistant. Rewrite the provided email to be casual, direct, and conversational. Use contraction words (I\'m, we\'re), keep the tone relaxed and friendly as if writing to a close teammate, but keep the essential content intact.';
        break;
      case 'short':
        systemInstruction = 'You are an email editing assistant. Condense the provided email to be brief and punchy. Eliminate filler words and keep only the core message in 1 or 2 sentences maximum.';
        break;
      case 'long':
        systemInstruction = 'You are an email assistant. Expand the provided email by adding professional context, clarifying details, clear next steps, and organizing the content with neat bullet points if appropriate, making it more formal, structured, and detailed.';
        break;
    }

    const result = await generateText({
      model,
      system: systemInstruction,
      prompt: `Email body to rewrite:\n${body}`,
    });

    return NextResponse.json({ refinedBody: result.text.trim() });
  } catch (err: any) {
    console.error('Failed to refine email:', err);
    return NextResponse.json({ error: err.message || 'Failed to refine email' }, { status: 500 });
  }
}
