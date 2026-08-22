'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import {
  safeSetDraft,
  clearLocalDraft,
  broadcastDraftUpdate,
  createNotesSyncChannel,
} from '@/lib/notesDraftSync';
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
  const saveSeqRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    }
  }, [note?.id, note?.updated_at]);

  // Stable executeSave: Reads freshest data directly from dataRef.current
  const executeSave = useCallback(async () => {
    if (!isDirtyRef.current) return;

    const currentSeq = ++saveSeqRef.current;
    setStatus('saving');

    const { title: currentTitle, content: currentContent, color: currentColor, is_pinned: currentPinned } = dataRef.current;
    const noteId = activeNoteIdRef.current;

    try {
      if (!noteId) {
        // Draft-First: Do not create empty notes in DB
        if (!currentTitle.trim() && !currentContent.trim()) {
          setStatus('idle');
          isDirtyRef.current = false;
          return;
        }

        const created = await createMutation.mutateAsync({
          title: currentTitle,
          content: currentContent,
          color: currentColor,
          is_pinned: currentPinned,
        });

        if (currentSeq === saveSeqRef.current) {
          activeNoteIdRef.current = created.id;
          lastKnownUpdatedAtRef.current = created.updated_at;
          isDirtyRef.current = false;
          setStatus('saved');
          clearLocalDraft(created.id);
          onNoteCreatedRef.current?.(created);
        }
      } else {
        const updated = await updateMutation.mutateAsync({
          id: noteId,
          title: currentTitle,
          content: currentContent,
          color: currentColor,
          is_pinned: currentPinned,
          lastKnownUpdatedAt: lastKnownUpdatedAtRef.current,
        });

        if (currentSeq === saveSeqRef.current) {
          lastKnownUpdatedAtRef.current = updated.updated_at;
          isDirtyRef.current = false;
          setStatus('saved');
          setHasConflict(false);
          clearLocalDraft(noteId);
        }
      }
    } catch (err: any) {
      if (currentSeq === saveSeqRef.current) {
        if (err.message === 'VERSION_CONFLICT') {
          setHasConflict(true);
        }
        setStatus('error');

        // Save emergency draft locally
        const targetId = activeNoteIdRef.current || 'draft-new';
        safeSetDraft(`note_emergency_draft_${targetId}`, {
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

  // Trigger debounced save
  const triggerDebouncedSave = useCallback(() => {
    isDirtyRef.current = true;
    setStatus('dirty');

    if (activeNoteIdRef.current) {
      broadcastDraftUpdate({
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

  const flush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isDirtyRef.current) {
      executeSave();
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
        const nId = activeNoteIdRef.current || 'draft-new';
        safeSetDraft(`note_emergency_draft_${nId}`, {
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
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        const noteId = activeNoteIdRef.current;
        if (noteId) {
          const { title: t, content: c, color: col, is_pinned: p } = dataRef.current;

          // 1. Synchronously store in localStorage
          safeSetDraft(`note_emergency_draft_${noteId}`, {
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
            fetch('/api/notes/sync', {
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
