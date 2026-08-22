import { Tag } from './todo';

export type NoteColor = 'default' | 'yellow' | 'green' | 'blue' | 'purple' | 'rose' | 'orange';
export type HighlightColor = 'yellow' | 'green' | 'blue' | 'purple' | 'rose' | 'orange';
export type AutosaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string; // TipTap HTML or markdown text
  color: NoteColor;
  is_pinned: boolean;
  is_archived: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface NoteSyncPayload {
  noteId: string;
  title: string;
  content: string;
  color: NoteColor;
  is_pinned: boolean;
  timestamp: number;
}
