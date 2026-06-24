import { generateOAuthUrl } from 'corsair/oauth';
import { corsair } from '@/lib/corsair';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ pluginId: string }> }
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  const resolvedParams = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const redirectUri = `${appUrl}/api/integrations/callback`;

  try {
    const { url } = await generateOAuthUrl(corsair, resolvedParams.pluginId, {
      tenantId: session.user.id,
      redirectUri,
    });

    return NextResponse.redirect(url);
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=AuthLinkFailed&message=${encodeURIComponent(errorMessage)}`, req.url)
    );
  }
}
