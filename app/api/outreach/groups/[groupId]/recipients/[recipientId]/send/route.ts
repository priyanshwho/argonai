import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { sendOutreachEmail } from '@/lib/outreach-sender';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string; recipientId: string }> };

// POST /api/outreach/groups/[groupId]/recipients/[recipientId]/send — Send a single recipient's email
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

  if (recipient.status === 'sent') {
    return NextResponse.json({ error: 'Email has already been sent to this recipient' }, { status: 400 });
  }

  if (!recipient.subject || !recipient.body) {
    return NextResponse.json({ error: 'Draft subject and body are required before sending' }, { status: 400 });
  }

  try {
    await sendOutreachEmail({
      userId: session.user.id,
      to: recipient.email,
      subject: recipient.subject,
      body: recipient.body,
      attachmentName: group.attachmentName,
      attachmentData: group.attachmentData,
    });

    const updated = await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    // Check if entire group is now completed
    const pendingRecipients = await prisma.outreachRecipient.count({
      where: { groupId, status: { not: 'sent' } },
    });
    if (pendingRecipients === 0) {
      await prisma.outreachGroup.update({
        where: { id: groupId },
        data: { status: 'completed' },
      });
    }

    return NextResponse.json({ success: true, recipient: updated });
  } catch (err: any) {
    console.error(`Failed to send email to ${recipient.email}:`, err);
    const errMsg = err.message || 'Failed to send';

    await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: {
        status: 'error',
        errorMessage: errMsg,
      },
    });

    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
