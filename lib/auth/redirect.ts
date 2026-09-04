/**
 * E-M12: resolve redirect target an toàn sau auth callback.
 * Chặn open-redirect: chỉ cho relative path cùng origin (chặn //, http(s)://,
 * backslash tricks /\, /%5c, /%2f%2f). new URL KHÔNG decode %5C trong pathname
 * nên phải decodeURIComponent trước khi check backslash.
 */
export function resolveNextTarget(next: string | null, origin: string): string {
  if (!next) return `${origin}/dashboard`;
  try {
    const url = new URL(next, origin);
    if (url.origin !== origin) return `${origin}/dashboard`;
    let pathname: string;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return `${origin}/dashboard`;
    }
    if (!pathname.startsWith('/') || pathname.startsWith('//')) {
      return `${origin}/dashboard`;
    }
    if (pathname.includes('\\')) return `${origin}/dashboard`;
    return `${origin}${url.pathname}${url.search}${url.hash}`;
  } catch {
    return `${origin}/dashboard`;
  }
}
