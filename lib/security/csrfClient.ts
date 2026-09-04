/**
 * E-H1/E-M1: client helper gửi CSRF token cho mọi first-party POST/PATCH.
 * Đọc double-submit cookie `csrf-token` (httpOnly:false, do middleware cấp).
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf-token='))
      ?.split('=')[1] ?? ''
  );
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('x-csrf-token')) headers.set('x-csrf-token', getCsrfToken());
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(input, { ...init, headers, credentials: 'same-origin' });
}
