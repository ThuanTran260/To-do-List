import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (process.env.NODE_ENV !== 'production' && url.includes('placeholder')) {
    console.warn('[Supabase Client] NEXT_PUBLIC_SUPABASE_URL chưa được cấu hình. Đang dùng SSG fallback mode.');
  }

  return createBrowserClient(url, anonKey);
}
