import { describe, it, expect } from 'vitest';
import { escapeCSVCell } from '@/lib/export';

describe('escapeCSVCell (E-M8 formula injection)', () => {
  it.each([
    '=cmd|/c calc!A0',
    '+2+3+cmd|/c powershell',
    '-2+3+cmd|/c calc',
    '@SUM(1+1)*cmd',
    '\t=HYPERLINK("https://evil.example")',
    '\r=1+1',
  ])('neutralizes %s', (payload) => {
    const out = escapeCSVCell(payload);
    expect(out.startsWith(`"'`)).toBe(true);
  });

  it('keeps normal text untouched', () => {
    expect(escapeCSVCell('Hello, world')).toBe('"Hello, world"');
  });
});
