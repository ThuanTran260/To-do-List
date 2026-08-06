import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Auth Callback Route — PKCE Code Exchange
 *
 * This route handles the redirect from Supabase Auth after:
 * - Email confirmation (new user signup with email verification)
 * - Password reset link click
 * - OAuth login (Google, Discord, GitHub, etc.) — if enabled in the future
 *
 * Flow:
 * 1. Supabase sends user to /auth/callback?code=XXXX after authentication
 * 2. This handler exchanges the one-time `code` for a full session
 * 3. The session tokens are stored in cookies by createServerClient
 * 4. User is redirected to `next` param (default: /dashboard)
 *
 * Security: Open Redirect protection enforced — `next` param must be
 * a relative path starting with '/' (not an external URL).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // Optional redirect target after successful auth (must be a relative path)
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Open Redirect protection: only allow relative URLs
      const isRelative = next.startsWith('/') && !next.startsWith('//');
      const targetUrl = isRelative ? `${origin}${next}` : `${origin}/dashboard`;
      return NextResponse.redirect(targetUrl);
    }
  }

  // On error, redirect to login with error indicator
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
