import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * C-08/S-08 fix: single factory cho server-side Supabase client.
 * Thay 4 nơi duplicate getAll/setAll boilerplate (middleware.ts, server.ts,
 * notes/sync/route.ts, logout/route.ts) — chuẩn cookie options đồng nhất,
 * fail-closed khi thiếu env (không tạo client giả với placeholder key).
 */

export const SUPABASE_PLACEHOLDER_URL = 'https://placeholder.supabase.co';

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes('placeholder') && !url.includes('xxxx.supabase.co'));
}

/**
 * Tạo server client từ next/headers cookieStore.
 * cookieStore là đối tượng có getAll/set (CookieMethodsServer của @supabase/ssr).
 */
export function createServerSupabaseClient(cookieStore: {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: object) => void;
}): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('placeholder')) {
    throw new Error('[Supabase Server] Missing or placeholder environment configuration');
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component context không cho set cookie — @supabase/ssr docs khuyến nghị ignore
        }
      },
    },
  });
}
