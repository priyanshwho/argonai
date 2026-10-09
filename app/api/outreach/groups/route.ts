import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

// GET /api/outreach/groups — List all groups for the authenticated user
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  const groups = await prisma.outreachGroup.findMany({
    where: { userId: session.user.id },
    include: {
      _count: { select: { recipients: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Strip attachmentData from list response (too large for listing)
  const cleaned = groups.map(({ attachmentData, ...rest }) => ({
    ...rest,
    hasAttachment: !!attachmentData,
  }));

  return NextResponse.json(cleaned);
}

// POST /api/outreach/groups — Create a new group
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });

  try {
    const formData = await req.formData();
    const name = formData.get('name') as string;
    const instructions = (formData.get('instructions') as string) || '';
    const file = formData.get('attachment') as File | null;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
    }

    let attachmentName: string | null = null;
    let attachmentData: Uint8Array | null = null;

    if (file && file.size > 0) {
      attachmentName = file.name;
      const arrayBuffer = await file.arrayBuffer();
      attachmentData = new Uint8Array(arrayBuffer);
    }

    const group = await prisma.outreachGroup.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        instructions,
        attachmentName,
        attachmentData: attachmentData as any,
      },
    });

    return NextResponse.json({
      id: group.id,
      name: group.name,
      instructions: group.instructions,
      attachmentName: group.attachmentName,
      hasAttachment: !!group.attachmentData,
      status: group.status,
      createdAt: group.createdAt,
    });
  } catch (err: any) {
    console.error('Failed to create outreach group:', err);
    return NextResponse.json({ error: err.message || 'Failed to create group' }, { status: 500 });
  }
}
