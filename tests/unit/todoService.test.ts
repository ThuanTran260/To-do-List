import { describe, it, expect } from 'vitest';
import { mapTodoWithTags } from '@/lib/services/todoService';
import { mapNoteWithTags } from '@/lib/services/noteService';

describe('todoService pure helpers', () => {
  it('maps todo_tags to tags array properly', () => {
    const rawRows = [
      {
        id: 'todo-1',
        title: 'Task 1',
        todo_tags: [
          { tags: { id: 'tag-1', name: 'Work', color: '#6366f1' } },
          { tags: { id: 'tag-2', name: 'Urgent', color: '#ef4444' } },
        ],
      },
      {
        id: 'todo-2',
        title: 'Task 2',
        todo_tags: null,
      },
      {
        id: 'todo-3',
        title: 'Task 3',
        todo_tags: [{ tags: null }],
      },
    ];

    const mapped = mapTodoWithTags(rawRows);
    expect(mapped[0].tags).toEqual([
      { id: 'tag-1', name: 'Work', color: '#6366f1' },
      { id: 'tag-2', name: 'Urgent', color: '#ef4444' },
    ]);
    expect(mapped[1].tags).toEqual([]);
    expect(mapped[2].tags).toEqual([]);
  });

  it('handles empty or null rows safely', () => {
    expect(mapTodoWithTags([])).toEqual([]);
    expect(mapTodoWithTags(null as unknown as unknown[])).toEqual([]);
    expect(mapTodoWithTags(undefined as unknown as unknown[])).toEqual([]);
  });
});

describe('noteService pure helpers', () => {
  it('maps note_tags to tags array properly', () => {
    const rawRows = [
      {
        id: 'note-1',
        title: 'Meeting Notes',
        note_tags: [
          { tags: { id: 'tag-10', name: 'Design', color: '#10b981' } },
        ],
      },
    ];

    const mapped = mapNoteWithTags(rawRows);
    expect(mapped[0].tags).toEqual([
      { id: 'tag-10', name: 'Design', color: '#10b981' },
    ]);
  });

  it('handles empty or null rows safely', () => {
    expect(mapNoteWithTags([])).toEqual([]);
    expect(mapNoteWithTags(null as unknown as unknown[])).toEqual([]);
  });
});
