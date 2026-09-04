import { describe, it, expect } from 'vitest';
import { getCsrfToken } from '@/lib/security/csrfClient';

describe('getCsrfToken parsing (review #17)', () => {
  it('reads token with standard separator', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'a=1; csrf-token=abc123; b=2',
      configurable: true,
    });
    expect(getCsrfToken()).toBe('abc123');
  });

  it('reads token without space after semicolon', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'a=1;csrf-token=xyz789',
      configurable: true,
    });
    expect(getCsrfToken()).toBe('xyz789');
  });

  it('returns empty when cookie missing', () => {
    Object.defineProperty(document, 'cookie', { value: 'a=1', configurable: true });
    expect(getCsrfToken()).toBe('');
  });
});
