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

export async function refreshCsrfToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  try {
    const res = await fetch('/api/csrf-token', { credentials: 'same-origin' });
    if (!res.ok) return '';
    const data = (await res.json()) as { csrfToken?: string };
    return data.csrfToken || '';
  } catch {
    return '';
  }
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('x-csrf-token')) {
    let token = getCsrfToken();
    if (!token && typeof window !== 'undefined') {
      token = await refreshCsrfToken();
    }
    if (token) headers.set('x-csrf-token', token);
  }
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(input, { ...init, headers, credentials: 'same-origin' });

  // P0 RC3: Nếu nhận 403 CSRF, chủ động refresh token và retry đúng 1 lần.
  // Chỉ retry khi body xác nhận lỗi CSRF — 403 phân quyền thật phải trả về nguyên
  // vẹn cho caller (không refresh/retry vô ích, không che lỗi gốc). Đọc qua clone()
  // để caller vẫn đọc được body gốc sau này.
  if (res.status === 403 && typeof window !== 'undefined') {
    let isCsrfError = false;
    try {
      const body = (await res.clone().json()) as { error?: string };
      isCsrfError = body?.error === 'Invalid CSRF token';
    } catch {
      isCsrfError = false;
    }
    if (isCsrfError) {
      const newToken = await refreshCsrfToken();
      if (newToken) {
        headers.set('x-csrf-token', newToken);
        res = await fetch(input, { ...init, headers, credentials: 'same-origin' });
      }
    }
  }

  return res;
}

