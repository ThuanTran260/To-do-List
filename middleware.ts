import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Flow State Root Middleware
 *
 * Next.js Middleware entry point. Runs on all matched requests to:
 * 1. Generate dynamic per-request nonces for CSP security.
 * 2. Validate and refresh Supabase auth session tokens via @supabase/ssr.
 * 3. Enforce route protection (/dashboard/* -> /login, /login & /signup -> /dashboard).
 * 4. Apply security headers (CSP, HSTS, X-Frame-Options, etc.).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Media/font file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .woff, .woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
