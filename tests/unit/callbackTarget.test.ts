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

describe('resolveNextTarget: NEXT_PUBLIC_SITE_URL is the trust anchor', () => {
  const REAL = 'https://flowstate.app';
  const SPOOFED = 'https://evil.example.com';

  it('ignores spoofed request origin when env is set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = REAL;
    try {
      expect(resolveNextTarget('/dashboard', SPOOFED)).toBe(`${REAL}/dashboard`);
      expect(resolveNextTarget('/notes?x=1#y', SPOOFED)).toBe(`${REAL}/notes?x=1#y`);
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('blocks absolute evil next even against spoofed origin when env is set', () => {
    process.env.NEXT_PUBLIC_SITE_URL = REAL;
    try {
      expect(resolveNextTarget('https://evil.example.com/x', SPOOFED)).toBe(
        `${REAL}/dashboard`,
      );
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('strips trailing slashes from env origin', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://flowstate.app///';
    try {
      expect(resolveNextTarget('/dashboard', ORIGIN)).toBe(`${REAL}/dashboard`);
    } finally {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('falls back to request origin when env is missing (legacy, ops must set env)', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(resolveNextTarget('/dashboard', ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });
});
