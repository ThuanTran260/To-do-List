import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Flow State Root Middleware Entry Point
 *
 * Universal Edge Middleware entrypoint recognized by Vercel Edge Router.
 * Delegates session validation, token refresh, and security headers to updateSession().
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
     * - /api/* (API routes — auth do withAuth xử lý, tiết kiệm 1 getUser roundtrip;
     *   CSP/nonce không cần cho JSON; HSTS còn ở next.config/vercel.json)
     * - Media/font file extensions (.svg, .png, .jpg, .jpeg, .gif, .webp, .ico, .woff, .woff2)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
