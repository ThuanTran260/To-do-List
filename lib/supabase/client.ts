import { createBrowserClient } from '@supabase/ssr';
import { applyRememberMePolicy } from '@/lib/security/rememberMe';

/**
 * L-01 fix: khôi phục logic fix.md:32-101 — trước đây client bị regressed về
 * createBrowserClient trần, khiến sb-remember-me mất tác dụng và token
 * không được decode đối xứng.
 */

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export function parseDocumentCookies() {
  if (typeof document === 'undefined' || !document.cookie) return [];
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((c) => {
      const [name, ...val] = c.split('=');
      return {
        name: name.trim(),
        value: safeDecode(val.join('=')),
      };
    });
}

/**
 * Pure helper cho test — build cookie string với sb-remember-me contract.
 * Được export để unit test có thể kiểm tra maxAge/Secure/encode mà không cần mock document.
 */
export function buildCookieString(
  name: string,
  value: string,
  options: { path?: string; domain?: string; sameSite?: string; maxAge?: number | null } | undefined,
  isRemembered: boolean,
  env: string = process.env.NODE_ENV || 'development'
): string {
  // B11a: single source of truth từ rememberMe.ts (thay logic inline trùng lặp)
  const maxAge = applyRememberMePolicy(options?.maxAge ?? null, isRemembered);
  let cookieStr = `${name}=${encodeURIComponent(value)}; path=${options?.path || '/'}; SameSite=${options?.sameSite || 'Lax'}`;

  if (options?.domain) {
    cookieStr += `; domain=${options.domain}`;
  }

  if (maxAge !== undefined) {
    cookieStr += `; max-age=${maxAge}`;
  }

  if (env === 'production') {
    cookieStr += '; Secure';
  }

  return cookieStr;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  // E-M15: fail-closed ở prod khi thiếu env — misconfig lộ rõ thay vì chạy câm
  // với backend giả (server-side đã fail-closed; đây là phía browser).
  if (process.env.NODE_ENV === 'production' && url.includes('placeholder')) {
    throw new Error('[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL in production');
  }

  if (process.env.NODE_ENV !== 'production' && url.includes('placeholder')) {
    console.warn('[Supabase Client] NEXT_PUBLIC_SUPABASE_URL chưa được cấu hình. Đang dùng SSG fallback mode.');
  }

  return createBrowserClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseDocumentCookies();
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;

        // S-08 partial: đọc remember-me CỤC BỘ bằng parseDocumentCookies (đã decode đối xứng)
        const currentCookies = parseDocumentCookies();
        const isRemembered = currentCookies.some(
          (c) => c.name === 'sb-remember-me' && c.value === 'true'
        );

        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = buildCookieString(name, value, options as never, isRemembered);
        });
      },
    },
  });
}
