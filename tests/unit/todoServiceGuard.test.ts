import { describe, it, expect } from 'vitest';
import { createFakeSupabase, hasEq } from './helpers/fakeSupabase';
import {
  updateTodo,
  toggleTodoCompletion,
  reorderTodos,
  incrementPomodoro,
  bulkCompleteTodos,
  bulkDeleteTodos,
  bulkUpdatePriority,
  softDeleteTodo,
  restoreTodo,
  permanentDeleteTodo,
} from '@/lib/services/todoService';

const UID = 'user-1';

describe('todoService user_id scoping (E-H5)', () => {
  it('updateTodo scopes by user_id', async () => {
    const { calls, supabase } = createFakeSupabase([{ id: 'todo-1' }]);
    await updateTodo(supabase as never, UID, 'todo-1', { title: 'x' });
    expect(hasEq(calls, 'user_id', UID)).toBe(true);
    expect(hasEq(calls, 'id', 'todo-1')).toBe(true);
  });

  it('updateTodo throws on 0-row (assertOwnedRow hoạt động, không bị nuốt)', async () => {
    const { supabase } = createFakeSupabase([]);
    await expect(updateTodo(supabase as never, UID, 'todo-1', { title: 'x' })).rejects.toThrow(
      /not found or access denied/
    );
  });

  it('toggleTodoCompletion scopes by user_id', async () => {
    const { calls, supabase } = createFakeSupabase([{ id: 'todo-1' }]);
    await toggleTodoCompletion(supabase as never, UID, 'todo-1', true);
    expect(hasEq(calls, 'user_id', UID)).toBe(true);
  });

  it('softDelete/restore/permanentDelete scope by user_id', async () => {
    for (const fn of [softDeleteTodo, restoreTodo, permanentDeleteTodo]) {
      const { calls, supabase } = createFakeSupabase([{ id: 'todo-1' }]);
      await (fn as (s: never, u: string, i: string) => Promise<void>)(supabase as never, UID, 'todo-1');
      expect(hasEq(calls, 'user_id', UID)).toBe(true);
    }
  });

  it('bulk ops scope by user_id', async () => {
    const { calls, supabase } = createFakeSupabase([{ id: 'a' }, { id: 'b' }]);
    await bulkDeleteTodos(supabase as never, UID, ['a', 'b']);
    expect(hasEq(calls, 'user_id', UID)).toBe(true);
    const { calls: c2, supabase: s2 } = createFakeSupabase([{ id: 'a' }]);
    await bulkUpdatePriority(s2 as never, UID, ['a'], 'high');
    expect(hasEq(c2, 'user_id', UID)).toBe(true);
    const { calls: c3, supabase: s3 } = createFakeSupabase([{ id: 'a' }]);
    await bulkCompleteTodos(s3 as never, UID, ['a']);
    expect(hasEq(c3, 'user_id', UID)).toBe(true);
  });

  it('bulk ops throw on 0-row', async () => {
    const { supabase } = createFakeSupabase([]);
    await expect(bulkDeleteTodos(supabase as never, UID, ['a'])).rejects.toThrow(
      /not found or access denied/
    );
  });

  it('reorderTodos scopes by user_id', async () => {
    const { calls, supabase } = createFakeSupabase([{ id: 'a' }, { id: 'b' }]);
    await reorderTodos(supabase as never, UID, ['a', 'b']);
    expect(hasEq(calls, 'user_id', UID)).toBe(true);
  });

  it('incrementPomodoro scopes by user_id', async () => {
    const { calls, supabase } = createFakeSupabase([{ id: 'todo-1' }]);
    await incrementPomodoro(supabase as never, UID, 'todo-1');
    expect(hasEq(calls, 'user_id', UID)).toBe(true);
  });
});
