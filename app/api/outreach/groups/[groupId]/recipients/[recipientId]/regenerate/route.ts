import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { UNSLOP_PROMPT, cleanPunctuationAndFormatting } from '@/lib/unslop';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string; recipientId: string }> };

// POST /api/outreach/groups/[groupId]/recipients/[recipientId]/regenerate
export async function POST(_req: Request, { params }: RouteParams) {
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
    await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: { status: 'generating' },
    });

    const model = await getGoogleModel();
    const senderName = session.user.name || 'User';

    const result = await generateText({
      model,
      system: `You are an expert outreach email writer. Write a fresh, unique personalized cold outreach email based on the instructions provided.

CRITICAL RULES:
- Generate BOTH a subject line AND an email body.
- Format your response as:
  SUBJECT: <the subject line>
  BODY:
  <the email body>
- Make this variation distinct from typical boilerplate — strong hook, relevant value proposition, and a clear, low-friction call to action.
- Do NOT invent company details, job openings, or specific projects. Use only what is provided or commonly known.
- Use "${senderName}" as the sender's name at the end of the email.
- Address the recipient naturally based on the company name. Do not use placeholders like [Recipient Name].
- Use plain text only. No markdown, no bold, no headers, no code fences.
${UNSLOP_PROMPT}`,
      prompt: `GROUP INSTRUCTIONS:
${group.instructions}

RECIPIENT:
- Company: ${recipient.companyName}
- Email: ${recipient.email}
${recipient.customNotes ? `- Additional Notes: ${recipient.customNotes}` : ''}

Write a completely refreshed personalized outreach email for this company.`,
    });

    const text = result.text.trim();
    let subject = '';
    let emailBody = '';

    const subjectMatch = text.match(/^SUBJECT:\s*(.+?)(?:\n|$)/im);
    const bodyMatch = text.match(/BODY:\s*\n?([\s\S]+)/im);

    if (subjectMatch) {
      subject = cleanPunctuationAndFormatting(subjectMatch[1].trim());
    } else {
      const lines = text.split('\n').filter(l => l.trim());
      subject = cleanPunctuationAndFormatting(lines[0] || `Outreach to ${recipient.companyName}`);
    }

    if (bodyMatch) {
      emailBody = cleanPunctuationAndFormatting(bodyMatch[1].trim());
    } else {
      const lines = text.split('\n');
      emailBody = cleanPunctuationAndFormatting(lines.slice(1).join('\n').trim());
    }

    const updated = await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: {
        subject,
        body: emailBody,
        status: 'draft',
        errorMessage: null,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(`Failed to regenerate draft for recipient ${recipientId}:`, err);
    await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: { status: 'error', errorMessage: err.message || 'Regeneration failed' },
    });
    return NextResponse.json({ error: err.message || 'Regeneration failed' }, { status: 500 });
  }
}
