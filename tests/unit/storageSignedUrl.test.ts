import { describe, it, expect } from 'vitest';
import { extractPath } from '@/lib/storage/signedUrl';

describe('extractPath', () => {
  it('extracts path from public URL with task-attachments', () => {
    expect(
      extractPath(
        'https://xxx.supabase.co/storage/v1/object/public/task-attachments/user1/task-123.webp'
      )
    ).toBe('user1/task-123.webp');
  });

  it('extracts path from public URL with avatars', () => {
    expect(
      extractPath(
        'https://xxx.supabase.co/storage/v1/object/public/avatars/user-99/avatar.png'
      )
    ).toBe('user-99/avatar.png');
  });

  it('extracts path from legacy public URL with avatars at root', () => {
    expect(
      extractPath(
        'https://xxx.supabase.co/storage/v1/object/public/avatars/avatar-user-99-12345.webp?v=1'
      )
    ).toBe('avatar-user-99-12345.webp');
  });

  it('returns null for non-storage URL and external OAuth avatar URLs', () => {
    expect(extractPath('https://example.com/foo.jpg')).toBeNull();
    expect(extractPath('https://lh3.googleusercontent.com/a/ACg8ocLxxx=s96-c')).toBeNull();
  });

  it('strips query params from URL properly (MD-01)', () => {
    expect(
      extractPath(
        'https://xxx.supabase.co/storage/v1/object/public/task-attachments/user1/a.webp?token=abc&v=1'
      )
    ).toBe('user1/a.webp');
  });

  it('handles relative path string directly', () => {
    expect(extractPath('user1/task-456.webp')).toBe('user1/task-456.webp');
    expect(extractPath('user1/task-456.webp?token=xyz')).toBe('user1/task-456.webp');
    expect(extractPath('user1/avatar-789.webp')).toBe('user1/avatar-789.webp');
    expect(extractPath('avatar-user1-789.webp')).toBe('avatar-user1-789.webp');
  });

  it('handles null, undefined and empty strings', () => {
    expect(extractPath(null)).toBeNull();
    expect(extractPath(undefined)).toBeNull();
    expect(extractPath('')).toBeNull();
    expect(extractPath('   ')).toBeNull();
  });
});
