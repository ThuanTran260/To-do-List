/**
 * E-H1/E-M1: client helper gửi CSRF token cho mọi first-party POST/PATCH.
 * Đọc double-submit cookie `csrf-token` (httpOnly:false, do middleware cấp).
 */
export function getCsrfToken(): string {
  if (typeof document === 'undefined') return '';
  // Review fix (#17): parse robust — cookie có thể không có space sau ';',
  // value có thể chứa '=' (dù CSRF hiện tại là hex, phòng tương lai).
  const found = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('csrf-token='));
  if (!found) return '';
  try {
    return decodeURIComponent(found.slice('csrf-token='.length));
  } catch {
    return found.slice('csrf-token='.length);
  }
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
