const MAX_FREE_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;
// Review fix (#8): failures decay sau 15 phút — 5 lỗi cách nhau cả tuần không còn lock.
const DECAY_MS = 15 * 60 * 1000;
const STORAGE_KEY = 'flowstate_auth_failures';

interface FailureState {
  count: number;
  firstAt: number;
}

function keyFor(scope: string): string {
  return `${STORAGE_KEY}:${scope}`;
}

function readState(scope: string): FailureState {
  if (typeof window === 'undefined') return { count: 0, firstAt: 0 };
  try {
    const raw = sessionStorage.getItem(keyFor(scope));
    if (!raw) return { count: 0, firstAt: 0 };
    // Backward-compat với format số thuần cũ
    if (/^\d+$/.test(raw)) return { count: Number(raw), firstAt: Date.now() };
    const parsed = JSON.parse(raw) as FailureState;
    if (typeof parsed.count !== 'number') return { count: 0, firstAt: 0 };
    // Decay: failures cũ hơn DECAY_MS không tính nữa
    if (Date.now() - (parsed.firstAt || 0) > DECAY_MS) {
      sessionStorage.removeItem(keyFor(scope));
      return { count: 0, firstAt: 0 };
    }
    return parsed;
  } catch {
    return { count: 0, firstAt: 0 };
  }
}

export function getLockoutMs(failCount: number): number {
  return failCount >= MAX_FREE_ATTEMPTS ? LOCKOUT_MS : 0;
}

export function recordFailure(scope = 'default'): number {
  if (typeof window === 'undefined') return 0;
  try {
    const state = readState(scope);
    const next: FailureState = {
      count: state.count + 1,
      firstAt: state.count === 0 ? Date.now() : state.firstAt,
    };
    sessionStorage.setItem(keyFor(scope), JSON.stringify(next));
    return next.count;
  } catch {
    return 0;
  }
}

export function clearFailures(scope = 'default'): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(keyFor(scope));
  } catch {}
}

export function getFailureCount(scope = 'default'): number {
  return readState(scope).count;
}
