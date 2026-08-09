import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Applies security headers (CSP, HSTS, X-Frame-Options, etc.) to the response object.
 * Incorporates a per-request dynamic nonce into Content-Security-Policy header.
 */
function applySecurityHeaders(response: NextResponse, nonce: string): void {
  const isDev = process.env.NODE_ENV === 'development';

  const scriptSrc = `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https:`;

  const cspHeader = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
}

/**
 * updateSession — Supabase SSR session & Auth guard handler for Next.js Middleware.
 *
 * Responsibilities:
 * 1. Generates dynamic per-request nonce (base64 random UUID/bytes) and forwards in x-nonce request header.
 * 2. Applies Nonce-based Content Security Policy and security headers.
 * 3. Creates Supabase server client reading/writing cookies via @supabase/ssr.
 * 4. Calls getUser() on EVERY request to validate JWT signature and refresh expired tokens.
 * 5. Enforces route protection:
 *    - Unauthenticated users accessing /dashboard/* -> redirect /login
 *    - Authenticated users accessing /login or /signup -> redirect /dashboard
 * 6. Preserves refreshed cookies on redirect responses.
 * 7. Provides graceful fallback during build/CI mode when SUPABASE_URL is missing or placeholder.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // 1. Per-request Nonce Generation
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // 2. Forward x-nonce in Request Headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // 3. Response Initialization & Security Headers
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(supabaseResponse, nonce);

  // 4. Supabase Session Validation & Token Refresh
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
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
        applySecurityHeaders(supabaseResponse, nonce);

        const isRemembered = request.cookies.get('sb-remember-me')?.value === 'true';
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = isRemembered
            ? options
            : { ...options, maxAge: undefined, expires: undefined };
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  // IMPORTANT: getUser() immediately after createServerClient
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 5. Route Protection & Auth Guard
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    applySecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    applySecurityHeaders(redirectResponse, nonce);
    return redirectResponse;
  }

  return supabaseResponse;
}

/**
 * Backward compatibility alias for updateProxy
 */
export async function updateProxy(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}
