import { NoteColor, HighlightColor } from '@/types/note';

export interface NoteColorConfig {
  id: NoteColor;
  label: string;
  dotColor: string;
  cardClass: string;
  previewBg: string;
}

export const NOTE_COLORS: Record<NoteColor, NoteColorConfig> = {
  default: {
    id: 'default',
    label: 'Mặc định',
    dotColor: '#94a3b8',
    cardClass: 'bg-surface-1 hover:bg-surface-2 border-hairline text-ink',
    previewBg: 'bg-surface-1',
  },
  yellow: {
    id: 'yellow',
    label: 'Vàng Amber',
    dotColor: '#f59e0b',
    cardClass: 'bg-amber-50/80 dark:bg-amber-950/25 border-amber-200/80 dark:border-amber-800/40 text-amber-950 dark:text-amber-100',
    previewBg: 'bg-amber-500/20',
  },
  green: {
    id: 'green',
    label: 'Xanh Lá',
    dotColor: '#10b981',
    cardClass: 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100',
    previewBg: 'bg-emerald-500/20',
  },
  blue: {
    id: 'blue',
    label: 'Xanh Lam',
    dotColor: '#38bdf8',
    cardClass: 'bg-sky-50/80 dark:bg-sky-950/25 border-sky-200/80 dark:border-sky-800/40 text-sky-950 dark:text-sky-100',
    previewBg: 'bg-sky-500/20',
  },
  purple: {
    id: 'purple',
    label: 'Tím Lavender',
    dotColor: '#a855f7',
    cardClass: 'bg-purple-50/80 dark:bg-purple-950/25 border-purple-200/80 dark:border-purple-800/40 text-purple-950 dark:text-purple-100',
    previewBg: 'bg-purple-500/20',
  },
  rose: {
    id: 'rose',
    label: 'Hồng Rose',
    dotColor: '#f43f5e',
    cardClass: 'bg-rose-50/80 dark:bg-rose-950/25 border-rose-200/80 dark:border-rose-800/40 text-rose-950 dark:text-rose-100',
    previewBg: 'bg-rose-500/20',
  },
  orange: {
    id: 'orange',
    label: 'Cam Sunset',
    dotColor: '#f97316',
    cardClass: 'bg-orange-50/80 dark:bg-orange-950/25 border-orange-200/80 dark:border-orange-800/40 text-orange-950 dark:text-orange-100',
    previewBg: 'bg-orange-500/20',
  },
};

export interface HighlightColorConfig {
  id: HighlightColor;
  label: string;
  color: string; // CSS color string or hex for TipTap highlight extension
  bgClass: string;
}

export const HIGHLIGHT_COLORS: HighlightColorConfig[] = [
  { id: 'yellow', label: 'Vàng', color: '#fef08a', bgClass: 'bg-amber-200 text-amber-950' },
  { id: 'green', label: 'Xanh lá', color: '#bbf7d0', bgClass: 'bg-emerald-200 text-emerald-950' },
  { id: 'blue', label: 'Xanh lam', color: '#bae6fd', bgClass: 'bg-sky-200 text-sky-950' },
  { id: 'purple', label: 'Tím', color: '#e9d5ff', bgClass: 'bg-purple-200 text-purple-950' },
  { id: 'rose', label: 'Hồng', color: '#fecdd3', bgClass: 'bg-rose-200 text-rose-950' },
  { id: 'orange', label: 'Cam', color: '#fed7aa', bgClass: 'bg-orange-200 text-orange-950' },
];

export function getNoteColorClasses(color: NoteColor | string = 'default'): string {
  return NOTE_COLORS[color as NoteColor]?.cardClass || NOTE_COLORS.default.cardClass;
}
