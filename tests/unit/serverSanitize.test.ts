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

  it('lazily instantiates and reuses getPurify singleton instance', async () => {
    const { getPurify } = await import('@/lib/sanitize/serverSanitize');
    const purify1 = getPurify();
    const purify2 = getPurify();
    expect(purify1).toBeDefined();
    expect(typeof purify1.sanitize).toBe('function');
    expect(purify1).toBe(purify2);
  });

  it('preserves TipTap TaskList, TaskItem, and allowed data attributes', () => {
    const taskListHtml = '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Task 1</p></div></li></ul>';
    const sanitized = sanitizeHtmlServer(taskListHtml);
    expect(sanitized).toContain('data-type="taskList"');
    expect(sanitized).toContain('data-type="taskItem"');
    expect(sanitized).toContain('data-checked="true"');
    expect(sanitized).toContain('<input');
    expect(sanitized).toContain('type="checkbox"');
    expect(sanitized).toContain('checked');
    expect(sanitized).toContain('<label>');
    expect(sanitized).toContain('<div>');
  });

  it('preserves TipTap Highlight with data-color and strips unauthorized data attributes', () => {
    const highlightHtml = '<p data-exploit="hacked"><mark data-color="#fef08a">highlighted text</mark></p>';
    const sanitized = sanitizeHtmlServer(highlightHtml);
    expect(sanitized).toContain('<mark');
    expect(sanitized).toContain('data-color="#fef08a"');
    expect(sanitized).not.toContain('data-exploit');
  });

  it('maintains schema parity with client sanitizeHtml (SWMI)', async () => {
    const { sanitizeHtml } = await import('@/lib/clientSanitize');
    const complexTipTapHtml = '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p><mark data-color="#fef08a">Task with <strong>bold</strong></mark></p></div></li></ul>';
    const serverResult = sanitizeHtmlServer(complexTipTapHtml);
    const clientResult = sanitizeHtml(complexTipTapHtml);
    expect(serverResult).toBe(clientResult);
  });
});


