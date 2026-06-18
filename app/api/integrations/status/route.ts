import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const accounts = await prisma.corsairAccount.findMany({
      where: { tenantId: session.user.id },
      include: { integration: true },
    });

    return NextResponse.json({
      hasGmail: accounts.some((a) => a.integration.name === "gmail"),
      hasCalendar: accounts.some((a) => a.integration.name === "googlecalendar"),
    });
  } catch (err) {
    console.error('Failed to query integration status:', err);
    return NextResponse.json({ hasGmail: false, hasCalendar: false }, { status: 500 });
  }
}
