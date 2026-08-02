import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // ── Environment-Aware Security Headers (CSP) ──
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
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

  // ── Fast Auth Session Guard (<1ms Latency) ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('xxxx.supabase.co')) {
    const allCookies = request.cookies.getAll();
    // Fast cookie inspection: Check if Supabase auth session token cookie exists
    const hasAuthCookie = allCookies.some(
      (c) => c.name.startsWith('sb-') && (c.name.includes('auth-token') || c.name.includes('token'))
    );

    const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
    const isAuthRoute = ['/login', '/signup'].includes(request.nextUrl.pathname);

    // If user has no auth cookie and tries to access /dashboard, redirect to /login instantly
    if (!hasAuthCookie && isDashboardRoute) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Only do full network getUser() validation on auth pages (/login, /signup) to prevent open redirect
    if (hasAuthCookie && isAuthRoute) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
