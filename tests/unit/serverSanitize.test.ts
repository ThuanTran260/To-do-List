import { describe, it, expect } from 'vitest';
import { sanitizeHtmlServer } from '@/lib/sanitize/serverSanitize';

describe('serverSanitize', () => {
  it('strips svg onload in SSR', () => {
    expect(sanitizeHtmlServer('<svg onload=alert(1)><p>hi</p></svg>')).not.toContain('onload');
  });

  it('strips img onerror', () => {
    expect(sanitizeHtmlServer('<p>x</p><img src=x onerror=alert(1)>')).not.toContain('onerror');
  });

  it('strips script even via malformed nesting', () => {
    const out = sanitizeHtmlServer('<scr<script>ipt>alert(1)</scr<script>ipt>');
    // Không còn tag script; text dư còn lại là inert (đã escape &gt;)
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onload');
  });

  it('keeps allowed marks and structure', () => {
    expect(sanitizeHtmlServer('<p><mark>hi</mark></p>')).toContain('<mark>');
    expect(sanitizeHtmlServer('<ul><li>item</li></ul>')).toContain('<li>');
  });

  it('strips style attribute (S-03)', () => {
    expect(sanitizeHtmlServer('<p style="color:red">x</p>')).not.toContain('style=');
  });

  it('returns empty for falsy input', () => {
    expect(sanitizeHtmlServer('')).toBe('');
    expect(sanitizeHtmlServer(null as unknown as string)).toBe('');
  });
});
