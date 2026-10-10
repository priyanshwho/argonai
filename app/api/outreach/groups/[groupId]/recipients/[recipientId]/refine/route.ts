import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { UNSLOP_PROMPT, cleanPunctuationAndFormatting } from '@/lib/unslop';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string; recipientId: string }> };

// POST /api/outreach/groups/[groupId]/recipients/[recipientId]/refine
export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!isOutreachAuthorized(session.user.email)) return new Response('Forbidden', { status: 403 });

  const { groupId, recipientId } = await params;

  // Verify group ownership
  const group = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
  });
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const recipient = await prisma.outreachRecipient.findFirst({
    where: { id: recipientId, groupId },
  });
  if (!recipient) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  try {
    const { tone, customPrompt, currentBody, currentSubject } = await req.json();

    const bodyToRefine = currentBody || recipient.body;
    const subjectToRefine = currentSubject || recipient.subject;

    if (!bodyToRefine) {
      return NextResponse.json({ error: 'No draft body to refine' }, { status: 400 });
    }

    const model = await getGoogleModel();
    const senderName = session.user.name || 'User';

    const formattingInstructions = `
- Output ONLY the rewritten email. Include both subject line and email body in this exact format:
SUBJECT: <the subject line>
BODY:
<the email body>
- Use plain text formatting only. Do not use markdown headers, bold tags (**), code fences, or bullet symbols other than simple dashes.
- Automatically use "${senderName}" as the sender's name at the end of the email.
- Address the recipient naturally for company "${recipient.companyName}".
- Never leave placeholders like [Your Name] or [Recipient Name].
${UNSLOP_PROMPT}`;

    let instruction = 'Rewrite the provided email to improve its effectiveness and style.';

    switch (tone) {
      case 'professional':
        instruction = 'Make this email highly professional, polished, and crisp. Use formal yet modern business communication phrasing.';
        break;
      case 'friendly':
        instruction = 'Make this email warm, enthusiastic, and approachable while maintaining professional credibility.';
        break;
      case 'casual':
        instruction = 'Make this email conversational and relaxed, like a note to a colleague, while keeping the core message compelling.';
        break;
      case 'short':
        instruction = 'Condense this email into a concise, high-impact message (3-5 sentences maximum) with clear intent.';
        break;
      case 'detailed':
        instruction = 'Expand on relevant background context, practical value proposition, and thoughtful next steps with high clarity.';
        break;
      case 'improve-opening':
        instruction = 'Craft a powerful, non-generic opening hook tailored to the company, making the intro immediately captivating.';
        break;
      case 'emphasize-skills':
        instruction = 'Highlight technical abilities, problem-solving impact, and relevant past accomplishments prominently.';
        break;
      case 'custom':
        instruction = customPrompt || 'Improve the email tone and clarity.';
        break;
    }

    const result = await generateText({
      model,
      system: `You are an expert cold email copywriter and editor.
${instruction}

${formattingInstructions}`,
      prompt: `CURRENT SUBJECT:
${subjectToRefine || `Outreach to ${recipient.companyName}`}

CURRENT BODY:
${bodyToRefine}

GROUP INSTRUCTIONS FOR CONTEXT:
${group.instructions || 'N/A'}`,
    });

    const text = result.text.trim();
    let newSubject = subjectToRefine;
    let newBody = text;

    const subjectMatch = text.match(/^SUBJECT:\s*(.+?)(?:\n|$)/im);
    const bodyMatch = text.match(/BODY:\s*\n?([\s\S]+)/im);

    if (subjectMatch) {
      newSubject = cleanPunctuationAndFormatting(subjectMatch[1].trim());
    }
    if (bodyMatch) {
      newBody = cleanPunctuationAndFormatting(bodyMatch[1].trim());
    } else {
      // If no explicit body tag, clean text
      newBody = cleanPunctuationAndFormatting(text.replace(/^SUBJECT:\s*(.+?)(?:\n|$)/im, '').trim());
    }

    const updated = await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: {
        subject: newSubject,
        body: newBody,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(`Failed to refine recipient ${recipientId}:`, err);
    return NextResponse.json({ error: err.message || 'Refinement failed' }, { status: 500 });
  }
}
