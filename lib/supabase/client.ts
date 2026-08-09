import { createBrowserClient } from '@supabase/ssr';

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

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

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

        const currentCookies = parseDocumentCookies();
        const isRemembered = currentCookies.some(
          (c) => c.name === 'sb-remember-me' && c.value === 'true'
        );

        cookiesToSet.forEach(({ name, value, options }) => {
          const maxAge = isRemembered ? 2592000 : undefined; // 30 ngày vs Session Cookie
          let cookieStr = `${name}=${encodeURIComponent(value)}; path=${options?.path || '/'}; SameSite=${options?.sameSite || 'Lax'}`;

          if (options?.domain) {
            cookieStr += `; domain=${options.domain}`;
          }

          if (maxAge) {
            cookieStr += `; max-age=${maxAge}`;
          }

          if (process.env.NODE_ENV === 'production') {
            cookieStr += '; Secure';
          }

          document.cookie = cookieStr;
        });
      },
    },
  });
}
