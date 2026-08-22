import { normalizeSearchText, extractPlainText } from '../../lib/textHighlight';
import assert from 'node:assert';
import test from 'node:test';

test('normalizeSearchText: removes Vietnamese accents correctly', () => {
  assert.strictEqual(normalizeSearchText('Kế hoạch tuần tới'), 'ke hoach tuan toi');
  assert.strictEqual(normalizeSearchText('Đồng hồ thế giới'), 'dong ho the gioi');
  assert.strictEqual(normalizeSearchText('Ý tưởng & Mục tiêu'), 'y tuong & muc tieu');
  assert.strictEqual(normalizeSearchText('  HỌP NHÓM  '), 'hop nhom');
});

test('extractPlainText: strips HTML tags preserving plain text', () => {
  const html = '<h1>Tiêu đề</h1><p>Nội dung <strong>in đậm</strong> và <mark data-color="#fef08a">highlight</mark></p>';
  const plain = extractPlainText(html);
  assert.ok(plain.includes('Tiêu đề'));
  assert.ok(plain.includes('in đậm'));
  assert.ok(plain.includes('highlight'));
  assert.ok(!plain.includes('<h1>'));
  assert.ok(!plain.includes('<strong>'));
  assert.ok(!plain.includes('<mark'));
});
