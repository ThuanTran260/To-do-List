import { z } from 'zod';

export const passwordSchema = z.string().min(8, 'Mật khẩu tối thiểu 8 ký tự');

// Login chỉ check non-empty: user cũ pass 6-7 ký tự vẫn login được (policy min 8
// chỉ enforce ở signup/update/reset — tránh khoá user hiện tại).
export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export const signupSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: passwordSchema,
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Tên hiển thị không được để trống').max(100, 'Tên hiển thị tối đa 100 ký tự').optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
