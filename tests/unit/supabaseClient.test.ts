import { describe, it, expect, beforeEach } from 'vitest';
import { parseDocumentCookies, buildCookieString } from '@/lib/supabase/client';

// jsdom: document.cookie là accessor đặc biệt — ghi qua assignment và xóa qua expires
// hoạt động, nhưng Object.defineProperty chỉ định nghĩa được 1 lần. Dùng helper
// override cookie string bằng cách định nghĩa lại property "self-replaceable".
let cookieJar = '';

function setCookieJar(value: string) {
  cookieJar = value;
  Object.defineProperty(document, 'cookie', {
    get() {
      return cookieJar;
    },
    set(v: string) {
      cookieJar = v;
    },
    configurable: true,
  });
}

describe('parseDocumentCookies', () => {
  beforeEach(() => {
    setCookieJar('');
  });

  it('returns empty array when no cookies', () => {
    expect(parseDocumentCookies()).toEqual([]);
  });

  it('decodes encoded token values', () => {
    setCookieJar('sb-token=hello%20world');
    const cookies = parseDocumentCookies();
    expect(cookies.find((c) => c.name === 'sb-token')?.value).toBe('hello world');
  });

  it('handles values containing = signs (base64 JWT)', () => {
    setCookieJar('sb-auth-token=eyJhbG.eyJzdWI.SflKxw==');
    const cookies = parseDocumentCookies();
    expect(cookies.find((c) => c.name === 'sb-auth-token')?.value).toBe('eyJhbG.eyJzdWI.SflKxw==');
  });

  it('returns raw value when decodeURIComponent throws (malformed %)', () => {
    setCookieJar('sb-bad=hello%zz');
    const cookies = parseDocumentCookies();
    expect(cookies.find((c) => c.name === 'sb-bad')?.value).toBe('hello%zz');
  });

  it('trims cookie names and skips empty segments', () => {
    setCookieJar('a=1; ; b=2');
    const cookies = parseDocumentCookies();
    expect(cookies).toEqual([
      { name: 'a', value: '1' },
      { name: 'b', value: '2' },
    ]);
  });
});

// L-01 core regression: remember-me cookie contract (Risk Mitigation table)
describe('buildCookieString (sb-remember-me maxAge contract)', () => {
  it('remember=true → max-age 30 ngày', () => {
    const str = buildCookieString('sb-token', 'val', {}, true, 'development');
    expect(str).toContain('max-age=2592000');
    expect(str).not.toContain('Secure');
  });

  it('remember=false → session cookie (không max-age)', () => {
    const str = buildCookieString('sb-token', 'val', {}, false, 'development');
    expect(str).not.toContain('max-age=');
    expect(str).not.toContain('Secure');
  });

  it('library maxAge:0 (xoá cookie) được tôn trọng kể cả khi remember=true', () => {
    const str = buildCookieString('sb-token', '', { maxAge: 0 }, true, 'development');
    expect(str).toContain('max-age=0');
  });

  it('encodes giá trị và giữ base64 padding (=)', () => {
    const str = buildCookieString('sb-auth', 'ab==cd', {}, false, 'development');
    expect(str).toContain('sb-auth=ab%3D%3Dcd');
  });

  it('prod thêm Secure flag', () => {
    const str = buildCookieString('sb-token', 'val', {}, false, 'production');
    expect(str).toContain('; Secure');
  });

  it('giữ path và sameSite từ options', () => {
    const str = buildCookieString('sb-token', 'val', { path: '/', sameSite: 'lax' }, false, 'development');
    expect(str).toContain('path=/');
    expect(str).toContain('SameSite=lax');
  });
});
