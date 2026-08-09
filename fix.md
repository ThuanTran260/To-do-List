# 🛠️ Phân Tích & Giải Pháp Khắc Phục Lỗi Vòng Đời Cookie ("Ghi Nhớ Đăng Nhập")

> Tài liệu tổng hợp các phát hiện quan trọng, nguyên nhân gốc rễ và mã nguồn khắc phục triệt để lỗi duy trì phiên đăng nhập khi **KHÔNG** chọn "Ghi nhớ đăng nhập".

---

## 1. 🔍 Phân Tích Nguyên Nhân Gốc Rễ (RCA)

1. **Bug `max-age=0` trên cookie `sb-remember-me` trong `LoginForm.tsx`**:
   - Trước đây: khi `rememberMe === false`, code chạy `document.cookie = 'sb-remember-me=false; path=/; max-age=0; SameSite=Lax';`.
   - Thuộc tính `max-age=0` khiến cookie `sb-remember-me` bị trình duyệt xóa **ngay lập tức** lúc vừa bấm đăng nhập!
   - Kết quả: Khi `@supabase/ssr` gọi callback `setAll()`, nó không còn tìm thấy cookie `sb-remember-me` nữa ➔ Hệ thống fallback nhầm về trạng thái mặc định hoặc ghi cookie 400 ngày.

2. **Bug Mặc Định 400 Ngày của `@supabase/ssr` (`createBrowserClient`)**:
   - `createBrowserClient` từ `@supabase/ssr` khi đăng nhập client-side (`signInWithPassword`) tự động ghi các cookie auth (`sb-xxxx-auth-token`) với thời hạn mặc định **400 ngày**.
   - Tham số `cookieOptions` cấp cao truyền vào `createBrowserClient` có nguy cơ bị thư viện bỏ qua (Issue #40 trên Supabase SSR repository).
   - **Giải pháp:** Ghi đè trực tiếp callback `cookies: { getAll, setAll }` trong `createBrowserClient` để kiểm soát điểm ghi `document.cookie` thực sự.

3. **Bất đối xứng mã hóa Cookie (`encode` / `decode`)**:
   - Khi ghi cookie trong `setAll`: `encodeURIComponent(value)`.
   - Khi đọc cookie trong `getAll`: thiếu `decodeURIComponent(val)`.
   - **Giải pháp:** Dùng helper `parseDocumentCookies()` với `safeDecode()` có `try/catch` bọc `decodeURIComponent` để đảm bảo các chuỗi Token/JSON/Base64 của Supabase không bị hỏng.

4. **Edge-case `document.cookie` Rỗng**:
   - Khi chưa có cookie, `"".split('; ')` trả về `['']` ➔ mảng rác `{name: '', value: ''}`.
   - **Giải pháp:** Guard `if (typeof document === 'undefined' || !document.cookie) return [];`.

---

## 2. 📝 Mã Nguồn Khắc Phục Chuẩn (Production-Grade)

### 2.1 `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr';

function safeDecode(val: string): string {
  try {
    return decodeURIComponent(val);
  } catch {
    return val;
  }
}

export function parseDocumentCookies() {
  if (typeof document === 'undefined' || !document.cookie) return [];
  return document.cookie
    .split('; ')
    .filter(Boolean)
    .map((c) => {
      const [name, ...val] = c.split('=');
      return {
        name: name.trim(),
        value: safeDecode(val.join('=')),
      };
    });
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  if (process.env.NODE_ENV !== 'production' && url.includes('placeholder')) {
    console.warn('[Supabase Client] NEXT_PUBLIC_SUPABASE_URL chưa được cấu hình. Đang dùng SSG fallback mode.');
  }

  return createBrowserClient(url, anonKey, {
    cookies: {
      getAll() {
        return parseDocumentCookies();
      },
      setAll(cookiesToSet) {
        if (typeof document === 'undefined') return;

        const currentCookies = parseDocumentCookies();
        const isRemembered = currentCookies.some(
          (c) => c.name === 'sb-remember-me' && c.value === 'true'
        );

        cookiesToSet.forEach(({ name, value, options }) => {
          const maxAge = isRemembered ? 2592000 : undefined; // 30 ngày vs Session Cookie
          let cookieStr = `${name}=${encodeURIComponent(value)}; path=${options?.path || '/'}; SameSite=${options?.sameSite || 'Lax'}`;

          if (options?.domain) {
            cookieStr += `; domain=${options.domain}`;
          }

          if (maxAge) {
            cookieStr += `; max-age=${maxAge}`;
          }

          if (process.env.NODE_ENV === 'production') {
            cookieStr += '; Secure';
          }

          document.cookie = cookieStr;
        });
      },
    },
  });
}
```

### 2.2 `components/auth/LoginForm.tsx`

```typescript
// Sửa thuộc tính cookie sb-remember-me (Bỏ max-age=0 để cookie sống ở dạng Session Cookie khi rememberMe = false)
const isProd = process.env.NODE_ENV === 'production';
const secureFlag = isProd ? '; Secure' : '';

if (rememberMe) {
  document.cookie = `sb-remember-me=true; path=/; max-age=2592000; SameSite=Lax${secureFlag}`;
} else {
  document.cookie = `sb-remember-me=false; path=/; SameSite=Lax${secureFlag}`;
}
```

---

## 3. ✅ Kế Hoạch Kiểm Định Ground-Truth

1. **DevTools Cookie Verification:**
   - **Remember = OFF:** Đăng nhập không chọn ghi nhớ ➔ DevTools > Application > Cookies ➔ Kiểm tra cột **Expires / Max-Age = Session** cho các cookie `sb-xxxx-auth-token` và `sb-remember-me`.
   - **Remember = ON:** Đăng nhập chọn ghi nhớ ➔ Cột **Expires / Max-Age** có hạn 30 ngày.
2. **Token Refresh Persistence Test:**
   - Đăng nhập `Remember = OFF` ➔ Chạy `(await import('@/lib/supabase/client')).createClient().auth.refreshSession()` trong Console ➔ Xác nhận cookie vẫn giữ `Expires/Max-Age = Session`.
3. **Browser Close Test:**
   - Đóng toàn bộ cửa sổ trình duyệt ➔ Mở lại ứng dụng ➔ Hệ thống tự động chuyển về trạng thái chưa đăng nhập.
