'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import {
  saveEmergencyDraft,
  clearLocalDraft,
  broadcastDraftUpdate,
  createNotesSyncChannel,
} from '@/lib/notesDraftSync';
import { useAuth } from '@/hooks/useAuth';
import { csrfFetch } from '@/lib/security/csrfClient';
import { Note, NoteColor, AutosaveStatus } from '@/types/note';

interface UseAutosaveNoteProps {
  note?: Note | null;
  initialTitle?: string;
  initialContent?: string;
  initialColor?: NoteColor;
  initialPinned?: boolean;
  onNoteCreated?: (newNote: Note) => void;
}

export function useAutosaveNote({
  note,
  initialTitle = '',
  initialContent = '',
  initialColor = 'default',
  initialPinned = false,
  onNoteCreated,
}: UseAutosaveNoteProps) {
  const activeNoteIdRef = useRef<string | null>(note?.id || null);
  const lastKnownUpdatedAtRef = useRef<string | undefined>(note?.updated_at);
  const onNoteCreatedRef = useRef(onNoteCreated);
  onNoteCreatedRef.current = onNoteCreated;

  const [title, setTitle] = useState(note?.title ?? initialTitle);
  const [content, setContent] = useState(note?.content ?? initialContent);
  const [color, setColor] = useState<NoteColor>(note?.color ?? initialColor);
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? initialPinned);

  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const [hasConflict, setHasConflict] = useState(false);

  // Single Ref Buffer holding freshest editing state — avoids stale closures & endless re-renders
  const dataRef = useRef({
    title: note?.title ?? initialTitle,
    content: note?.content ?? initialContent,
    color: (note?.color ?? initialColor) as NoteColor,
    is_pinned: note?.is_pinned ?? initialPinned,
  });

  // Keep dataRef in sync
  dataRef.current = {
    title,
    content,
    color,
    is_pinned: isPinned,
  };

  const isDirtyRef = useRef(false);
  const saveSeqCounterRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // P1 RC2: Idempotency Key cho draft mới — gán lazy trong executeSave để giữ render hook pure
  const clientDraftIdRef = useRef<string>('');

  // P1 RC2: Single-tab creation concurrency guard — tránh bắn 2 createMutation gối nhau
  const inFlightCreatePromiseRef = useRef<Promise<Note> | null>(null);

  // Stable ref tham chiếu executeSave cho recursive debounce timeout (chống cycle declaration lint)
  const executeSaveRef = useRef<(() => Promise<void>) | null>(null);

  // P1 RC5: Keystroke timestamp — chống nuốt keystroke gõ giữa lúc request đang bay
  const dirtyAtRef = useRef<number>(0);

  // E-M7: userId cho namespaced draft keys — mirror qua ref để callbacks
  // (executeSave dùng useCallback) luôn đọc giá trị mới nhất mà không churn deps.
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  // Switch note context if the incoming note prop changes (user opened a different note)
  useEffect(() => {
    if (note?.id && note.id !== activeNoteIdRef.current) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      activeNoteIdRef.current = note.id;
      lastKnownUpdatedAtRef.current = note.updated_at;

      const nextTitle = note.title || '';
      const nextContent = note.content || '';
      const nextColor = (note.color || 'default') as NoteColor;
      const nextPinned = note.is_pinned || false;

      dataRef.current = {
        title: nextTitle,
        content: nextContent,
        color: nextColor,
        is_pinned: nextPinned,
      };

      setTitle(nextTitle);
      setContent(nextContent);
      setColor(nextColor);
      setIsPinned(nextPinned);
      setStatus('saved');
      setHasConflict(false);
      isDirtyRef.current = false;
      dirtyAtRef.current = 0;
      inFlightCreatePromiseRef.current = null;
      clientDraftIdRef.current = '';
    } else if (!note?.id && activeNoteIdRef.current) {
      // Fresh blank draft after a real note: drop all prior-note save state so the
      // next save creates a new row instead of updating the previous note with a
      // stale id (and never reuses its idempotency key).
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      activeNoteIdRef.current = null;
      lastKnownUpdatedAtRef.current = undefined;
      clientDraftIdRef.current = '';
      inFlightCreatePromiseRef.current = null;
      isDirtyRef.current = false;
      dirtyAtRef.current = 0;
      setStatus('saved');
      setHasConflict(false);
    }
  }, [note?.id, note?.updated_at, note?.title, note?.content, note?.color, note?.is_pinned]);

  // Stable executeSave: Reads freshest data directly from dataRef.current
  const executeSave = useCallback(async () => {
    if (!isDirtyRef.current) return;

    const currentSeq = ++saveSeqCounterRef.current;
    const saveStartTime = Date.now();
    setStatus('saving');

    const { title: currentTitle, content: currentContent, color: currentColor, is_pinned: currentPinned } = dataRef.current;
    let noteId = activeNoteIdRef.current;
    let justCreated = false;

    try {
      if (!noteId) {
        // Draft-First: Do not create empty notes in DB
        if (!currentTitle.trim() && !currentContent.trim()) {
          setStatus('idle');
          isDirtyRef.current = false;
          return;
        }

        // Idempotency Key cho draft mới — khởi tạo trong handler/callback để giữ hook render pure.
        // Không có crypto.randomUUID (Safari cũ / insecure context) thì bỏ id để server tự sinh,
        // thay vì gửi string sai định dạng uuid khiến Zod reject toàn bộ autosave.
        if (!clientDraftIdRef.current) {
          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            clientDraftIdRef.current = crypto.randomUUID();
          }
        }

        let created: Note;
        // P1 RC2: Nếu đã có 1 createMutation đang bay trong tab, join promise đó
        if (inFlightCreatePromiseRef.current) {
          created = await inFlightCreatePromiseRef.current;
        } else {
          const createPromise = createMutation.mutateAsync({
            // id có thể vắng khi không sinh được UUID — server tự sinh UUID mới.
            ...(clientDraftIdRef.current ? { id: clientDraftIdRef.current } : {}),
            title: currentTitle,
            content: currentContent,
            color: currentColor,
            is_pinned: currentPinned,
          });
          inFlightCreatePromiseRef.current = createPromise;
          try {
            created = await createPromise;
          } finally {
            inFlightCreatePromiseRef.current = null;
          }
        }

        activeNoteIdRef.current = created.id;
        lastKnownUpdatedAtRef.current = created.updated_at;
        clearLocalDraft(userIdRef.current, created.id);
        // NOTE: creator và joiner (nhánh in-flight bên dưới) đều đi qua đây —
        // parent onNoteCreated phải idempotent (hiện là no-op nên an toàn).
        onNoteCreatedRef.current?.(created);
        noteId = created.id;
        justCreated = true;
      }

      // Nếu trong lúc tạo (hoặc lúc update), người dùng đã gõ thêm ký tự sau saveStartTime
      if (noteId && dirtyAtRef.current > saveStartTime) {
        const freshest = dataRef.current;
        const updated = await updateMutation.mutateAsync({
          id: noteId,
          title: freshest.title,
          content: freshest.content,
          color: freshest.color,
          is_pinned: freshest.is_pinned,
          lastKnownUpdatedAt: lastKnownUpdatedAtRef.current,
        });
        lastKnownUpdatedAtRef.current = updated.updated_at;
        clearLocalDraft(userIdRef.current, noteId);
      } else if (noteId && !justCreated && currentSeq === saveSeqCounterRef.current) {
        const updated = await updateMutation.mutateAsync({
          id: noteId,
          title: currentTitle,
          content: currentContent,
          color: currentColor,
          is_pinned: currentPinned,
          lastKnownUpdatedAt: lastKnownUpdatedAtRef.current,
        });
        lastKnownUpdatedAtRef.current = updated.updated_at;
        clearLocalDraft(userIdRef.current, noteId);
      }

      if (currentSeq === saveSeqCounterRef.current) {
        // P1 RC5: Chỉ đánh dấu hết dirty nếu không có ký tự mới nào được gõ trong lúc request đang bay
        if (dirtyAtRef.current <= saveStartTime) {
          isDirtyRef.current = false;
          setStatus('saved');
        } else {
          // Có keystroke mới — giữ dirty và trigger debounced save tiếp theo
          isDirtyRef.current = true;
          setStatus('dirty');
          if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = setTimeout(() => {
            executeSaveRef.current?.();
          }, 600);
        }
        setHasConflict(false);
      }
    } catch (err: unknown) {
      if (currentSeq === saveSeqCounterRef.current) {
        if (process.env.NODE_ENV === 'development') console.error('[autosave] save failed', err);
        setStatus('error');

        // Save emergency draft locally (namespaced per user; anonymous → legacy key)
        const targetId = activeNoteIdRef.current || clientDraftIdRef.current || 'draft-new';
        saveEmergencyDraft(userIdRef.current, targetId, {
          noteId: targetId,
          title: currentTitle,
          content: currentContent,
          color: currentColor,
          is_pinned: currentPinned,
          timestamp: Date.now(),
        });
      }
    }
  }, [createMutation, updateMutation]);

  // Đồng bộ ref thực thi cho timeout debounce
  executeSaveRef.current = executeSave;

  // Trigger debounced save
  const triggerDebouncedSave = useCallback(() => {
    isDirtyRef.current = true;
    dirtyAtRef.current = Date.now();
    setStatus('dirty');

    if (activeNoteIdRef.current) {
      broadcastDraftUpdate(userIdRef.current, {
        noteId: activeNoteIdRef.current,
        ...dataRef.current,
        timestamp: Date.now(),
      });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, 600);
  }, [executeSave]);

  const flush = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      await executeSave();
    }
  }, [executeSave]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (isDirtyRef.current) {
        // Execute synchronous emergency flush
        const { title: t, content: c, color: col, is_pinned: p } = dataRef.current;
        const nId = activeNoteIdRef.current || clientDraftIdRef.current || 'draft-new';
        saveEmergencyDraft(userIdRef.current, nId, {
          noteId: nId,
          title: t,
          content: c,
          color: col,
          is_pinned: p,
          timestamp: Date.now(),
        });
      }
    };
  }, []);

  // Mobile Lifecycle: visibilitychange & pagehide with keepalive emergency sync
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        const noteId = activeNoteIdRef.current;
        if (noteId) {
          const { title: t, content: c, color: col, is_pinned: p } = dataRef.current;

          // 1. Synchronously store in localStorage (namespaced per user)
          saveEmergencyDraft(userIdRef.current, noteId, {
            noteId,
            title: t,
            content: c,
            color: col,
            is_pinned: p,
            timestamp: Date.now(),
          });

          // 2. Fire lightweight keepalive request (< 60KB buffer safe)
          const payload = JSON.stringify({
            noteId,
            title: t,
            content: c.length > 50000 ? c.slice(0, 50000) : c,
            color: col,
            is_pinned: p,
          });

          try {
            // Review fix: dùng csrfFetch chung (1 nguồn đọc token + credentials),
            // giữ keepalive:true cho fire-and-forget khi đóng tab.
            await csrfFetch('/api/notes/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true,
            });
          } catch {}
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, []);

  // Multi-tab BroadcastChannel listener (mounts once)
  useEffect(() => {
    const unsubscribe = createNotesSyncChannel(
      (incoming) => {
        if (incoming.noteId === activeNoteIdRef.current && !isDirtyRef.current) {
          dataRef.current = {
            title: incoming.title,
            content: incoming.content,
            color: incoming.color,
            is_pinned: incoming.is_pinned,
          };
          setTitle(incoming.title);
          setContent(incoming.content);
          setColor(incoming.color);
          setIsPinned(incoming.is_pinned);
        }
      },
      () => {
        if (!activeNoteIdRef.current) return null;
        return {
          noteId: activeNoteIdRef.current,
          ...dataRef.current,
          timestamp: Date.now(),
        };
      }
    );

    return unsubscribe;
  }, []);

  // Public state setters that update ref + state + trigger debounced save
  const updateTitle = useCallback((newTitle: string) => {
    dataRef.current.title = newTitle;
    setTitle(newTitle);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const updateContent = useCallback((newContent: string) => {
    dataRef.current.content = newContent;
    setContent(newContent);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const updateColor = useCallback((newColor: NoteColor) => {
    dataRef.current.color = newColor;
    setColor(newColor);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  const updatePinned = useCallback((newPinned: boolean) => {
    dataRef.current.is_pinned = newPinned;
    setIsPinned(newPinned);
    triggerDebouncedSave();
  }, [triggerDebouncedSave]);

  return {
    title,
    content,
    color,
    isPinned,
    status,
    hasConflict,
    updateTitle,
    updateContent,
    updateColor,
    updatePinned,
    flush,
    retry: executeSave,
  };
}
