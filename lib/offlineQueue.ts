/**
 * Offline Mutation Queue helper using IndexedDB / localStorage.
 * Automatically queues failed mutations when network is offline,
 * and syncs them back when connection is restored.
 */

export interface PendingMutation {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: number;
}

const QUEUE_KEY = 'flow_state_offline_queue';

export function getOfflineQueue(): PendingMutation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(type: PendingMutation['type'], payload: any) {
  if (typeof window === 'undefined') return;
  const queue = getOfflineQueue();
  queue.push({
    id: 'off-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    type,
    payload,
    timestamp: Date.now(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(QUEUE_KEY);
}
