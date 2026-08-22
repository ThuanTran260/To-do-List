import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

export const NOTE_COLOR_VALUES = ['default', 'yellow', 'green', 'blue', 'purple', 'rose', 'orange'] as const;

export const noteCreateSchema = z.object({
  title: z
    .string()
    .max(500, 'Tiêu đề tối đa 500 ký tự')
    .default('')
    .transform((val) => sanitizeInput(val.trim())),
  content: z
    .string()
    .max(524288, 'Nội dung ghi chú tối đa 512KB')
    .default(''),
  color: z
    .enum(NOTE_COLOR_VALUES)
    .optional()
    .default('default'),
  is_pinned: z.boolean().optional().default(false),
  is_archived: z.boolean().optional().default(false),
});

export const noteUpdateSchema = noteCreateSchema.partial().extend({
  deleted_at: z.string().nullable().optional(),
});

export type NoteInput = z.input<typeof noteCreateSchema>;
export type NoteUpdate = z.input<typeof noteUpdateSchema>;
