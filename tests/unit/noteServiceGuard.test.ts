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
    const cases: Array<[string, (...a: any[]) => Promise<unknown>, unknown?]> = [
      ['togglePinNote', togglePinNote as (...a: any[]) => Promise<unknown>, true],
      ['changeNoteColor', changeNoteColor as (...a: any[]) => Promise<unknown>, 'yellow'],
      ['softDeleteNote', softDeleteNote as (...a: any[]) => Promise<unknown>, undefined],
      ['restoreNote', restoreNote as (...a: any[]) => Promise<unknown>, undefined],
      ['permanentDeleteNote', permanentDeleteNote as (...a: any[]) => Promise<unknown>, undefined],
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
