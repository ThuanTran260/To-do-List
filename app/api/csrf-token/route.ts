import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rateLimit';

/**
 * GET /api/csrf-token
 * Cấp mới csrf-token cookie (httpOnly: false) và trả về token dạng JSON.
 * Cho phép client tự phục hồi token khi cookie bị rớt hoặc hết hạn sau logout.
 */
export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'client';
  if (!checkRateLimit(`csrf:token:${ip}`, 60, 60000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const token = generateCsrfToken();
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.json({ csrfToken: token });

  response.cookies.set('csrf-token', token, {
    httpOnly: false,
    sameSite: 'strict',
    secure: isProd,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
  });

  return response;
}
