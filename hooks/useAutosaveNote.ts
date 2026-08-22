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
  const isNew = !note?.id;
  const activeNoteIdRef = useRef<string | null>(note?.id || null);
  const lastKnownUpdatedAtRef = useRef<string | undefined>(note?.updated_at);

  const [title, setTitle] = useState(note?.title ?? initialTitle);
  const [content, setContent] = useState(note?.content ?? initialContent);
  const [color, setColor] = useState<NoteColor>(note?.color ?? initialColor);
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? initialPinned);

  const [status, setStatus] = useState<AutosaveStatus>('saved');
  const [hasConflict, setHasConflict] = useState(false);

  const isDirtyRef = useRef(false);
  const saveSeqRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const createMutation = useCreateNote();
  const updateMutation = useUpdateNote();

  // Keep state synced when the incoming note prop changes (e.g. user selected another note)
  useEffect(() => {
    if (note?.id && note.id !== activeNoteIdRef.current) {
      // Flush previous note before switching if dirty
      flush();

      activeNoteIdRef.current = note.id;
      lastKnownUpdatedAtRef.current = note.updated_at;
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || 'default');
      setIsPinned(note.is_pinned || false);
      setStatus('saved');
      setHasConflict(false);
      isDirtyRef.current = false;
    }
  }, [note?.id, note?.updated_at]);

  // Handle actual save mutation
  const executeSave = useCallback(async () => {
    if (!isDirtyRef.current) return;

    const currentSeq = ++saveSeqRef.current;
    setStatus('saving');

    const noteId = activeNoteIdRef.current;
    const currentTitle = title;
    const currentContent = content;
    const currentColor = color;
    const currentPinned = isPinned;

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
          onNoteCreated?.(created);
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
          setStatus('error');
        } else {
          setStatus('error');
        }

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
  }, [title, content, color, isPinned, createMutation, updateMutation, onNoteCreated]);

  // Schedule debounced save on changes
  const triggerDebouncedSave = useCallback(() => {
    isDirtyRef.current = true;
    setStatus('dirty');

    // Broadcast local draft to other tabs
    if (activeNoteIdRef.current) {
      broadcastDraftUpdate({
        noteId: activeNoteIdRef.current,
        title,
        content,
        color,
        is_pinned: isPinned,
        timestamp: Date.now(),
      });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, 600);
  }, [title, content, color, isPinned, executeSave]);

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
      flush();
    };
  }, [flush]);

  // Mobile Lifecycle: visibilitychange & pagehide with keepalive emergency sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current) {
        const noteId = activeNoteIdRef.current;
        if (noteId) {
          // 1. Synchronously store in localStorage
          safeSetDraft(`note_emergency_draft_${noteId}`, {
            noteId,
            title,
            content,
            color,
            is_pinned: isPinned,
            timestamp: Date.now(),
          });

          // 2. Fire lightweight keepalive request (< 60KB buffer safe)
          const payload = JSON.stringify({
            noteId,
            title,
            content: content.length > 50000 ? content.slice(0, 50000) : content,
            color,
            is_pinned: isPinned,
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
  }, [title, content, color, isPinned]);

  // Multi-tab BroadcastChannel listener
  useEffect(() => {
    const unsubscribe = createNotesSyncChannel(
      (incoming) => {
        if (incoming.noteId === activeNoteIdRef.current && !isDirtyRef.current) {
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
          title,
          content,
          color,
          is_pinned: isPinned,
          timestamp: Date.now(),
        };
      }
    );

    return unsubscribe;
  }, [title, content, color, isPinned]);

  // Public state setters that trigger autosave
  const updateTitle = (newTitle: string) => {
    setTitle(newTitle);
    triggerDebouncedSave();
  };

  const updateContent = (newContent: string) => {
    setContent(newContent);
    triggerDebouncedSave();
  };

  const updateColor = (newColor: NoteColor) => {
    setColor(newColor);
    triggerDebouncedSave();
  };

  const updatePinned = (newPinned: boolean) => {
    setIsPinned(newPinned);
    triggerDebouncedSave();
  };

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
