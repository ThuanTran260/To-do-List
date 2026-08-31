import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/security/csrf';

/**
 * Server-Side Logout Route Handler (POST-only, CSRF-protected)
 *
 * S-01 (P0): GET handler cũ thực thi signOut → CSRF via <img src>/prefetch.
 * GET giờ trả 405; logout chỉ chạy qua POST kèm double-submit CSRF token
 * (header `x-csrf-token` phải khớp cookie `csrf-token`).
 *
 * Actions:
 * 1. Validate CSRF token.
 * 2. Call supabase.auth.signOut({ scope: 'global' }) on the server.
 * 3. Explicitly expire all `sb-*` auth cookies with `Max-Age=0`.
 * 4. Redirect back to /login.
 */
export async function POST(request: Request) {
  const cookieStore = await cookies();

  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = cookieStore.get('csrf-token')?.value;

  if (!headerToken || !validateCsrfToken(headerToken, cookieToken || '')) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && anonKey && !supabaseUrl.includes('placeholder')) {
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

export function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed — use POST with CSRF token' },
    { status: 405 }
  );
}
