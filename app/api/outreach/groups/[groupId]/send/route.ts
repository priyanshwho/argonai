import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { sendOutreachEmail } from '@/lib/outreach-sender';

type RouteParams = { params: Promise<{ groupId: string }> };

// POST /api/outreach/groups/[groupId]/send — Send all approved drafts in a group
export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { groupId } = await params;

  const group = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
    include: { recipients: true },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const recipientIds: string[] | undefined = body.recipientIds;
  const allowDrafts: boolean = !!body.allowDrafts;

  // Filter recipients:
  // Must NOT be already 'sent'
  // Must have subject and body
  // Either status is 'approved', or allowDrafts is true and status is 'draft'
  let targets = group.recipients.filter(r => r.status !== 'sent' && r.subject && r.body);

  if (recipientIds && recipientIds.length > 0) {
    targets = targets.filter(r => recipientIds.includes(r.id));
  } else if (!allowDrafts) {
    targets = targets.filter(r => r.status === 'approved');
  }

  if (targets.length === 0) {
    return NextResponse.json(
      { error: 'No recipients ready to send. Please approve drafts first.' },
      { status: 400 }
    );
  }

  // Mark group as sending
  await prisma.outreachGroup.update({
    where: { id: groupId },
    data: { status: 'sending' },
  });

  const results: { id: string; email: string; success: boolean; error?: string }[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const recipient of targets) {
    try {
      await sendOutreachEmail({
        userId: session.user.id,
        to: recipient.email,
        subject: recipient.subject!,
        body: recipient.body!,
        attachmentName: group.attachmentName,
        attachmentData: group.attachmentData,
      });

      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'sent',
          sentAt: new Date(),
          errorMessage: null,
        },
      });

      results.push({ id: recipient.id, email: recipient.email, success: true });
      successCount++;
    } catch (err: any) {
      console.error(`Failed to send email to ${recipient.email}:`, err);
      const errMsg = err.message || 'Failed to send';

      await prisma.outreachRecipient.update({
        where: { id: recipient.id },
        data: {
          status: 'error',
          errorMessage: errMsg,
        },
      });

      results.push({ id: recipient.id, email: recipient.email, success: false, error: errMsg });
      failCount++;
    }
  }

  // Check remaining recipients to set final group status
  const allRecipients = await prisma.outreachRecipient.findMany({
    where: { groupId },
  });
  const allSent = allRecipients.length > 0 && allRecipients.every(r => r.status === 'sent');

  await prisma.outreachGroup.update({
    where: { id: groupId },
    data: { status: allSent ? 'completed' : 'ready' },
  });

  return NextResponse.json({
    total: targets.length,
    sent: successCount,
    failed: failCount,
    results,
  });
}
