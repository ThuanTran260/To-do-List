/**
 * Offline Mutation Queue helper using localStorage.
 * Automatically queues failed mutations when network is offline,
 * and syncs them back when connection is restored.
 */

export interface PendingMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'flow_state_offline_queue';
const QUEUE_PREFIX = 'flow_state_offline_queue';
const MAX_QUEUE_SIZE = 100;

/**
 * E-M7: queue key theo user — queue user A không replay dưới session user B.
 * userId null → legacy key (backward-compat; offline queue hiện chưa có caller prod).
 */
export function queueKey(userId: string | null): string {
  if (!userId) return QUEUE_KEY;
  if (userId.includes(':')) throw new Error('Invalid user id for queue key');
  return `${QUEUE_PREFIX}_${userId}`;
}

export function getOfflineQueue(userId: string | null = null): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(queueKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(type: PendingMutation['type'], payload: unknown, userId: string | null = null): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue(userId);
    // Bounded queue: prevent unbounded growth
    if (queue.length >= MAX_QUEUE_SIZE) {
      queue.shift(); // evict oldest
    }
    queue.push({
      id: `off-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      type,
      payload,
      timestamp: Date.now(),
    });
    localStorage.setItem(queueKey(userId), JSON.stringify(queue));
  } catch {
    // LocalStorage quota or access error
  }
}

export function removeFromOfflineQueue(id: string, userId: string | null = null): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue(userId).filter((item) => item.id !== id);
    localStorage.setItem(queueKey(userId), JSON.stringify(queue));
  } catch {}
}

export function clearOfflineQueue(userId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId === undefined) {
      // Logout: xoá legacy + mọi namespaced queue
      Object.keys(localStorage)
        .filter((k) => k === QUEUE_KEY || k.startsWith(`${QUEUE_PREFIX}_`))
        .forEach((k) => localStorage.removeItem(k));
    } else {
      localStorage.removeItem(queueKey(userId));
    }
  } catch {}
}
