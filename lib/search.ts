const MAX_SEARCH_LEN = 100;

/**
 * E-M10: escape ký tự đặc biệt PostgREST cho .or()/.ilike().
 * Strip (thay vì quote) để đảm bảo .or() không bao giờ parse-fail
 * → tránh fallback âm thầm bỏ search filter. Giữ space nội bộ cho tiếng Việt.
 */
export function escapePostgrestLike(value: string): string {
  return value
    .replace(/[%,()"'\\_*;:`]/g, '')
    .trim()
    .slice(0, MAX_SEARCH_LEN);
}
