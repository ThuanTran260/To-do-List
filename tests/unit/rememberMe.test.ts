import { describe, it, expect } from 'vitest';
import { applyRememberMePolicy } from '@/lib/security/rememberMe';

describe('applyRememberMePolicy (E-M2)', () => {
  it('remembered → 30 days regardless of library default', () => {
    expect(applyRememberMePolicy(400 * 86400, true)).toBe(2592000);
    expect(applyRememberMePolicy(undefined, true)).toBe(2592000);
  });

  it('not remembered → session (undefined)', () => {
    expect(applyRememberMePolicy(400 * 86400, false)).toBeUndefined();
  });

  it('explicit removal (0) respected even when remembered', () => {
    expect(applyRememberMePolicy(0, true)).toBe(0);
  });
});
