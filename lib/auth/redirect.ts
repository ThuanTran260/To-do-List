/**
 * E-M12 + fix: resolve redirect target an toàn sau auth callback.
 *
 * `origin` (tham số thứ hai) chỉ giữ để tương thích call-site cũ — KHÔNG dùng
 * nó làm trust anchor. Trust anchor là NEXT_PUBLIC_SITE_URL từ env, giá trị mà
 * attacker không kiểm soát được. Trước đây origin lấy từ `new URL(request.url)`
 * (chịu ảnh hưởng Host header), nên so sánh "url.origin !== origin" luôn khớp
 * khi attacker giả mạo Host header → open redirect.
 *
 * Env-aware fallback (quyết định Q7): thiếu env ở development/test thì dùng
 * `origin` như cũ để không vỡ login local; thiếu ở production thì console.error
 * LOUD (ops phải set env — Vercel: Production + Preview + Development) rồi mới
 * fallback. Host-spoof trên Vercel khó khai thác (route theo Host/SNI), nên
 * availability được ưu tiên hơn fail-closed cứng làm sập toàn bộ auth.
 */
export function resolveNextTarget(next: string | null, origin: string): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
  const trustedOrigin = envOrigin || origin;
  if (!envOrigin && process.env.NODE_ENV === 'production') {
    console.error(
      '[auth] NEXT_PUBLIC_SITE_URL is not set — redirect anchor falls back to request origin. Set it on Vercel (Production + Preview + Development).',
    );
  }
  if (!next) return `${trustedOrigin}/dashboard`;
  try {
    const url = new URL(next, trustedOrigin);
    if (url.origin !== trustedOrigin) return `${trustedOrigin}/dashboard`;
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return `${trustedOrigin}/dashboard`;
    }
    if (!pathname.startsWith('/') || pathname.startsWith('//')) {
      return `${trustedOrigin}/dashboard`;
    }
    if (pathname.includes('\\')) return `${trustedOrigin}/dashboard`;
    return `${trustedOrigin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `${trustedOrigin}/dashboard`;
  }
}
