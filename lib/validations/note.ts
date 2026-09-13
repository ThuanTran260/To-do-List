import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

export const NOTE_COLOR_VALUES = ['default', 'yellow', 'green', 'blue', 'purple', 'rose', 'orange'] as const;

export const noteBaseSchema = z.object({
  title: z
    .string()
    .max(500, 'Tiêu đề tối đa 500 ký tự')
    .transform((val) => sanitizeInput(val.trim())),
  content: z
    .string()
    .max(524288, 'Nội dung ghi chú tối đa 512KB'),
  color: z.enum(NOTE_COLOR_VALUES),
  is_pinned: z.boolean(),
  is_archived: z.boolean(),
});

export const noteCreateSchema = noteBaseSchema.extend({
  title: noteBaseSchema.shape.title.default(''),
  content: noteBaseSchema.shape.content.default(''),
  color: noteBaseSchema.shape.color.optional().default('default'),
  is_pinned: noteBaseSchema.shape.is_pinned.optional().default(false),
  is_archived: noteBaseSchema.shape.is_archived.optional().default(false),
  id: z.string().uuid().optional(), // Idempotency key do client cấp trước
});

export const noteUpdateSchema = noteBaseSchema.partial().extend({
  deleted_at: z.string().nullable().optional(),
});

export type NoteInput = z.input<typeof noteCreateSchema>;
export type NoteUpdate = z.input<typeof noteUpdateSchema>;

