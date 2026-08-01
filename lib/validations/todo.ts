import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';

export const todoCreateSchema = z.object({
  title: z.string()
    .min(1, 'Tiêu đề không được để trống')
    .max(500, 'Tiêu đề tối đa 500 ký tự')
    .transform(val => sanitizeInput(val.trim())),
  description: z.string()
    .max(5000, 'Mô tả tối đa 5000 ký tự')
    .transform(val => val ? sanitizeInput(val.trim()) : undefined)
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  due_date: z.string().datetime().optional(),
  category_id: z.string().uuid().optional(),
  is_vital: z.boolean().optional(),
  image_url: z.string().url().optional(),
});

export const todoUpdateSchema = todoCreateSchema.partial().extend({
  is_completed: z.boolean().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Tên danh mục không được trống').max(100, 'Tối đa 100 ký tự').transform(val => sanitizeInput(val.trim())),
  color: z.string().optional().default('#6366f1'),
});

export type TodoInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
