import { describe, it, expect } from 'vitest';
import { todoCreateSchema, todoUpdateSchema } from '@/lib/validations/todo';
import type { TodoItemData } from '@/types/todo';

describe('todo image_thumb_path validation & types', () => {
  it('accepts image_thumb_path in todoCreateSchema', () => {
    const parsed = todoCreateSchema.parse({
      title: 'Test task',
      image_path: 'user-1/task-123.webp',
      image_thumb_path: 'user-1/task-123-thumb.webp',
    });
    expect(parsed.image_thumb_path).toBe('user-1/task-123-thumb.webp');
  });

  it('allows null and undefined for image_thumb_path', () => {
    const parsedNull = todoCreateSchema.parse({
      title: 'Test task',
      image_thumb_path: null,
    });
    expect(parsedNull.image_thumb_path).toBeNull();

    const parsedUndef = todoCreateSchema.parse({
      title: 'Test task',
    });
    expect(parsedUndef.image_thumb_path).toBeUndefined();
  });

  it('allows image_thumb_path in todoUpdateSchema', () => {
    const parsed = todoUpdateSchema.parse({
      image_thumb_path: 'user-1/task-updated-thumb.webp',
    });
    expect(parsed.image_thumb_path).toBe('user-1/task-updated-thumb.webp');
  });

  it('type check: TodoItemData supports image_thumb_path', () => {
    const item: TodoItemData = {
      id: '123',
      user_id: 'u1',
      title: 'Task',
      description: null,
      is_completed: false,
      priority: 'medium',
      due_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
      image_path: 'u1/task.webp',
      image_thumb_path: 'u1/task-thumb.webp',
    };
    expect(item.image_thumb_path).toBe('u1/task-thumb.webp');
  });
});
