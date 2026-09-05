import { describe, it, expect } from 'vitest';
import { resolveNextTarget } from '@/lib/auth/redirect';

const ORIGIN = 'https://app.example.com';

describe('resolveNextTarget (E-M12)', () => {
  it('allows relative paths', () => {
    expect(resolveNextTarget('/dashboard/notes', ORIGIN)).toBe(`${ORIGIN}/dashboard/notes`);
  });

  it('blocks protocol-relative and absolute URLs', () => {
    expect(resolveNextTarget('//evil.example.com', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(resolveNextTarget('https://evil.example.com', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it('blocks backslash tricks', () => {
    expect(resolveNextTarget('/\\evil.example.com', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(resolveNextTarget('/%5cevil.example.com', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it('defaults null/empty to dashboard', () => {
    expect(resolveNextTarget(null, ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(resolveNextTarget('', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });
});
