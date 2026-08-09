import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Helper duy nhất gán Security Headers lên response cuối cùng trước khi return.
 * Đảm bảo 100% response (kể cả sau khi setAll tạo mới response hoặc redirect)
 * luôn có đầy đủ CSP, HSTS, X-Frame-Options, X-Content-Type-Options...
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline' https:";

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

/**
 * updateSession — Supabase SSR session & Auth guard handler cho Next.js Middleware.
 *
 * Responsibilities:
 * 1. Đọc và ghi đồng bộ cookies từ request xuống response qua @supabase/ssr.
 * 2. Gọi getUser() bọc try/catch chống nổ 500 khi API Supabase chập chờn mạng.
 * 3. Kiểm soát phân quyền route:
 *    - Chưa auth truy cập /dashboard/* -> Redirect /login (Fail-closed)
 *    - Đã auth truy cập /login hoặc /signup -> Redirect /dashboard
 * 4. Áp dụng Security Headers SAU CÙNG (ngừa bug setAll xóa mất header).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail-closed: Nếu thiếu env vars và cố truy cập /dashboard -> Bắt buộc redirect /login
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseUrl.includes('xxxx.supabase.co')
  ) {
    if (isDashboardRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/login';
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return applySecurityHeaders(supabaseResponse);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        // Chuẩn 100% của @supabase/ssr: Giữ nguyên options để trình duyệt HTTPS Vercel chấp nhận Secure/SameSite
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Bọc try/catch chống nổ 500 khi Supabase Auth API bị sự cố mạng tạm thời
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[Middleware] getUser failed (network/API error):', err);
  }

  // 1. Chưa auth mà truy cập /dashboard/* -> Redirect /login
  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return applySecurityHeaders(redirectResponse);
  }

  // 2. Đã auth mà truy cập /login hoặc /signup -> Redirect /dashboard
  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return applySecurityHeaders(redirectResponse);
  }

  // Áp dụng Security Headers SAU CÙNG lên duy nhất 1 response sẽ trả về
  return applySecurityHeaders(supabaseResponse);
}

/**
 * Alias tương thích ngược cho updateProxy
 */
export async function updateProxy(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}
