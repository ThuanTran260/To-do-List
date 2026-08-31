import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from '@/lib/offlineQueue';

describe('offlineQueue', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds mutations to queue and retrieves them', () => {
    addToOfflineQueue('CREATE', { title: 'Test Task' });
    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].type).toBe('CREATE');
    expect(queue[0].payload).toEqual({ title: 'Test Task' });
    expect(queue[0].id).toMatch(/^off-\d+-[a-f0-9-]+$/);
  });

  it('removes specific item from queue', () => {
    addToOfflineQueue('CREATE', { title: 'Task 1' });
    addToOfflineQueue('UPDATE', { title: 'Task 2' });
    const queueBefore = getOfflineQueue();
    expect(queueBefore.length).toBe(2);

    removeFromOfflineQueue(queueBefore[0].id);
    const queueAfter = getOfflineQueue();
    expect(queueAfter.length).toBe(1);
    expect(queueAfter[0].payload).toEqual({ title: 'Task 2' });
  });

  it('clears entire queue', () => {
    addToOfflineQueue('CREATE', { title: 'Task 1' });
    addToOfflineQueue('DELETE', { id: 'todo-1' });
    expect(getOfflineQueue().length).toBe(2);

    clearOfflineQueue();
    expect(getOfflineQueue()).toEqual([]);
  });
});
