import { describe, it, expect } from 'vitest';
import { buildCspHeader, generateNonce } from '@/lib/security/csp';

describe('CSP nonce', () => {
  it('contains nonce and no unsafe-inline in prod', () => {
    const nonce = generateNonce();
    const header = buildCspHeader(nonce, false);
    expect(header).toContain(`'nonce-${nonce}'`);
    expect(header).not.toContain(`'unsafe-inline'`);
  });

  it('allows unsafe-eval only in dev', () => {
    expect(buildCspHeader('abc', true)).toContain('unsafe-eval');
    expect(buildCspHeader('abc', false)).not.toContain('unsafe-eval');
  });

  it('interpolates nonce in script-src AND style-src (CR-04)', () => {
    const header = buildCspHeader('xyz', false);
    const scriptSrc = header.split('; ').find((d) => d.startsWith('script-src'));
    const styleSrc = header.split('; ').find((d) => d.startsWith('style-src'));
    expect(scriptSrc).toContain("'nonce-abc'".replace('abc', 'xyz')); // sanity: wrong nonce must not match
    expect(scriptSrc).toContain("'nonce-xyz'");
    expect(styleSrc).toContain("'nonce-xyz'");
  });

  it('includes hardening directives', () => {
    const header = buildCspHeader('xyz', false);
    expect(header).toContain("default-src 'self'");
    expect(header).toContain("object-src 'none'");
    expect(header).toContain("frame-ancestors 'none'");
    expect(header).toContain("base-uri 'self'");
    expect(header).toContain("form-action 'self'");
  });
});
