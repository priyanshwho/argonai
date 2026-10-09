import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

type RouteParams = { params: Promise<{ groupId: string }> };

// GET /api/outreach/groups/[groupId] — Get group with all recipients
export async function GET(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { groupId } = await params;

  const group = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
    include: {
      recipients: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  // Strip raw bytes from response, send metadata only
  const { attachmentData, ...rest } = group;

  return NextResponse.json({
    ...rest,
    hasAttachment: !!attachmentData,
  });
}

// PUT /api/outreach/groups/[groupId] — Update group name, instructions, or attachment
export async function PUT(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { groupId } = await params;

  // Verify ownership
  const existing = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const instructions = formData.get('instructions') as string | null;
    const file = formData.get('attachment') as File | null;
    const removeAttachment = formData.get('removeAttachment') === 'true';

    const updateData: any = {};

    if (name !== null && name.trim()) {
      updateData.name = name.trim();
    }
    if (instructions !== null) {
      updateData.instructions = instructions;
    }

    if (removeAttachment) {
      updateData.attachmentName = null;
      updateData.attachmentData = null;
    } else if (file && file.size > 0) {
      updateData.attachmentName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      updateData.attachmentData = new Uint8Array(arrayBuffer);
    }

    const updated = await prisma.outreachGroup.update({
      where: { id: groupId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      instructions: updated.instructions,
      attachmentName: updated.attachmentName,
      hasAttachment: !!updated.attachmentData,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (err: any) {
    console.error('Failed to update outreach group:', err);
    return NextResponse.json({ error: err.message || 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/outreach/groups/[groupId] — Delete group and all recipients
export async function DELETE(_req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const { groupId } = await params;

  const existing = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  await prisma.outreachGroup.delete({ where: { id: groupId } });

  return NextResponse.json({ success: true });
}
