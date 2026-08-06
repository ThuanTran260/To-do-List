import { type NextRequest } from 'next/server';
import { updateProxy } from '@/lib/supabase/middleware';

/**
 * Next.js 16 Proxy — Entry Point
 *
 * Next.js 16 renamed the file convention:
 *   middleware.ts → proxy.ts
 *   export function middleware() → export function proxy()
 *
 * This file MUST be named `proxy.ts` at the project root to be automatically
 * picked up by Next.js 16+.
 *
 * Delegates all logic to updateProxy() which handles:
 * - Supabase session validation & token refresh via getUser()
 * - Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * - Route protection (/dashboard → /login if unauthenticated)
 * - Auth route redirect (/login, /signup → /dashboard if authenticated)
 */
export async function proxy(request: NextRequest) {
  return await updateProxy(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (Next.js static assets)
     * - _next/image   (Next.js image optimization)
     * - favicon.ico   (browser favicon)
     * - Image/font file extensions
     *
     * This ensures proxy runs on all pages so session refresh and
     * security headers are always applied.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
