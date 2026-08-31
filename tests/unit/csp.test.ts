import { describe, it, expect } from 'vitest';
import { buildCspHeader, generateNonce } from '@/lib/security/csp';

describe('CSP nonce', () => {
  it('contains nonce and no unsafe-inline in prod script-src', () => {
    const nonce = generateNonce();
    const header = buildCspHeader(nonce, false);
    const scriptSrc = header.split('; ').find((d) => d.startsWith('script-src'));
    expect(scriptSrc).toContain(`'nonce-${nonce}'`);
    expect(scriptSrc).not.toContain(`'unsafe-inline'`);
    expect(scriptSrc).not.toContain('https:');
  });

  it('allows unsafe-eval only in dev', () => {
    expect(buildCspHeader('abc', true)).toContain('unsafe-eval');
    expect(buildCspHeader('abc', false)).not.toContain('unsafe-eval');
  });

  it('style-src uses unsafe-inline WITHOUT nonce (C-2: nonce blocks style attributes)', () => {
    const header = buildCspHeader('xyz', false);
    const styleSrc = header.split('; ').find((d) => d.startsWith('style-src'));
    expect(styleSrc).toContain("'unsafe-inline'");
    expect(styleSrc).not.toContain("'nonce-");
  });

  it('allows Google OAuth avatars (I-2)', () => {
    const header = buildCspHeader('xyz', false);
    expect(header).toContain('https://*.googleusercontent.com');
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
