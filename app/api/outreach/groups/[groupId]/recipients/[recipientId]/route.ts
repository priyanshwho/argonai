import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string; recipientId: string }> };

// Helper: verify ownership chain (user → group → recipient)
async function verifyOwnership(userId: string, groupId: string, recipientId: string) {
  const recipient = await prisma.outreachRecipient.findFirst({
    where: {
      id: recipientId,
      groupId,
      group: { userId },
    },
  });
  return recipient;
}

// PUT /api/outreach/groups/[groupId]/recipients/[recipientId] — Update a single recipient
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!isOutreachAuthorized(session.user.email)) return new Response('Forbidden', { status: 403 });

  const { groupId, recipientId } = await params;

  const existing = await verifyOwnership(session.user.id, groupId, recipientId);
  if (!existing) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updateData: any = {};

    if (body.companyName !== undefined) updateData.companyName = body.companyName.trim();
    if (body.email !== undefined) updateData.email = body.email.trim().toLowerCase();
    if (body.customNotes !== undefined) updateData.customNotes = body.customNotes;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.status !== undefined) {
      const allowed = ['draft', 'approved', 'error'];
      if (allowed.includes(body.status)) {
        updateData.status = body.status;
      }
    }

    const updated = await prisma.outreachRecipient.update({
      where: { id: recipientId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Failed to update recipient:', err);
    return NextResponse.json({ error: err.message || 'Failed to update recipient' }, { status: 500 });
  }
}

// DELETE /api/outreach/groups/[groupId]/recipients/[recipientId] — Remove a single recipient
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!isOutreachAuthorized(session.user.email)) return new Response('Forbidden', { status: 403 });

  const { groupId, recipientId } = await params;

  const existing = await verifyOwnership(session.user.id, groupId, recipientId);
  if (!existing) {
    return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
  }

  await prisma.outreachRecipient.delete({ where: { id: recipientId } });

  return NextResponse.json({ success: true });
}
