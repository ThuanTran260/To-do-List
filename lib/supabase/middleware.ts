import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Helper duy nhất gán Security Headers lên response cuối cùng trước khi return.
 * Đảm bảo 100% response (kể cả sau khi setAll tạo mới response hoặc redirect)
 * luôn có đầy đủ CSP, HSTS, X-Frame-Options, X-Content-Type-Options...
 */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';

  // Tạm thời dùng unsafe-inline để đảm bảo tính ổn định production
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
 *    - Giữ chủ ý KHÔNG auto-redirect từ /login sang /dashboard để hỗ trợ đổi tài khoản / đăng xuất.
 * 4. Áp dụng Security Headers SAU CÙNG (ngừa bug setAll xóa mất header).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');

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

  // Bọc try/catch chống nổ 500 khi Supabase Auth API bị sự cố mạng tạm thời
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    console.error('[Middleware] getUser failed (network/API error):', err);
  }

  // Chủ ý: KHÔNG tự động redirect người dùng đã auth từ /login về /dashboard 
  // để cho phép xem form, đăng xuất hoặc đổi tài khoản mà không bị kẹt lặp trang.
  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(loginUrl);
    // Truyền toàn bộ cookies đã refresh sang response redirect
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
