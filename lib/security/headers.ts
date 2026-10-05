/**
 * Nguồn duy nhất cho Permissions-Policy.
 * Trước đây khai báo ở 3 nơi với 2 giá trị khác nhau (next.config.ts,
 * lib/supabase/middleware.ts, vercel.json) -> header thắng phụ thuộc thứ tự ghi.
 * Giữ nguyên payment=() của vercel.json vì đây là bản nghiêm nhất.
 */
export const PERMISSIONS_POLICY =
  'camera=(), microphone=(), geolocation=(), payment=()';
