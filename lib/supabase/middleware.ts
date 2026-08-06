import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * updateProxy — Supabase SSR session handler for Next.js 16 Proxy (formerly Middleware).
 *
 * Next.js 16 renamed the file convention from middleware.ts → proxy.ts and the
 * exported function from middleware() → proxy(). This helper contains all session
 * and security logic, called by the root proxy.ts entry point.
 *
 * Responsibilities:
 * 1. Create a Supabase server client that reads cookies from the request and
 *    writes updated cookies back to the response.
 * 2. Call getUser() on EVERY request:
 *    - Validates JWT signature against Supabase Auth Server (not just local decode).
 *    - Automatically refreshes expired access tokens using refresh tokens.
 *    - Writes renewed tokens back to response cookies so Server Components
 *      can access a valid session without an extra round-trip.
 * 3. Enforce route protection:
 *    - Unauthenticated users hitting /dashboard/* → redirect /login
 *    - Authenticated users hitting /login or /signup → redirect /dashboard
 *
 * IMPORTANT: Do NOT write any logic between createServerClient and getUser().
 * The two must stay adjacent so token refresh propagates correctly.
 */
export async function updateProxy(request: NextRequest) {
  // ── 1. Security Headers ──────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-Frame-Options', 'DENY');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  supabaseResponse.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  supabaseResponse.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    ].join('; ')
  );

  // ── 2. Supabase Session Validation & Token Refresh ──────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip auth guard if env vars are not configured (e.g. CI build with placeholders)
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('xxxx.supabase.co')
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Write cookies to the request (for downstream middleware/server components)
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        // Re-create response so we can write cookies to response headers too
        supabaseResponse = NextResponse.next({ request });
        // Re-apply all security headers on the new response object
        supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
        supabaseResponse.headers.set('X-Frame-Options', 'DENY');
        supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
        supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        supabaseResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        supabaseResponse.headers.set(
          'Strict-Transport-Security',
          'max-age=63072000; includeSubDomains; preload'
        );
        supabaseResponse.headers.set(
          'Content-Security-Policy',
          [
            "default-src 'self'",
            scriptSrc,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://*.supabase.co",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
          ].join('; ')
        );
        // Write refreshed Supabase auth cookies to response
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // ── IMPORTANT: getUser() must be called immediately after createServerClient ──
  // This validates the JWT against Supabase Auth server AND refreshes expired tokens.
  // Do NOT add any other logic between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 3. Route Protection ──────────────────────────────────────────────────
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (!user && isDashboardRoute) {
    // Unauthenticated user trying to access dashboard → send to login
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    // Already authenticated user trying to access login/signup → send to dashboard
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
