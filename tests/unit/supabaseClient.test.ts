import { describe, it, expect, beforeEach } from 'vitest';
import { parseDocumentCookies } from '@/lib/supabase/client';

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
