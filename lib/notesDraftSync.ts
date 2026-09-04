import { NoteSyncPayload } from '@/types/note';

const DRAFT_PREFIX = 'note_draft_';
const EMERGENCY_PREFIX = 'note_emergency_draft_';

/**
 * E-M7: namespaced draft keys per user — draft user A không đọc được bởi user B
 * trên cùng browser (máy dùng chung). Format: note_draft_<userId>:<noteId>.
 * userId null (anonymous/draft-new chưa login) → key legacy (không namespaced),
 * sẽ được migrate khi login + bị xoá khi logout qua clearAllNoteDrafts().
 */
export function draftKey(prefix: string, userId: string, noteId: string): string {
  if (!userId || userId.includes(':')) throw new Error('Invalid user id for draft key');
  return `${prefix}${userId}:${noteId}`;
}

function legacyKeys(noteId: string): string[] {
  return [`${DRAFT_PREFIX}${noteId}`, `${EMERGENCY_PREFIX}${noteId}`];
}

/**
 * Safely writes to localStorage, handling QuotaExceededError by pruning
 * the oldest draft entries if space is exhausted.
 */
export function safeSetDraft(key: string, data: unknown): boolean {
  if (typeof window === 'undefined') return false;

  const value = typeof data === 'string' ? data : JSON.stringify(data);

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    const errorObj = err as { name?: string; code?: number };
    if (
      errorObj.name === 'QuotaExceededError' ||
      errorObj.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      errorObj.code === 22 ||
      errorObj.code === 1014
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

export function getLocalDraft(userId: string | null, noteId: string): NoteSyncPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Đọc key namespaced trước
    if (userId) {
      const namespaced =
        localStorage.getItem(draftKey(EMERGENCY_PREFIX, userId, noteId)) ||
        localStorage.getItem(draftKey(DRAFT_PREFIX, userId, noteId));
      if (namespaced) return JSON.parse(namespaced);
    }
    // 2. Fallback key legacy (draft cũ/anonymous) → migrate sang key mới rồi xoá legacy
    const raw =
      localStorage.getItem(`${EMERGENCY_PREFIX}${noteId}`) ||
      localStorage.getItem(`${DRAFT_PREFIX}${noteId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NoteSyncPayload;
    if (userId) {
      safeSetDraft(draftKey(DRAFT_PREFIX, userId, noteId), parsed);
      legacyKeys(noteId).forEach((k) => localStorage.removeItem(k));
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearLocalDraft(userId: string | null, noteId: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId) {
      localStorage.removeItem(draftKey(DRAFT_PREFIX, userId, noteId));
      localStorage.removeItem(draftKey(EMERGENCY_PREFIX, userId, noteId));
      sessionStorage.removeItem(draftKey(DRAFT_PREFIX, userId, noteId));
    }
    legacyKeys(noteId).forEach((k) => localStorage.removeItem(k));
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
 * Ghi emergency draft với key namespaced (userId null → legacy key cho anonymous).
 */
export function saveEmergencyDraft(
  userId: string | null,
  noteId: string,
  payload: unknown
): boolean {
  const key = userId ? draftKey(EMERGENCY_PREFIX, userId, noteId) : `${EMERGENCY_PREFIX}${noteId}`;
  return safeSetDraft(key, payload);
}

const TAB_SESSION_ID = typeof window !== 'undefined' ? Math.random().toString(36).slice(2) : '';

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
      // Ignore messages emitted by the same tab session
      if (event.data?.senderId === TAB_SESSION_ID) {
        return;
      }

      const { type, payload } = event.data || {};

      if (type === 'DRAFT_REQUEST' && getActivePayload) {
        const current = getActivePayload();
        if (current && current.noteId === payload?.noteId) {
          channel.postMessage({
            type: 'DRAFT_RESPONSE',
            payload: current,
            senderId: TAB_SESSION_ID,
          });
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

export function broadcastDraftUpdate(userId: string | null, payload: NoteSyncPayload): void {
  if (typeof window === 'undefined') return;
  const key = userId
    ? draftKey(DRAFT_PREFIX, userId, payload.noteId)
    : `${DRAFT_PREFIX}${payload.noteId}`;
  safeSetDraft(key, payload);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      const channel = new BroadcastChannel('flowstate_notes_sync');
      channel.postMessage({
        type: 'DRAFT_UPDATED',
        payload,
        senderId: TAB_SESSION_ID,
      });
      channel.close();
    } catch {}
  }
}
