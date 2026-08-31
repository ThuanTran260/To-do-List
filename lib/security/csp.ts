// Dùng Web Crypto API (globalThis.crypto) thay vì node:crypto vì module này
// được import ở middleware (Edge runtime).
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCspHeader(nonce: string, isDev: boolean): string {
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' https:`;
  // CRITICAL (CR-04): phải dùng template literal — regular string không interpolate nonce
  const styleSrc = `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`;
  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
