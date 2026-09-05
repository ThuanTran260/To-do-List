import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateCsrfRequest } from '@/lib/security/csrf';

type SupabaseClient = ReturnType<typeof createServerClient>;

export type WithAuthSupabaseClient = SupabaseClient;

/**
 * Shared auth wrapper cho mọi future API route (FIX MD-12).
 * Dedup boilerplate createServerClient + getUser — fail-closed 401 nếu chưa đăng nhập.
 */
export interface WithAuthContext {
  params?: Promise<Record<string, string>>;
}

// Review fix (#12): type tường minh thay `any` — khớp Next route ctx shape.
// B10: B10 CHỈ thêm `options`, KHÔNG đụng signature/ctx passthrough (SEC CR-1).
export function withAuth(
  handler: (
    req: Request,
    user: { id: string; email?: string },
    supabase: WithAuthSupabaseClient,
    ctx?: WithAuthContext
  ) => Promise<Response>,
  options: { requireCsrf?: boolean } = {}
) {
  return async (req: Request, ctx?: WithAuthContext): Promise<Response> => {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    });

    // I-4 fix (review): getUser phải được guard — lỗi mạng tạm thời trả 503 có cấu trúc,
    // không để exception nổ ra default 500 của Next.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // E-M1: CSRF double-submit cho first-party POST (opt-in từng route)
      if (options.requireCsrf) {
        const cookieToken = cookieStore.get('csrf-token')?.value;
        if (!validateCsrfRequest(req, cookieToken)) {
          return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
        }
      }

      return handler(req, user, supabase, ctx);
    } catch (err) {
      console.error('[withAuth] getUser failed', err);
      return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });
    }
  };
}
