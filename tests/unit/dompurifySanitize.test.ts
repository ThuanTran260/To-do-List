import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../lib/clientSanitize';

describe('sanitizeHtml (client DOMPurify)', () => {
  it('strips malicious scripts and dangerous tags', () => {
    const dirty = '<p>An toàn</p><script>alert("hacked")</script><iframe src="javascript:alert(1)"></iframe>';
    const clean = sanitizeHtml(dirty);
    expect(clean).toContain('<p>An toàn</p>');
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('alert("hacked")');
    expect(clean).not.toContain('<iframe');
  });
});
