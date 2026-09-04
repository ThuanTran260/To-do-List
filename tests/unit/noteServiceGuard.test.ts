import { describe, it, expect } from 'vitest';
import { createFakeSupabase, hasEq } from './helpers/fakeSupabase';
import {
  togglePinNote,
  changeNoteColor,
  softDeleteNote,
  restoreNote,
  permanentDeleteNote,
} from '@/lib/services/noteService';

const UID = 'user-1';

describe('noteService user_id scoping (E-H5)', () => {
  it('togglePin/changeColor/softDelete/restore/permanentDelete scope by user_id', async () => {
    type NoteServiceFn = (s: unknown, u: string, id: string, extra?: unknown) => Promise<unknown>;
    const cases: Array<[string, NoteServiceFn, unknown?]> = [
      ['togglePinNote', togglePinNote as unknown as NoteServiceFn, true],
      ['changeNoteColor', changeNoteColor as unknown as NoteServiceFn, 'yellow'],
      ['softDeleteNote', softDeleteNote as unknown as NoteServiceFn, undefined],
      ['restoreNote', restoreNote as unknown as NoteServiceFn, undefined],
      ['permanentDeleteNote', permanentDeleteNote as unknown as NoteServiceFn, undefined],
    ];
    for (const [name, fn, extra] of cases) {
      const { calls, supabase } = createFakeSupabase([{ id: 'note-1' }]);
      if (extra === undefined) {
        await fn(supabase, UID, 'note-1');
      } else {
        await fn(supabase, UID, 'note-1', extra);
      }
      expect(hasEq(calls, 'user_id', UID), name).toBe(true);
    }
  });
});
