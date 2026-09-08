import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteTaskImage } from '@/lib/storage';

// Mock Supabase client
const mockRemove = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        remove: mockRemove,
      }),
    },
  }),
}));

describe('deleteTaskImage variadic cascade deletion', () => {
  beforeEach(() => {
    mockRemove.mockReset();
    mockRemove.mockResolvedValue({ error: null });
  });

  it('deletes both full and thumbnail paths in a single remove call', async () => {
    await deleteTaskImage('user1/task-full.webp', 'user1/task-thumb.webp');
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith(['user1/task-full.webp', 'user1/task-thumb.webp']);
  });

  it('deduplicates identical paths and filters null/undefined', async () => {
    await deleteTaskImage(
      'user1/task-full.webp',
      null,
      'user1/task-full.webp',
      undefined,
      'https://xxx.supabase.co/storage/v1/object/public/task-attachments/user1/task-thumb.webp?v=1'
    );
    expect(mockRemove).toHaveBeenCalledTimes(1);
    expect(mockRemove).toHaveBeenCalledWith(['user1/task-full.webp', 'user1/task-thumb.webp']);
  });

  it('does not invoke remove if no valid paths are passed', async () => {
    await deleteTaskImage(null, undefined, '');
    expect(mockRemove).not.toHaveBeenCalled();
  });
});
