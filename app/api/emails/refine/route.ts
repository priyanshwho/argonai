import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { UNSLOP_PROMPT, cleanPunctuationAndFormatting } from '@/lib/unslop';

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const { body, tone, to } = await req.json();

    if (!body || !tone) {
      return NextResponse.json({ error: 'Missing required fields (body, tone)' }, { status: 400 });
    }

    const model = await getGoogleModel();

    const senderName = session.user.name || 'User';
    const recipientInfo = to || '';

    // General instructions to prevent markdown bolding, headings, alternative options, subject line, or tip blocks.
    const formattingInstructions = `
- Output ONLY the single rewritten email body. Do not write subject, options, markdown format, code fences, headers, annotations, or tips.
- Use plain text formatting only. Do not use bold tags like **, markdown headers, or other markdown punctuation.
- Automatically use "${senderName}" as the sender's name at the end of the email (do not use placeholders like [Your Name] or [User Name]).
- Automatically address the recipient based on the recipient identifier "${recipientInfo}" if provided (parse a friendly first name if it is an email address, e.g. "Saitama" from "saitama10k10@gmail.com", or if it contains a name, use it). If no recipient information is provided or no name can be parsed, start with a general polite greeting like "Dear Customer," "Hi," or "Hello," without brackets or placeholders. Never leave placeholders like [Recipient Name] or [Recipient's Name].
${UNSLOP_PROMPT}`;

    let systemInstruction = 'You are a professional email editor assistant. Rewrite the provided email body to improve its tone and style. Write only the modified body text, without headers, subjects, placeholders, or templates.';

    switch (tone) {
      case 'professional':
        systemInstruction = `You are a professional communications assistant. Rewrite the provided email to be highly professional, polite, and polished. Use clear, active language, formal salutations, and a respectful tone suitable for business communication. Maintain all original core details (dates, names, links). ${formattingInstructions}`;
        break;
      case 'friendly':
        systemInstruction = `You are a helpful and warm personal assistant. Rewrite the provided email to sound friendly, warm, appreciative, and enthusiastic. Use positive language, exclamation marks where appropriate, and friendly greetings, while keeping it polite and clear. ${formattingInstructions}`;
        break;
      case 'casual':
        systemInstruction = `You are a helpful assistant. Rewrite the provided email to be casual, direct, and conversational. Use contraction words (I'm, we're), keep the tone relaxed and friendly as if writing to a close teammate, but keep the essential content intact. ${formattingInstructions}`;
        break;
      case 'short':
        systemInstruction = `You are an email editing assistant. Condense the provided email to be brief and punchy. Eliminate filler words and keep only the core message in 1 or 2 sentences maximum. ${formattingInstructions}`;
        break;
      case 'long':
        systemInstruction = `You are an email assistant. Expand the provided email by adding professional context, clarifying details, clear next steps, and organizing the content with neat bullet points if appropriate, making it more formal, structured, and detailed. ${formattingInstructions}`;
        break;
    }

    const result = await generateText({
      model,
      system: systemInstruction,
      prompt: `Email body to rewrite:\n${body}`,
    });

    const refined = cleanPunctuationAndFormatting(result.text.trim());
    return NextResponse.json({ refinedBody: refined });
  } catch (err: any) {
    console.error('Failed to refine email:', err);
    return NextResponse.json({ error: err.message || 'Failed to refine email' }, { status: 500 });
  }
}
