import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

type SupabaseClient = ReturnType<typeof createServerClient>;

/**
 * Shared auth wrapper cho mọi future API route (FIX MD-12).
 * Dedup boilerplate createServerClient + getUser — fail-closed 401 nếu chưa đăng nhập.
 */
export function withAuth(
  handler: (
    req: Request,
    user: { id: string; email?: string },
    supabase: SupabaseClient
  ) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, user, supabase);
  };
}
