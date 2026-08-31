// CSRF double-submit token helpers.
// Dùng Web Crypto API (globalThis.crypto) thay vì node:crypto vì module này
// được import ở middleware (Edge runtime) — Web Crypto chạy được cả Edge + Node + jsdom.
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time comparison chống timing attack
export function validateCsrfToken(token: string, cookieToken: string): boolean {
  if (!token || !cookieToken) return false;
  if (token.length !== cookieToken.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  return diff === 0;
}
