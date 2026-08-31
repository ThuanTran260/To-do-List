import { describe, it, expect } from 'vitest';
import { normalizeSearchText, extractPlainText } from '../../lib/textHighlight';

describe('normalizeSearchText', () => {
  it('removes Vietnamese accents correctly', () => {
    expect(normalizeSearchText('Kế hoạch tuần tới')).toBe('ke hoach tuan toi');
    expect(normalizeSearchText('Đồng hồ thế giới')).toBe('dong ho the gioi');
    expect(normalizeSearchText('Ý tưởng & Mục tiêu')).toBe('y tuong & muc tieu');
    expect(normalizeSearchText('  HỌP NHÓM  ')).toBe('hop nhom');
  });
});

describe('extractPlainText', () => {
  it('strips HTML tags preserving plain text', () => {
    const html = '<h1>Tiêu đề</h1><p>Nội dung <strong>in đậm</strong> và <mark data-color="#fef08a">highlight</mark></p>';
    const plain = extractPlainText(html);
    expect(plain).toContain('Tiêu đề');
    expect(plain).toContain('in đậm');
    expect(plain).toContain('highlight');
    expect(plain).not.toContain('<h1>');
    expect(plain).not.toContain('<strong>');
    expect(plain).not.toContain('<mark');
  });
});
