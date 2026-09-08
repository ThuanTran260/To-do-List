import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBatchSignedTaskImageUrls } from '@/lib/storage/signedUrl';

const mockCreateSignedUrls = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        createSignedUrls: mockCreateSignedUrls,
      }),
    },
  }),
}));

describe('getBatchSignedTaskImageUrls', () => {
  beforeEach(() => {
    mockCreateSignedUrls.mockReset();
  });

  it('requests signed URLs with 7-day TTL (604800s) by default', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: 'user/thumb1.webp', signedUrl: 'https://signed.url/1', error: null },
        { path: 'user/thumb2.webp', signedUrl: 'https://signed.url/2', error: null },
      ],
      error: null,
    });

    const result = await getBatchSignedTaskImageUrls(['user/thumb1.webp', 'user/thumb2.webp']);
    expect(mockCreateSignedUrls).toHaveBeenCalledWith(['user/thumb1.webp', 'user/thumb2.webp'], 604800);
    expect(result).toEqual({
      'user/thumb1.webp': 'https://signed.url/1',
      'user/thumb2.webp': 'https://signed.url/2',
    });
  });

  it('handles per-item error without failing the entire batch', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: [
        { path: 'user/thumb1.webp', signedUrl: 'https://signed.url/1', error: null },
        { path: 'user/missing.webp', signedUrl: null, error: 'Object not found' },
      ],
      error: null,
    });

    const result = await getBatchSignedTaskImageUrls(['user/thumb1.webp', 'user/missing.webp']);
    expect(result).toEqual({
      'user/thumb1.webp': 'https://signed.url/1',
      'user/missing.webp': null,
    });
  });

  it('throws when top-level batch network error occurs', async () => {
    mockCreateSignedUrls.mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    await expect(getBatchSignedTaskImageUrls(['user/thumb1.webp'])).rejects.toThrow('Network error');
  });

  it('returns empty record when empty array is passed', async () => {
    const result = await getBatchSignedTaskImageUrls([]);
    expect(result).toEqual({});
    expect(mockCreateSignedUrls).not.toHaveBeenCalled();
  });
});
