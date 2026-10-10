import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { generateText } from 'ai';
import { getGoogleModel } from '@/lib/ai';
import { UNSLOP_PROMPT, cleanPunctuationAndFormatting } from '@/lib/unslop';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string }> };

// POST /api/outreach/groups/[groupId]/generate — Generate drafts for all (or selected) recipients
export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!isOutreachAuthorized(session.user.email)) return new Response('Forbidden', { status: 403 });

  const { groupId } = await params;

  const group = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
    include: { recipients: true },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (!group.instructions || !group.instructions.trim()) {
    return NextResponse.json({ error: 'Group instructions are required before generating drafts' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const recipientIds: string[] | undefined = body.recipientIds;

  // Filter to specific recipients or all with draft/error status
  let targets = group.recipients;
  if (recipientIds && recipientIds.length > 0) {
    targets = targets.filter(r => recipientIds.includes(r.id));
  } else {
    targets = targets.filter(r => r.status === 'draft' || r.status === 'error');
  }

  if (targets.length === 0) {
    return NextResponse.json({ error: 'No eligible recipients to generate drafts for' }, { status: 400 });
  }

  const model = await getGoogleModel();
  const senderName = session.user.name || 'User';
  const results: { id: string; status: string; error?: string }[] = [];

  // Mark group as generating
  await prisma.outreachGroup.update({
    where: { id: groupId },
    data: { status: 'generating' },
  });

  for (const recipient of targets) {
    try {
      // Mark recipient as generating
      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { status: 'generating' },
      });

      const result = await generateText({
        model,
        system: `You are an expert outreach email writer. Write a unique, personalized cold outreach email based on the instructions provided.

CRITICAL RULES:
- Generate BOTH a subject line AND an email body.
- Format your response as:
  SUBJECT: <the subject line>
  BODY:
  <the email body>
- Make each email genuinely unique — vary the opening, structure, highlighted skills, and tone.
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

Write a unique personalized outreach email for this company.`,
      });

      // Parse subject and body from response
      const text = result.text.trim();
      let subject = '';
      let emailBody = '';

      const subjectMatch = text.match(/^SUBJECT:\s*(.+?)(?:\n|$)/im);
      const bodyMatch = text.match(/BODY:\s*\n?([\s\S]+)/im);

      if (subjectMatch) {
        subject = cleanPunctuationAndFormatting(subjectMatch[1].trim());
      } else {
        // Fallback: first line as subject
        const lines = text.split('\n').filter(l => l.trim());
        subject = cleanPunctuationAndFormatting(lines[0] || `Outreach to ${recipient.companyName}`);
      }

      if (bodyMatch) {
        emailBody = cleanPunctuationAndFormatting(bodyMatch[1].trim());
      } else {
        // Fallback: everything after first line
        const lines = text.split('\n');
        emailBody = cleanPunctuationAndFormatting(lines.slice(1).join('\n').trim());
      }

      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { subject, body: emailBody, status: 'draft' },
      });

      results.push({ id: recipient.id, status: 'generated' });
    } catch (err: any) {
      console.error(`Failed to generate draft for ${recipient.email}:`, err);
      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: { status: 'error', errorMessage: err.message || 'Generation failed' },
      });
      results.push({ id: recipient.id, status: 'error', error: err.message });
    }
  }

  // Update group status
  const allRecipients = await prisma.outreachRecipient.findMany({
    where: { groupId },
  });
  const allGenerated = allRecipients.every(r => r.status !== 'generating');
  if (allGenerated) {
    await prisma.outreachGroup.update({
      where: { id: groupId },
      data: { status: 'ready' },
    });
  }

  return NextResponse.json({ results });
}
