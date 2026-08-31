import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, resetRateLimit } from '@/lib/security/rateLimit';

describe('in-memory rate limit', () => {
  beforeEach(() => {
    resetRateLimit('test-key');
  });

  it('allows under limit, blocks over', () => {
    for (let i = 0; i < 20; i++) expect(checkRateLimit('test-key', 20, 60000)).toBe(true);
    expect(checkRateLimit('test-key', 20, 60000)).toBe(false);
  });

  it('isolates keys independently', () => {
    for (let i = 0; i < 20; i++) checkRateLimit('test-key', 20, 60000);
    expect(checkRateLimit('test-key', 20, 60000)).toBe(false);
    expect(checkRateLimit('other-key', 20, 60000)).toBe(true);
  });

  it('allows again after window expires', async () => {
    for (let i = 0; i < 20; i++) checkRateLimit('test-key', 20, 5);
    expect(checkRateLimit('test-key', 20, 5)).toBe(false);
    // window of 5ms has passed
    await new Promise((r) => setTimeout(r, 10));
    expect(checkRateLimit('test-key', 20, 5)).toBe(true);
  });
});
