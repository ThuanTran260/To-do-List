import { sanitizeHtml } from '../../lib/clientSanitize';
import assert from 'node:assert';
import test from 'node:test';

test('sanitizeHtml: strips malicious scripts and dangerous tags', () => {
  const dirty = '<p>An toàn</p><script>alert("hacked")</script><iframe src="javascript:alert(1)"></iframe>';
  const clean = sanitizeHtml(dirty);
  assert.ok(clean.includes('<p>An toàn</p>'));
  assert.ok(!clean.includes('<script>'));
  assert.ok(!clean.includes('alert("hacked")'));
  assert.ok(!clean.includes('<iframe'));
});
