import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { normalizeHexColor } from '@/lib/tags/tagColor';

/**
 * C-05 fix: categorySchema tách khỏi todo.ts (misplaced) — validation riêng cho categories.
 */
export const categorySchema = z.object({
  name: z
    .string()
    .transform((val) => sanitizeInput(val.trim()))
    .pipe(
      z.string()
        .min(1, 'Tên danh mục không được trống')
        .max(100, 'Tối đa 100 ký tự')
    ),
  color: z
    .string()
    .optional()
    .transform((c) => normalizeHexColor(c)),
});

export type CategoryInput = z.infer<typeof categorySchema>;
