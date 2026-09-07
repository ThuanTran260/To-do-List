import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { normalizeHexColor } from '@/lib/tags/tagColor';

export const tagSchema = z.object({
  name: z
    .string()
    .transform((v) => sanitizeInput(v.trim()))
    .pipe(
      z.string()
        .min(1, 'Tên thẻ không được để trống')
        .max(50, 'Tên thẻ tối đa 50 ký tự')
    ),
  color: z
    .string()
    .optional()
    .transform((c) => normalizeHexColor(c)),
});

export type TagInput = z.infer<typeof tagSchema>;
