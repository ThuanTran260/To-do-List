import { describe, it, expect } from 'vitest';
import { assertOwnedRow, assertBulkAffected } from '@/lib/services/dbGuard';

describe('assertOwnedRow', () => {
  it('passes through non-empty data', () => {
    expect(assertOwnedRow([{ id: 'a' }], 'op')).toEqual([{ id: 'a' }]);
  });

  it('throws on empty and null', () => {
    expect(() => assertOwnedRow([], 'op')).toThrow(/not found or access denied/);
    expect(() => assertOwnedRow(null, 'op')).toThrow(/not found or access denied/);
  });
});

describe('assertBulkAffected', () => {
  it('passes when all matched', () => {
    expect(() => assertBulkAffected([{ id: 'a' }], ['a'], 'op')).not.toThrow();
  });

  it('throws when input non-empty but 0-row (RLS deny)', () => {
    expect(() => assertBulkAffected([], ['a'], 'op')).toThrow(/not found or access denied/);
  });

  it('passes silently on empty input (no-op, no false positive)', () => {
    expect(() => assertBulkAffected([], [], 'op')).not.toThrow();
  });

  it('warns (not throws) on partial match', () => {
    expect(() => assertBulkAffected([{ id: 'a' }], ['a', 'b'], 'op')).not.toThrow();
  });
});
