import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-Side Logout Route Handler
 *
 * This handler executes on the server to ensure complete cookie invalidation
 * for browsers and mobile in-app WebViews (such as Discord Mobile WebView) that
 * do not allow client-side JavaScript (`document.cookie`) to delete server-set cookies.
 *
 * Actions:
 * 1. Call supabase.auth.signOut({ scope: 'global' }) on the server.
 * 2. Explicitly append `Set-Cookie` HTTP response headers with `Max-Age=0`
 *    and `Expires=Thu, 01 Jan 1970 00:00:00 GMT` for all `sb-*` auth cookies.
 * 3. Redirect back to /login.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const requestUrl = new URL(request.url);
  const redirectUrl = new URL('/login', requestUrl.origin);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const response = NextResponse.redirect(redirectUrl);

  if (!supabaseUrl.includes('placeholder')) {
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Revoke server-side session globally across all devices
    await supabase.auth.signOut({ scope: 'global' });
  }

  // Forcefully expire all Supabase auth cookies (sb-*) on the HTTP Response
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        expires: new Date(0),
        path: '/',
      });
    }
  });

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
