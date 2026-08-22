import { NoteSyncPayload } from '@/types/note';

const DRAFT_PREFIX = 'note_draft_';
const EMERGENCY_PREFIX = 'note_emergency_draft_';

/**
 * Safely writes to localStorage, handling QuotaExceededError by pruning
 * the oldest draft entries if space is exhausted.
 */
export function safeSetDraft(key: string, data: any): boolean {
  if (typeof window === 'undefined') return false;

  const value = typeof data === 'string' ? data : JSON.stringify(data);

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: any) {
    if (
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err.code === 22 ||
      err.code === 1014
    ) {
      // Prune oldest note_draft keys
      try {
        const draftKeys = Object.keys(localStorage).filter(
          (k) => k.startsWith(DRAFT_PREFIX) || k.startsWith(EMERGENCY_PREFIX)
        );

        // Remove up to 5 oldest keys
        for (let i = 0; i < Math.min(5, draftKeys.length); i++) {
          localStorage.removeItem(draftKeys[i]);
        }

        // Retry setting item
        localStorage.setItem(key, value);
        return true;
      } catch {
        // Fallback to sessionStorage if still full
        try {
          sessionStorage.setItem(key, value);
          return true;
        } catch {
          return false;
        }
      }
    }
    return false;
  }
}

export function getLocalDraft(noteId: string): NoteSyncPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(`${EMERGENCY_PREFIX}${noteId}`) ||
      localStorage.getItem(`${DRAFT_PREFIX}${noteId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLocalDraft(noteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${noteId}`);
    localStorage.removeItem(`${EMERGENCY_PREFIX}${noteId}`);
    sessionStorage.removeItem(`${DRAFT_PREFIX}${noteId}`);
  } catch {}
}

export function clearAllNoteDrafts(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(DRAFT_PREFIX) || k.startsWith(EMERGENCY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

/**
 * Creates a BroadcastChannel or fallback handler for multi-tab draft sync
 */
export function createNotesSyncChannel(
  onDraftReceived?: (payload: NoteSyncPayload) => void,
  getActivePayload?: () => NoteSyncPayload | null
) {
  if (typeof window === 'undefined') return () => {};

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel('flowstate_notes_sync');

    channel.onmessage = (event) => {
      const { type, payload } = event.data || {};

      if (type === 'DRAFT_REQUEST' && getActivePayload) {
        const current = getActivePayload();
        if (current && current.noteId === payload?.noteId) {
          channel.postMessage({ type: 'DRAFT_RESPONSE', payload: current });
        }
      } else if (type === 'DRAFT_RESPONSE' || type === 'DRAFT_UPDATED') {
        if (payload && onDraftReceived) {
          onDraftReceived(payload);
        }
      }
    };

    return () => {
      channel.close();
    };
  }

  // Fallback for older Safari
  const storageHandler = (e: StorageEvent) => {
    if (e.key && e.key.startsWith(DRAFT_PREFIX) && e.newValue && onDraftReceived) {
      try {
        const payload = JSON.parse(e.newValue);
        onDraftReceived(payload);
      } catch {}
    }
  };

  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener('storage', storageHandler);
  };
}

export function broadcastDraftUpdate(payload: NoteSyncPayload): void {
  if (typeof window === 'undefined') return;
  safeSetDraft(`${DRAFT_PREFIX}${payload.noteId}`, payload);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('flowstate_notes_sync');
      channel.postMessage({ type: 'DRAFT_UPDATED', payload });
      channel.close();
    } catch {}
  }
}
