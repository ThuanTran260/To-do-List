import { describe, it, expect } from 'vitest';
import { noteCreateSchema, noteUpdateSchema } from '@/lib/validations/note';
import { sanitizeHtmlServer } from '@/lib/sanitize/serverSanitize';
import { getCsrfToken } from '@/lib/security/csrfClient';

describe('notes write contract (E-H1)', () => {
  it('create schema rejects oversize content', () => {
    const res = noteCreateSchema.safeParse({ title: 't', content: 'x'.repeat(524289) });
    expect(res.success).toBe(false);
  });

  it('server sanitize strips event handlers before DB write', () => {
    const dirty = '<p>hi</p><img src=x onerror=alert(1)>';
    const clean = sanitizeHtmlServer(dirty);
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('<p>hi</p>');
  });

  it('update schema requires valid fields only', () => {
    const res = noteUpdateSchema.safeParse({ content: '<svg onload=alert(1)>' });
    expect(res.success).toBe(true); // schema pass, sanitize xử lý ở route
    expect(sanitizeHtmlServer('<svg onload=alert(1)>')).not.toContain('onload');
  });

  it('getCsrfToken returns empty string server-side', () => {
    expect(getCsrfToken()).toBe('');
  });

  it('preserves TipTap task list content on note creation payload validation and sanitization', () => {
    const rawContent = '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Complete review</p></div></li></ul>';
    const parsed = noteCreateSchema.safeParse({
      title: 'Review Task',
      content: rawContent,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const sanitized = sanitizeHtmlServer(parsed.data.content);
      expect(sanitized).toContain('data-type="taskList"');
      expect(sanitized).toContain('data-type="taskItem"');
      expect(sanitized).toContain('data-checked="true"');
      expect(sanitized).toContain('Complete review');
    }
  });
});

