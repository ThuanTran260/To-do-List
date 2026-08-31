'use client';

/**
 * Client-side logout helper (FIX MD-13).
 * POST /auth/logout kèm double-submit CSRF token, rồi hard redirect về /login.
 * Tất cả logout callers (Sidebar, Navbar, LoginForm, SignupForm) phải đi qua đây.
 */
export async function performLogout(): Promise<void> {
  let csrfToken = '';
  try {
    csrfToken =
      document.cookie
        .split('; ')
        .find((c) => c.startsWith('csrf-token='))
        ?.split('=')[1] ?? '';
  } catch {}

  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({}),
      credentials: 'same-origin',
    });
  } catch {
    // Network error — vẫn redirect về /login để dọn UI phía client
  }

  // Ép chuyển hướng cứng (hard navigation) để xóa sạch state + cache
  window.location.href = '/login';
}
