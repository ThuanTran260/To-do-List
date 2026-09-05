import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrfToken } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rateLimit';

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
  // E-H2: rate-limit logout by IP (TRƯỚC CSRF check để tránh oracle)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(`auth:logout:${ip}`, 30, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

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

  // Forcefully expire all Supabase auth cookies (sb-*) on the HTTP Response.
  // Review fix: mirror đủ attrs của cookie gốc Supabase (Secure/SameSite/HttpOnly) —
  // Set-Cookie xoá thiếu attrs trên HTTPS có thể bị browser bỏ qua.
  const isProd = process.env.NODE_ENV === 'production';
  const allCookies = cookieStore.getAll();
  allCookies.forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      response.cookies.set(cookie.name, '', {
        maxAge: 0,
        expires: new Date(0),
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        ...(isProd ? { secure: true } : {}),
      });
    }
  });

  // B11b csrf rotate: xoá csrf-token (khớp đủ attributes với cookie gốc —
  // sameSite strict + secure ở prod — nếu không browser có thể bỏ qua lệnh xoá).
  // Middleware cấp lại token mới ở request sau.
  response.cookies.set('csrf-token', '', {
    maxAge: 0,
    expires: new Date(0),
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  });

  return response;
}

export function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed — use POST with CSRF token' },
    { status: 405 }
  );
}
