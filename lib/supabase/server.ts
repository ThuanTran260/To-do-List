import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/createSupabaseClients';

/**
 * Server client cho Server Components / Route Handlers.
 * Delegate sang createSupabaseClients factory (C-08) — fail-closed khi thiếu env.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient(cookieStore);
}
