import { describe, it, expect } from 'vitest';
import { escapePostgrestLike } from '@/lib/search';

describe('escapePostgrestLike (E-M10)', () => {
  it('strips or-separator and grouping chars', () => {
    expect(escapePostgrestLike('a,title.neq.foo')).not.toContain(',');
    expect(escapePostgrestLike('a(b)c')).not.toContain('(');
  });

  it('strips wildcards, escape char and quotes', () => {
    const out = escapePostgrestLike(`100% _sure_ \\ "quoted" 'x' ;select`);
    expect(out).not.toMatch(/[%_\\"'`;:*]/);
  });

  it('caps length at 100', () => {
    expect(escapePostgrestLike('a'.repeat(200)).length).toBeLessThanOrEqual(100);
  });

  it('keeps vietnamese text usable', () => {
    expect(escapePostgrestLike('Kế hoạch tuần tới')).toBe('Kế hoạch tuần tới');
  });

  it('empty after strip (caller skips .or())', () => {
    expect(escapePostgrestLike('((()))')).toBe('');
  });
});
