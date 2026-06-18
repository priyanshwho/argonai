import { processOAuthCallback } from 'corsair/oauth';
import { corsair } from '@/lib/corsair';
import { NextResponse } from 'next/server';
import { setupWatches, syncGmailCache, syncCalendarCache } from '@/lib/sync';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?tab=configuration&error=MissingParams', appUrl));
  }

  // Must strictly match the redirectUri passed to generateOAuthUrl
  const redirectUri = `${appUrl}/api/integrations/callback`;

  try {
    const { plugin, tenantId } = await processOAuthCallback(corsair, {
      code,
      state,
      redirectUri,
    });

    console.info(`OAuth callback succeeded for plugin "${plugin}", tenant: "${tenantId}". Launching watch and cache sync...`);

    // Dynamic webhook and initial cache setup
    if (plugin === 'gmail') {
      await setupWatches(tenantId);
      await syncGmailCache(tenantId);
    } else if (plugin === 'googlecalendar') {
      await setupWatches(tenantId);
      await syncCalendarCache(tenantId);
    }
    
    // Redirect back to the dashboard configurations upon success
    return NextResponse.redirect(new URL('/dashboard?tab=configuration&success=' + plugin, appUrl));
  } catch (error) {
    console.error('OAuth Callback Error:', error);
    return NextResponse.redirect(new URL('/dashboard?tab=configuration&error=CallbackFailed', appUrl));
  }
}

