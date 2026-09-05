import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';
import { generateNonce, buildCspHeader } from '@/lib/security/csp';
import { applyRememberMePolicy } from '@/lib/security/rememberMe';

/**
 * Helper duy nhất gán Security Headers lên response cuối cùng trước khi return.
 * Đảm bảo 100% response (kể cả sau khi setAll tạo mới response hoặc redirect)
 * luôn có đầy đủ CSP, HSTS, X-Frame-Options, X-Content-Type-Options...
 */
function applySecurityHeaders(
  response: NextResponse,
  nonce: string,
  request: NextRequest
): NextResponse {
  const isDev = process.env.NODE_ENV === 'development';

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );
  // S-02 (P0): CSP nonce thực per-request thay cho 'unsafe-inline'.
  // Middleware là NGUỒN DUY NHẤT của CSP (MD-11) — next.config.ts/vercel.json chỉ giữ non-CSP headers.
  response.headers.set('Content-Security-Policy', buildCspHeader(nonce, isDev));
  // MD-10: expose nonce cho app/layout.tsx để gắn vào <html nonce>
  response.headers.set('x-nonce', nonce);

  // C-4: setAll của @supabase/ssr có thể THAY THẾ supabaseResponse (token refresh)
  // → csrf cookie bị mất khỏi response jar. Mirror từ request lên response cuối để đảm bảo không rơi.
  const csrfFromRequest = request.cookies.get('csrf-token')?.value;
  if (csrfFromRequest && !response.cookies.get('csrf-token')) {
    response.cookies.set('csrf-token', csrfFromRequest, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

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

  // Nonce per-request (S-02) — áp cho MỌI response kể cả redirect
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV === 'development';

  // C-1: Next.js đọc nonce từ CSP header của REQUEST (không phải response)
  // để gắn vào các inline bootstrap/flight scripts. Phải forward qua requestHeaders.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', buildCspHeader(nonce, isDev));

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  // MD-03: Nếu chưa có csrf-token cookie, tạo mới và set vào response (double-submit).
  // httpOnly:false để JS đọc được cho header x-csrf-token khi POST logout/mutations.
  if (!request.cookies.get('csrf-token')) {
    const csrfToken = generateCsrfToken();
    supabaseResponse.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    request.cookies.set('csrf-token', csrfToken);
  }

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
      return applySecurityHeaders(NextResponse.redirect(loginUrl), nonce, request);
    }
    return applySecurityHeaders(supabaseResponse, nonce, request);
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // E-M2: enforce remember-me ở cả refresh SSR — đọc flag từ request cookies,
        // override maxAge của library (default 400 ngày) cho mọi sb-* cookie.
        const remembered = request.cookies.get('sb-remember-me')?.value === 'true';
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
        // Chuẩn 100% của @supabase/ssr: Giữ nguyên options để trình duyệt HTTPS Vercel chấp nhận Secure/SameSite
        cookiesToSet.forEach(({ name, value, options }) => {
          const maxAge = name.startsWith('sb-')
            ? applyRememberMePolicy(options?.maxAge ?? null, remembered)
            : options?.maxAge ?? undefined;
          supabaseResponse.cookies.set(name, value, {
            ...options,
            ...(maxAge === undefined ? { maxAge: undefined } : { maxAge }),
          });
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

  // 1. Chưa auth mà truy cập /dashboard/* -> Redirect /login
  if (!user && isDashboardRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return applySecurityHeaders(redirectResponse, nonce, request);
  }

  // 2. Đã auth mà truy cập /login hoặc /signup -> Redirect /dashboard
  if (user && isAuthRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    const redirectResponse = NextResponse.redirect(dashboardUrl);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return applySecurityHeaders(redirectResponse, nonce, request);
  }

  // Áp dụng Security Headers SAU CÙNG lên duy nhất 1 response sẽ trả về
  return applySecurityHeaders(supabaseResponse, nonce, request);
}

/**
 * Alias tương thích ngược cho updateProxy
 */
export async function updateProxy(request: NextRequest): Promise<NextResponse> {
  return await updateSession(request);
}
