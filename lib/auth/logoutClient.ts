'use client';

import { clearAllNoteDrafts } from '@/lib/notesDraftSync';
import { clearOfflineQueue } from '@/lib/offlineQueue';
import { toast } from 'sonner';

/**
 * Client-side logout helper (FIX MD-13).
 * POST /auth/logout kèm double-submit CSRF token, rồi hard redirect về /login.
 * Tất cả logout callers (Sidebar, Navbar, LoginForm, SignupForm) phải đi qua đây.
 *
 * E-M7: purge TẬP TRUNG tại đây — xoá sb-* (auth storage), mọi draft prefix,
 * mọi offline queue key, rồi mới POST logout. Sidebar/Navbar KHÔNG purge riêng nữa
 * (tránh 4 nơi phân mảnh + sót key như flow_state_offline_queue_*).
 */
export async function performLogout(): Promise<void> {
  // 1. Purge client storage trước (server không xoá được localStorage)
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-'))
      .forEach((key) => localStorage.removeItem(key));
  } catch {}
  try {
    clearAllNoteDrafts();
  } catch {}
  try {
    clearOfflineQueue();
  } catch {}
  try {
    sessionStorage.clear();
  } catch {}

  // 2. Server logout (thu hồi global + expire cookies)
  let csrfToken = '';
  try {
    csrfToken =
      document.cookie
        .split('; ')
        .find((c) => c.startsWith('csrf-token='))
        ?.split('=')[1] ?? '';
  } catch {}

  // E-M3: check response — nếu server unreachable, thu hồi local + báo user
  // (trước đây catch{} rồi redirect câm, user tưởng đã logout nhưng session còn sống).
  let ok = false;
  try {
    const res = await fetch('/auth/logout', {
      method: 'POST',
      headers: { 'x-csrf-token': csrfToken },
      body: JSON.stringify({}),
      credentials: 'same-origin',
    });
    ok = res.ok;
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      await createClient().auth.signOut({ scope: 'local' });
    } catch {}
    // Review fix: toast thay alert blocking (AppToaster/sonner đã mount ở layout).
    // Redirect cứng bên dưới vẫn chạy — user thấy toast trên trang /login.
    try {
      toast.error('Đăng xuất server thất bại. Phiên cục bộ đã xoá — hãy đăng xuất lại khi có mạng.');
      await new Promise((r) => setTimeout(r, 1200));
    } catch {}
  }

  // Ép chuyển hướng cứng (hard navigation) để xóa sạch state + cache
  window.location.href = '/login';
}
