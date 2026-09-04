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
const MAX_QUEUE_SIZE = 100;

export function getOfflineQueue(): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(type: PendingMutation['type'], payload: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue();
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
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // LocalStorage quota or access error
  }
}

export function removeFromOfflineQueue(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const queue = getOfflineQueue().filter((item) => item.id !== id);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function clearOfflineQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}
