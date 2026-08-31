import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfToken } from '@/lib/security/csrf';

describe('csrf double-submit', () => {
  it('rejects mismatched tokens', () => {
    const a = generateCsrfToken();
    const b = generateCsrfToken();
    expect(validateCsrfToken(a, b)).toBe(false);
  });

  it('accepts matching tokens', () => {
    const t = generateCsrfToken();
    expect(validateCsrfToken(t, t)).toBe(true);
  });

  it('rejects empty token', () => {
    expect(validateCsrfToken('', 'abc')).toBe(false);
  });

  it('rejects undefined cookie token', () => {
    expect(validateCsrfToken('abc', undefined as unknown as string)).toBe(false);
  });

  it('generates 64-char hex tokens', () => {
    const t = generateCsrfToken();
    expect(t).toMatch(/^[a-f0-9]{64}$/);
  });
});
