import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự'),
});

export const signupSchema = loginSchema.extend({
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Tên hiển thị không được để trống').max(100, 'Tên hiển thị tối đa 100 ký tự').optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
