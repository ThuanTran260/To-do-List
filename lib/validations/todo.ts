import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitize';
import { categorySchema } from '@/lib/validations/category';

// L-05 fix: checklist từ z.array(z.any()) → strict contract khớp types/todo.ts ChecklistItem
const checklistItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  is_done: z.boolean(),
});

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
  due_date: z.string().optional().nullable(),
  category_id: z.string().uuid().optional(),
  is_vital: z.boolean().optional(),
  image_url: z.string().url().optional(),
  checklist: z.array(checklistItemSchema).optional(),
  recurrence_rule: z.string().nullable().optional(),
  sort_order: z.number().optional(),
  pomodoro_count: z.number().optional(),
});

export const todoUpdateSchema = todoCreateSchema.partial().extend({
  is_completed: z.boolean().optional(),
});

// Re-export giữ backward compat với các import cũ từ '@/lib/validations/todo'
export { categorySchema };
export type { CategoryInput } from '@/lib/validations/category';

export type TodoInput = z.infer<typeof todoCreateSchema>;
export type TodoUpdate = z.infer<typeof todoUpdateSchema>;
