// Dùng Web Crypto API (globalThis.crypto) thay vì node:crypto vì module này
// được import ở middleware (Edge runtime).
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function buildCspHeader(nonce: string, isDev: boolean): string {
  // C-1 fix (review): prod chỉ cần 'self' — Next chunks load cùng origin; 'https:'
  // (trong plan) cho phép script từ BẤT KỲ origin HTTPS nào, triệt tiêu giá trị nonce.
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`;
  // C-2 fix (review): nonce KHÔNG áp dụng cho style attribute (23 chỗ style={{}})
  // và 'unsafe-inline' bị bỏ qua khi có nonce trong cùng directive → styles phải dùng 'unsafe-inline' thuần.
  const styleSrc = "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com";
  return [
    "default-src 'self'",
    scriptSrc,
    styleSrc,
    "font-src 'self' https://fonts.gstatic.com data:",
    // I-2 fix: Google OAuth avatar (lh3.googleusercontent.com)
    "img-src 'self' data: blob: https://*.supabase.co https://*.googleusercontent.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
