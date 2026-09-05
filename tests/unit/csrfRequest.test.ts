import { describe, it, expect } from 'vitest';
import { generateCsrfToken, validateCsrfRequest } from '@/lib/security/csrf';

describe('validateCsrfRequest (E-M1)', () => {
  it('accepts matching header + cookie', () => {
    const t = generateCsrfToken();
    const req = new Request('https://x.test/api', { headers: { 'x-csrf-token': t } });
    expect(validateCsrfRequest(req, t)).toBe(true);
  });

  it('rejects missing header', () => {
    const req = new Request('https://x.test/api');
    expect(validateCsrfRequest(req, generateCsrfToken())).toBe(false);
  });

  it('rejects mismatched pair', () => {
    const req = new Request('https://x.test/api', { headers: { 'x-csrf-token': 'aaa' } });
    expect(validateCsrfRequest(req, 'bbb')).toBe(false);
  });
});
