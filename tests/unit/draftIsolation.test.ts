import { describe, it, expect, beforeEach } from 'vitest';
import {
  draftKey,
  safeSetDraft,
  getLocalDraft,
  clearLocalDraft,
  clearAllNoteDrafts,
  saveEmergencyDraft,
} from '@/lib/notesDraftSync';
import { queueKey, addToOfflineQueue, getOfflineQueue, clearOfflineQueue } from '@/lib/offlineQueue';

describe('draftKey (E-M7 namespacing)', () => {
  it('builds namespaced key', () => {
    expect(draftKey('note_draft_', 'user-1', 'note-9')).toBe('note_draft_user-1:note-9');
  });

  it('rejects empty or colon-containing userId', () => {
    expect(() => draftKey('note_draft_', '', 'n')).toThrow();
    expect(() => draftKey('note_draft_', 'a:b', 'n')).toThrow();
  });
});

describe('draft cross-user isolation (E-M7)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('user B cannot read user A draft via getLocalDraft', () => {
    safeSetDraft(draftKey('note_draft_', 'user-A', 'note-1'), { noteId: 'note-1', title: 'secret' });
    expect(getLocalDraft('user-B', 'note-1')).toBeNull();
    expect(getLocalDraft('user-A', 'note-1')).toMatchObject({ title: 'secret' });
  });

  it('legacy draft migrates to namespaced key on read', () => {
    safeSetDraft('note_draft_note-2', { noteId: 'note-2', title: 'old' });
    const got = getLocalDraft('user-A', 'note-2');
    expect(got).toMatchObject({ title: 'old' });
    // migrated + legacy removed
    expect(localStorage.getItem('note_draft_note-2')).toBeNull();
    expect(localStorage.getItem(draftKey('note_draft_', 'user-A', 'note-2'))).not.toBeNull();
  });

  it('clearLocalDraft removes namespaced keys', () => {
    safeSetDraft(draftKey('note_draft_', 'user-A', 'n3'), { noteId: 'n3' });
    safeSetDraft(draftKey('note_draft_', 'user-B', 'n3'), { noteId: 'n3' });
    clearLocalDraft('user-A', 'n3');
    expect(getLocalDraft('user-A', 'n3')).toBeNull();
    expect(getLocalDraft('user-B', 'n3')).not.toBeNull();
  });

  it('clearAllNoteDrafts removes everything (logout)', () => {
    safeSetDraft(draftKey('note_draft_', 'user-A', 'n1'), { noteId: 'n1' });
    safeSetDraft('note_emergency_draft_n2', { noteId: 'n2' });
    clearAllNoteDrafts();
    expect(getLocalDraft('user-A', 'n1')).toBeNull();
    expect(getLocalDraft(null, 'n2')).toBeNull();
  });

  it('saveEmergencyDraft uses legacy key when anonymous', () => {
    saveEmergencyDraft(null, 'n9', { noteId: 'n9' });
    expect(localStorage.getItem('note_emergency_draft_n9')).not.toBeNull();
  });
});

describe('offline queue namespacing (E-M7)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('queue key includes userId', () => {
    expect(queueKey('user-1')).toBe('flow_state_offline_queue_user-1');
    expect(queueKey(null)).toBe('flow_state_offline_queue');
  });

  it('queues are isolated per user', () => {
    addToOfflineQueue('CREATE', { title: 'A-task' }, 'user-A');
    expect(getOfflineQueue('user-B')).toEqual([]);
    expect(getOfflineQueue('user-A')).toHaveLength(1);
    expect(getOfflineQueue()).toEqual([]);
  });

  it('clearOfflineQueue() with no args clears all queues (logout)', () => {
    addToOfflineQueue('CREATE', { title: 'A' }, 'user-A');
    addToOfflineQueue('CREATE', { title: 'B' }, 'user-B');
    addToOfflineQueue('CREATE', { title: 'legacy' });
    clearOfflineQueue();
    expect(getOfflineQueue('user-A')).toEqual([]);
    expect(getOfflineQueue('user-B')).toEqual([]);
    expect(getOfflineQueue()).toEqual([]);
  });
});
