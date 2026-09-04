const MAX_FREE_ATTEMPTS = 5;
const LOCKOUT_MS = 30_000;
const STORAGE_KEY = 'flowstate_auth_failures';

export function getLockoutMs(failCount: number): number {
  return failCount >= MAX_FREE_ATTEMPTS ? LOCKOUT_MS : 0;
}

export function recordFailure(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const count = Number(sessionStorage.getItem(STORAGE_KEY) || 0) + 1;
    sessionStorage.setItem(STORAGE_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}

export function clearFailures(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function getFailureCount(): number {
  if (typeof window === 'undefined') return 0;
  return Number(sessionStorage.getItem(STORAGE_KEY) || 0) || 0;
}
