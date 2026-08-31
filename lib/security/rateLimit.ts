// In-memory sliding window rate limiter — không Upstash (Decision #1, 2026-08-31).
// NOTE: KHÔNG hoạt động cross-instance trên Vercel Serverless (mỗi cold start có Map riêng).
// Trade-off chấp nhận được cho portfolio scale thấp. Nếu cần distributed, migrate sang Supabase table rate_limits.
// Xem MD-05: auth check phải TRƯỚC rateLimit để tránh bucket "undefined" bị drain.
const hits = new Map<string, number[]>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer || typeof setInterval === 'undefined') return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, arr] of hits.entries()) {
      const filtered = arr.filter((t) => now - t < 60000);
      if (filtered.length === 0) hits.delete(key);
      else hits.set(key, filtered);
    }
  }, CLEANUP_INTERVAL_MS);
  // Allow process to exit even if timer is pending (test/edge runtime friendliness)
  if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();
}

export function checkRateLimit(key: string, limit = 20, windowMs = 60000): boolean {
  ensureCleanup();
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  hits.set(key, arr);
  return true;
}

export function resetRateLimit(key: string) {
  hits.delete(key);
}
