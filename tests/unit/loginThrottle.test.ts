import { describe, it, expect } from 'vitest';
import { getLockoutMs } from '@/lib/auth/loginThrottle';

describe('getLockoutMs (E-H2 client backoff)', () => {
  it('no lockout under 5 failures', () => {
    expect(getLockoutMs(0)).toBe(0);
    expect(getLockoutMs(4)).toBe(0);
  });

  it('30s lockout from 5th failure', () => {
    expect(getLockoutMs(5)).toBe(30_000);
    expect(getLockoutMs(20)).toBe(30_000);
  });
});
