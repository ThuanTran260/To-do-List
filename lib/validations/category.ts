import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

/**
 * C-05 fix: categorySchema tách khỏi todo.ts (misplaced) — validation riêng cho categories.
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh mục không được trống')
    .max(100, 'Tối đa 100 ký tự')
    .transform((val) => sanitizeInput(val.trim())),
  color: z.string().optional().default('#6366f1'),
});

export type CategoryInput = z.infer<typeof categorySchema>;
