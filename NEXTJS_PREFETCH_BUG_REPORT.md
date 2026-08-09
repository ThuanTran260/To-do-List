# 🐛 Báo Cáo Lỗi: Next.js `<Link>` Prefetch & Supabase Auto-Logout (Phantom Bug)

**Ngày ghi nhận:** 10/08/2026
**Mức độ nghiêm trọng:** Nghiêm trọng (Gây gián đoạn hoàn toàn luồng đăng nhập của người dùng).
**Triệu chứng:** Đăng nhập thành công nhưng ngay lập tức bị văng ra trang Login, hoặc Console báo lỗi `403 Forbidden` kèm thông báo `{"code":"session_not_found","message":"Session from session_id claim in JWT does not exist"}`. Hiện tượng xảy ra "chập chờn", khác biệt giữa PC và Mobile.

---

## 🔍 Nguyên Nhân Gốc Rễ (Root Cause Analysis)

Lỗi này là sự kết hợp "chết người" giữa 2 cơ chế của **Next.js App Router** và **Supabase GoTrue**:

1. **Cơ chế Prefetch ngầm của Next.js:** 
   Trong Next.js, component `<Link>` được thiết kế để tối ưu hóa tốc độ tải trang. Bất cứ khi nào một thẻ `<Link>` xuất hiện trong màn hình (viewport), Next.js sẽ tự động **gửi một HTTP GET Request ngầm** ở chế độ nền (background) tới URL đó để tải trước dữ liệu.
2. **Thiết kế Route Đăng xuất (Logout) sai nguyên tắc REST:**
   Route xử lý đăng xuất (`/auth/logout/route.ts`) được xây dựng dưới dạng một `GET` Handler và thực thi lệnh hủy session toàn cục: `await supabase.auth.signOut({ scope: 'global' })`.
3. **Phản ứng Dây chuyền (The Chain Reaction):**
   - Người dùng đăng nhập thành công.
   - Giao diện (React) lập tức cập nhật trạng thái, hiển thị Banner thông báo "Đang đăng nhập" kèm một nút Đăng xuất sử dụng `<Link href="/auth/logout">`.
   - Ngay khoảnh khắc nút này xuất hiện trên màn hình, Next.js kích hoạt cơ chế Prefetch, lập tức bắn một request ngầm tới `/auth/logout`.
   - Máy chủ Vercel nhận được request, thực thi hàm `signOut`, và **xóa sổ phiên đăng nhập (Session) khỏi cơ sở dữ liệu Supabase.**
   - Vài mili-giây sau, trình duyệt chuyển hướng người dùng sang `/dashboard`. Client gửi Token JWT lên Supabase để lấy dữ liệu.
   - Supabase kiểm tra Database, thấy Session này vừa bị xóa, nên thẳng tay trả về lỗi `403 - session_not_found`. Kết quả: Người dùng bị hệ thống đá văng ra ngoài.

---

## 🛠️ Cách Khắc Phục (The Fix)

**Giải pháp đã áp dụng:**
Thay thế toàn bộ thẻ `<Link href="/auth/logout">` thành thẻ HTML cơ bản `<a href="/auth/logout">`. 
Thẻ `<a>` thuần túy không bị Next.js can thiệp, do đó triệt tiêu hoàn toàn hiện tượng tự động chạy ngầm (prefetching).

**Đoạn code bị lỗi:**
```tsx
import Link from 'next/link';

// LỖI: Next.js sẽ ngầm fetch URL này và vô tình kích hoạt API đăng xuất
<Link href="/auth/logout">
  Đăng xuất
</Link>
```

**Đoạn code đã sửa:**
```tsx
// CHUẨN: Thẻ <a> thuần túy buộc trình duyệt phải click thật mới kích hoạt
<a href="/auth/logout">
  Đăng xuất
</a>
```

---

## 💡 Bài Học Rút Ra & Thực Hành Tốt Nhất (Best Practices)

Để không bao giờ lặp lại lỗi này trong các dự án Next.js tương lai, hãy tuân thủ 3 nguyên tắc sau:

### 1. KHÔNG BAO GIỜ dùng `<Link>` cho các thao tác phá hủy (Destructive Actions)
Các hành động làm thay đổi dữ liệu (Đăng xuất, Xóa, Cập nhật...) **tuyệt đối không được bọc trong thẻ `<Link>`**. Hãy dùng thẻ `<button onClick={...}>` hoặc thẻ `<a>` tiêu chuẩn.

### 2. Thiết kế API tuân thủ tính Tương đồng (Idempotency)
Theo chuẩn RESTful, phương thức `GET` chỉ nên dùng để ĐỌC dữ liệu và phải an toàn (không làm thay đổi trạng thái Database). Việc dùng `GET` để xóa Session (Đăng xuất) là một Anti-pattern (mẫu thiết kế tồi). 
*Cách làm chuẩn:* Route `/auth/logout` nên được viết dưới dạng `POST` Handler, và gọi nó thông qua một `<form action="/auth/logout" method="POST">` hoặc `fetch(..., { method: 'POST' })`.

### 3. Cảnh giác với Race Conditions trong React
Khi một Session bỗng nhiên "bốc hơi" ngay khi vừa tạo, hãy luôn đặt nghi vấn về các request chạy ngầm:
- Component `<Link>` prefetch.
- Hàm `useEffect` bị chạy 2 lần (do React Strict Mode).
- Lỗi vòng lặp vô tận (Infinite Loop) trong Middleware.
