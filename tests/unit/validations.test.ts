import { describe, it, expect } from 'vitest';
import { todoCreateSchema, todoUpdateSchema } from '@/lib/validations/todo';
import { categorySchema } from '@/lib/validations/category';

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
