import { describe, it, expect } from 'vitest';
import { todoCreateSchema, todoUpdateSchema } from '@/lib/validations/todo';
import { categorySchema } from '@/lib/validations/category';
import { tagSchema } from '@/lib/validations/tag';
import { normalizeHexColor, getTagTint, DEFAULT_TAG_COLOR } from '@/lib/tags/tagColor';

describe('todoCreateSchema checklist (L-05 strict contract)', () => {
  it('accepts valid checklist items', () => {
    const result = todoCreateSchema.safeParse({
      title: 'Task',
      checklist: [{ id: '1', title: 'step', is_done: false }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects checklist item missing is_done', () => {
    expect(() =>
      todoCreateSchema.parse({ title: 'Task', checklist: [{ id: '1', title: 'hi' }] })
    ).toThrow();
  });

  it('rejects checklist item missing title', () => {
    expect(() =>
      todoCreateSchema.parse({ title: 'Task', checklist: [{ id: '1', is_done: false }] })
    ).toThrow();
  });

  it('rejects non-object checklist entries (z.any() cũ chấp nhận mọi thứ)', () => {
    expect(() =>
      todoCreateSchema.parse({ title: 'Task', checklist: ['string-not-object'] })
    ).toThrow();
  });

  it('accepts empty checklist', () => {
    const result = todoCreateSchema.safeParse({ title: 'Task', checklist: [] });
    expect(result.success).toBe(true);
  });

  it('update schema validates checklist too', () => {
    const result = todoUpdateSchema.safeParse({
      checklist: [{ id: '1', title: 's', is_done: 'not-boolean' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('categorySchema (C-05 split)', () => {
  it('validates and sanitizes category name', () => {
    const result = categorySchema.parse({ name: '  Work <b>bold</b>  ' });
    expect(result.name).toBe('Work bold');
    expect(result.color).toBe('#6366f1');
  });

  it('rejects empty name', () => {
    expect(() => categorySchema.parse({ name: '' })).toThrow();
  });
});

import { loginSchema, signupSchema, passwordSchema } from '@/lib/validations/auth';

describe('auth password policy min 8 (E-M11)', () => {
  it('signup rejects 7-char password', () => {
    expect(() => signupSchema.parse({ email: 'a@b.co', password: '1234567', confirmPassword: '1234567' })).toThrow();
  });

  it('login accepts any non-empty password (legacy 6-7 char users not locked out)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '123456' }).success).toBe(true);
  });

  it('passwordSchema enforces min 8', () => {
    expect(passwordSchema.safeParse('1234567').success).toBe(false);
    expect(passwordSchema.safeParse('12345678').success).toBe(true);
  });
});

describe('tagSchema (Tag Data-Hygiene)', () => {
  it('accepts valid tag with name and color', () => {
    const result = tagSchema.parse({ name: 'Urgent', color: '#f2555a' });
    expect(result.name).toBe('Urgent');
    expect(result.color).toBe('#f2555a');
  });

  it('defaults color to DEFAULT_TAG_COLOR when omitted', () => {
    const result = tagSchema.parse({ name: 'Default Color' });
    expect(result.name).toBe('Default Color');
    expect(result.color).toBe(DEFAULT_TAG_COLOR);
  });

  it('strips HTML tags and trims tag name', () => {
    const result = tagSchema.parse({ name: '  <b>Frontend</b> <script>alert(1)</script> ' });
    expect(result.name).toBe('Frontend');
  });

  it('rejects tag that becomes empty after sanitize', () => {
    expect(() => tagSchema.parse({ name: '   <script>bad()</script>   ' })).toThrow();
  });

  it('rejects empty tag name', () => {
    expect(() => tagSchema.parse({ name: '   ' })).toThrow();
  });

  it('accepts single character tag name', () => {
    const result = tagSchema.parse({ name: 'A' });
    expect(result.name).toBe('A');
  });

  it('accepts tag name with exactly 50 characters', () => {
    const exact50 = 'x'.repeat(50);
    const result = tagSchema.parse({ name: exact50 });
    expect(result.name).toBe(exact50);
  });

  it('rejects tag name longer than 50 characters', () => {
    const longName = 'a'.repeat(51);
    expect(() => tagSchema.parse({ name: longName })).toThrow();
  });

  it('normalizes uppercase or untrimmed color in tagSchema', () => {
    const result = tagSchema.parse({ name: 'Work', color: '  #5E6AD2  ' });
    expect(result.color).toBe('#5e6ad2');
  });

  it('falls back to DEFAULT_TAG_COLOR in tagSchema for invalid color', () => {
    const result = tagSchema.parse({ name: 'Work', color: 'not-a-color' });
    expect(result.color).toBe(DEFAULT_TAG_COLOR);
  });
});

describe('normalizeHexColor and getTagTint', () => {
  it('normalizes 3-digit hex #rgb and rgb', () => {
    expect(normalizeHexColor('#f0a')).toBe('#ff00aa');
    expect(normalizeHexColor('f0a')).toBe('#ff00aa');
    expect(normalizeHexColor('#F0A')).toBe('#ff00aa');
    expect(normalizeHexColor('F0A')).toBe('#ff00aa');
  });

  it('normalizes 6-digit hex #rrggbb and rrggbb', () => {
    expect(normalizeHexColor('#5E6AD2')).toBe('#5e6ad2');
    expect(normalizeHexColor('5e6ad2')).toBe('#5e6ad2');
    expect(normalizeHexColor('  #5e6ad2  ')).toBe('#5e6ad2');
  });

  it('normalizes 8-digit hex #rrggbbaa by removing alpha', () => {
    expect(normalizeHexColor('#5e6ad2ff')).toBe('#5e6ad2');
    expect(normalizeHexColor('5e6ad280')).toBe('#5e6ad2');
    expect(normalizeHexColor('#5E6AD280')).toBe('#5e6ad2');
  });

  it('falls back to DEFAULT_TAG_COLOR on invalid or empty inputs', () => {
    expect(normalizeHexColor('')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor(null)).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor(undefined)).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('   ')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('invalid-color')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('#zzzzzz')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('#12')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('#12345')).toBe(DEFAULT_TAG_COLOR);
    expect(normalizeHexColor('#1234567')).toBe(DEFAULT_TAG_COLOR);
  });

  it('computes tag tint correctly with alphaHex', () => {
    expect(getTagTint('#ff0000', '15')).toBe('#ff000015');
    expect(getTagTint('#f00', '22')).toBe('#ff000022');
    expect(getTagTint(null, '22')).toBe(`${DEFAULT_TAG_COLOR}22`);
    expect(getTagTint('5e6ad2', '35')).toBe('#5e6ad235');
  });
});

