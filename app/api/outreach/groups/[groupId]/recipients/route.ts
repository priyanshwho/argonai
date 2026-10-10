import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { isOutreachAuthorized } from '@/lib/outreach-auth';

type RouteParams = { params: Promise<{ groupId: string }> };

// POST /api/outreach/groups/[groupId]/recipients — Bulk add recipients
export async function POST(req: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  if (!isOutreachAuthorized(session.user.email)) return new Response('Forbidden', { status: 403 });

  const { groupId } = await params;

  // Verify ownership
  const group = await prisma.outreachGroup.findFirst({
    where: { id: groupId, userId: session.user.id },
  });
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  try {
    const { recipients } = await req.json();

    // Expect: [{ companyName: string, email: string, customNotes?: string }]
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'Provide an array of recipients with companyName and email' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = [];
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.email || !emailRegex.test(r.email.trim())) {
        errors.push(`Row ${i + 1}: Invalid email "${r.email || ''}"`);
        continue;
      }
      if (!r.companyName || !r.companyName.trim()) {
        errors.push(`Row ${i + 1}: Company name is required`);
        continue;
      }
      validRecipients.push({
        groupId,
        companyName: r.companyName.trim(),
        email: r.email.trim().toLowerCase(),
        customNotes: r.customNotes?.trim() || '',
      });
    }

    let created: any[] = [];
    if (validRecipients.length > 0) {
      // Use createManyAndReturn if available, otherwise createMany + query
      await prisma.outreachRecipient.createMany({
        data: validRecipients,
      });

      // Fetch the newly created recipients
      created = await prisma.outreachRecipient.findMany({
        where: { groupId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      added: validRecipients.length,
      errors,
      recipients: created,
    });
  } catch (err: any) {
    console.error('Failed to add recipients:', err);
    return NextResponse.json({ error: err.message || 'Failed to add recipients' }, { status: 500 });
  }
}
