/**
 * E-M2: 1 nguồn duy nhất quyết maxAge từ sb-remember-me flag.
 * Dùng ở CẢ client.ts setAll (browser) và middleware.ts setAll (Edge/refresh)
 * để refresh SSR không còn bypass remember-me (ghi 400 ngày).
 * Edge-safe: không import browser-only modules.
 */
export function applyRememberMePolicy(
  libMaxAge: number | null | undefined,
  isRemembered: boolean
): number | undefined {
  // Tôn trọng lệnh xoá tường minh của library
  if (libMaxAge === 0) return 0;
  return isRemembered ? 2592000 : undefined; // 30 ngày vs Session Cookie
}
