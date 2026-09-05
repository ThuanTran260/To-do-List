---
name: tiptap-prosemirror-best-practices
description: >-
  Best practices and architectural standards for integrating TipTap, ProseMirror,
  Tailwind Typography, and Supabase autosave in Flow State. Use whenever creating,
  modifying, or debugging rich text editors, task lists, and real-time autosave.
---

# TipTap & ProseMirror Best Practices Runbook (Proactive Architecture Edition)

Cẩm nang quy chuẩn kỹ thuật và xử lý sự cố chuyên sâu cho trình soạn thảo TipTap (ProseMirror), tích hợp Tailwind CSS Typography (`.prose`), bộ lọc khử khuẩn DOMPurify, và hệ thống lưu tự động bất đồng bộ (Autosave Engine) với Supabase.

---

## 1. 🛡️ Invariant 1: Sanitization Whitelist Mirroring & Schema Parity (SWMI)
*Phản ánh danh sách trắng làm sạch đối xứng giữa TipTap Nodes và DOMPurify.*

- **Bài học quá khứ**: Khi TipTap sinh cấu trúc TaskItem (`<ul class="task-list not-prose"><li data-type="taskItem"><label><input type="checkbox" /></label><div><p>...</p></div></li></ul>`), bộ lọc DOMPurify mặc định đã lọc bỏ thẻ `<label>`, `<input>`, `<div>` và thuộc tính `type="checkbox"`, `checked`, làm mất toàn bộ ô đánh dấu khi reload trang.
- **Giải pháp phòng ngừa tương lai**:
  1. **Nguyên tắc Đối Xứng Schema (Schema-Sanitizer Parity)**: Mọi extension mới của TipTap (ví dụ: `Table`, `Image`, `CodeBlockLowlight`, `Mention`, `Link`, `Mathematics/KaTeX`) **BẮT BUỘC** phải đăng ký đồng thời cấu trúc thẻ DOM và danh sách attributes vào CẢ HAI file:
     - Client: `lib/clientSanitize.ts` (`ALLOWED_TAGS`, `ALLOWED_ATTR`)
     - Server: `lib/sanitize/serverSanitize.ts` (JSDOM + DOMPurify instance)
  2. **Automated Sanitization Roundtrip Test**: Mọi extension mới phải có unit test: xuất HTML từ ProseMirror Node, truyền qua `sanitizeHtmlServer()` và `sanitizeHtml()`, xác nhận đầu ra bảo toàn 100% tags và data-attributes đặc thù.

---

## 2. ⚡ Invariant 2: Unidirectional AST Authority & React 19 Render Purity (UAST-P)
*Quyền lực đơn nguyên của ProseMirror AST và Tính thuần khiết trong Render Body của React 19.*

- **Bài học quá khứ**:
  - Dùng `useEffect` 2 chiều gọi `editor.commands.setContent(content)` khi state đổi kích hoạt vòng lặp vô hạn `Maximum update depth exceeded`, làm văng con trỏ và phá vỡ bộ gõ tiếng Việt (Telex/VNI).
  - Mutate `ref.current` (như `dataRef.current = ...`) ngay trong thân component render vi phạm nguyên tắc Render Purity của React 19 (React Forget Compiler), gây race condition trong Concurrent Rendering.
- **Giải pháp phòng ngừa tương lai**:
  1. **Single Source of Truth**: TipTap ProseMirror AST là nguồn chân lý duy nhất trong suốt phiên soạn thảo. Tuyệt đối không đẩy ngược dữ liệu từ React State vào TipTap khi cùng một ghi chú đang mở.
  2. **Atomic Note Transition**: Chỉ gọi `setContent()` khi và chỉ khi chuyển hẳn sang ghi chú khác (`note.id !== currentNoteIdRef.current`), và bắt buộc kèm `{ emitUpdate: false }`.
  3. **React 19 Ref Purity**: Toàn bộ thao tác đồng bộ `ref` phải nằm trong `useEffect` hoặc event handler (`onUpdate`), không bao giờ gán trực tiếp trong render body.

---

## 3. 🚨 Invariant 3: Dual-Layer Emergency Unload & 64KB Keepalive Quota (DLEU-K)
*Cơ chế thoát trang hai lớp và bảo vệ hạn mức 64KB Keepalive của trình duyệt.*

- **Bài học quá khứ**:
  - Khi đóng tab hoặc chuyển app trên mobile, sự kiện `visibilitychange` gửi fetch keepalive bị máy chủ từ chối vì thiếu header CSRF token, làm mất dữ liệu vừa gõ.
  - Trình duyệt Chromium/WebKit giới hạn tổng buffer của mọi request `keepalive: true` đang bay không được vượt quá **64KB**. Ghi chú lớn sẽ gây lỗi `TypeError: Keepalive buffer quota exceeded` và bị trình duyệt hủy bỏ.
- **Giải pháp phòng ngừa tương lai**:
  1. **Local-First Persistence Priority**: Luôn gọi `saveEmergencyDraft()` vào `localStorage` TRƯỚC TIÊN. Thao tác này chạy đồng bộ (synchronous) nên 100% không thể bị ngắt bởi việc đóng tab hay mất mạng.
  2. **Keepalive Payload Capping (50KB Ceiling)**: Request nền gửi qua `csrfFetch('/api/notes/sync')` kèm `{ keepalive: true }` bắt buộc phải cắt chuỗi nội dung dưới 50,000 ký tự (`content.slice(0, 50000)`) để luôn nằm trong vùng an toàn của hạn mức 64KB.

---

## 4. 🔢 Invariant 4: Monotonic Integer Versioning vs Timestamp Precision (MIV)
*Đánh số phiên bản số nguyên tịnh tiến thay thế chuỗi timestamp trong Optimistic Lock.*

- **Bài học quá khứ**: So khớp `.eq('updated_at', lastKnownUpdatedAt)` sinh lỗi HTTP 406 Not Acceptable (PGRST116) do sai lệch microsecond giữa JavaScript (`.toISOString()` - 3 chữ số millisecond) và PostgreSQL (`timestamptz` - 6 chữ số microsecond).
- **Giải pháp phòng ngừa tương lai**:
  1. **Tuyệt đối cấm dùng Timestamp trong WHERE clause của PostgREST**: Không bao giờ so sánh chuỗi thời gian để khóa phiên bản.
  2. **Monotonic Integer Versioning**: Khi thiết kế hoặc nâng cấp bảng lưu trữ TipTap, bổ sung cột `version integer not null default 1`. Thao tác cập nhật thực thi:
     ```ts
     await supabase
       .from('notes')
       .update({ ...payload, version: currentVersion + 1 })
       .eq('id', id)
       .eq('version', currentVersion);
     ```
     Nếu trả về 0 row affected ➔ phát hiện xung đột phiên bản thực sự 100% chuẩn xác.
  3. **Client Save Sequence Guard (`saveSeqRef`)**: Duy trì biến đếm `saveSeqRef.current++`. Response mạng trả về chậm hơn nhịp lưu mới hơn sẽ bị hủy ngay lập tức, triệt tiêu lỗi ghi đè kết quả cũ.

---

## 5. 👆 Invariant 5: Universal Pointer Event Neutralization (UPEN)
*Vô hiệu hóa cướp focus trên cả thiết bị chuột (Desktop) và cảm ứng (Touch/Mobile).*

- **Bài học & Nguy cơ**: Thẻ `<button>` trên toolbar cướp focus khỏi ProseMirror khi click. Trên thiết bị di động (iOS Safari, Android Chrome), sự kiện `touchstart`/`pointerdown` diễn ra TRƯỚC `mousedown`. Nếu chỉ chặn `onMouseDown`, bàn phím ảo trên điện thoại vẫn bị giật tụt xuống rồi bật lên liên tục.
- **Giải pháp phòng ngừa tương lai**:
  Mọi nút bấm trên thanh công cụ soạn thảo **BẮT BUỘC PHẢI CHẶN CẢ HAI SỰ KIỆN POINTER**:
  ```tsx
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onTouchStart={(e) => e.preventDefault()}
    onClick={() => editor?.chain().focus().toggleTaskList().run()}
  >
    <CheckSquare className="w-4 h-4" />
  </button>
  ```

---

## 6. 📐 Invariant 6: Strict Layout & Baseline Geometry Isolation (SLGI)
*Cô lập bố cục và đồng nhất chiều cao dòng cơ sở (24px / 1.5rem).*

- **Bài học**: Lớp `.prose` của Tailwind Typography tự động áp `margin-top: 1.25em` lên `<p>` và `display: list-item` lên `<li>`. Khi TipTap render cấu trúc `TaskItem`, checkbox bị đẩy lên trên và văn bản rớt xuống dòng riêng.
- **Giải pháp phòng ngừa tương lai**:
  1. **Gán `not-prose` trực tiếp vào Extension Config**:
     ```tsx
     TaskList.configure({
       HTMLAttributes: { class: 'not-prose task-list space-y-1 my-2 p-0 list-none' },
     }),
     TaskItem.configure({
       nested: true,
       HTMLAttributes: { class: 'flex flex-row items-start gap-2.5 my-1 list-none' },
     }),
     ```
  2. **Baseline Line-Height Lock (24px / 1.5rem)**: Khóa cứng chiều cao dòng của `<label>` bọc checkbox và thẻ `<p>` bên trong `<div>`:
     ```css
     ul.task-list li > label {
       display: flex !important;
       align-items: center !important;
       justify-content: center !important;
       flex: 0 0 1.25rem !important;
       width: 1.25rem !important;
       height: 1.5rem !important;
       line-height: 1.5rem !important;
     }
     ul.task-list li > div > p {
       margin: 0 !important;
       padding: 0 !important;
       line-height: 1.5rem !important;
       min-height: 1.5rem !important;
     }
     ```

---

## 7. 🔄 Invariant 7: Multi-Tab Concurrency & User Isolation Boundary (MTBC)
*Đồng bộ đa tab an toàn và phân cách ranh giới tài khoản người dùng.*

- **Bài học**: Dùng `BroadcastChannel` đồng bộ nháp giữa các tab vô tình tạo vòng lặp phản hồi (Tab A gửi sang Tab B ➔ Tab B kích hoạt `onUpdate` ➔ gửi ngược lại Tab A). Khi đổi tài khoản, nháp người cũ bị lộ cho người mới.
- **Giải pháp phòng ngừa tương lai**:
  1. **Tab Session Tagging**: Mỗi tab sinh `tabSessionId` ngẫu nhiên khi khởi tạo. Payload gửi qua BroadcastChannel kèm mã này; tab nhận nếu thấy trùng `tabSessionId` của chính mình thì bỏ qua ngay lập tức.
  2. **Draft Namespacing Boundary**: Khóa nháp định dạng `note_draft_${userId}:${noteId}`. BroadcastChannel chỉ áp dụng payload nếu `payload.userId === currentUserId`. Khi đăng xuất, hàm `clearAllNoteDrafts()` dọn sạch toàn bộ bộ nhớ nháp trên máy.

---

## 8. 🏎️ Invariant 8: Document Scalability & INP Performance Isolation (DS-INP)
*Kiểm soát hiệu năng gõ phím và tối ưu hóa rác bộ nhớ (Core Web Vitals INP).*

- **Nguy cơ tương lai**: Gọi `editor.getHTML()` liên tục trong sự kiện `onUpdate` trên mỗi ký tự gõ phím kích hoạt ProseMirror tuần tự hóa toàn bộ cây tài liệu thành chuỗi HTML. Với ghi chú dài hàng nghìn từ, thao tác này chiếm 15–30ms trên main thread, gây nghẽn khung hình và phá vỡ chỉ số Core Web Vitals **INP (Interaction to Next Paint)**.
- **Giải pháp phòng ngừa tương lai**:
  1. **Transaction docChanged Gate**: Chỉ kích hoạt cập nhật trạng thái bẩn (`isDirtyRef.current = true`) khi `transaction.docChanged === true`, bỏ qua các giao dịch chỉ thay đổi vị trí con trỏ (Selection Transactions).
  2. **Lazy HTML Serialization**: Trong `onUpdate`, chỉ đánh dấu cờ bẩn. Thao tác gọi `editor.getHTML()` chỉ được thực thi một lần duy nhất khi bộ đếm debounce (600ms) kết thúc và chuẩn bị phát request lưu mạng.

---

## 9. 🔍 Bảng Tra Cứu Sự Cố Nhanh (Troubleshooting Matrix)

| Hiện Tượng Lỗi | Nguyên Nhân Gốc Rễ | Quy Chuẩn Khắc Phục Bắt Buộc |
|---|---|---|
| Mất ô checkbox sau khi reload trang | DOMPurify lọc bỏ `<label>`, `<input>`, `<div>` | Cập nhật đồng bộ `ALLOWED_TAGS` và `ALLOWED_ATTR` ở cả `clientSanitize.ts` và `serverSanitize.ts` (Invariant 1). |
| Bàn phím ảo giật lag liên tục trên điện thoại | Thiếu chặn sự kiện touch trên toolbar | Bổ sung `onTouchStart={(e) => e.preventDefault()}` vào tất cả các `<button>` (Invariant 5). |
| Đóng tab trên mobile bị mất dòng cuối cùng | Fetch keepalive bị chặn CSRF hoặc vượt 64KB | Ghi `localStorage` trước tiên; giới hạn `keepalive` dưới 50KB kèm `csrfFetch` (Invariant 3). |
| Trình duyệt báo `Maximum update depth exceeded` | `useEffect` 2 chiều ép `setContent` khi gõ | Gỡ bỏ 2-way sync; TipTap AST là Single Source of Truth (Invariant 2). |
| Lỗi `406 Not Acceptable` khi lưu lên Supabase | Sai lệch microsecond timestamp trong REST WHERE | Không so sánh timestamp; chuyển sang Monotonic Integer Versioning (Invariant 4). |
| Con trỏ văn bản rớt xuống dòng dưới ô checkbox | `.prose` ép margin và display list-item | Áp `not-prose` trên extension + khóa cứng `line-height: 1.5rem` (Invariant 6). |
| Lag đơ khi gõ trong tài liệu dài | Gọi `getHTML()` trên mỗi phím bấm | Áp dụng Transaction `docChanged` gate + Lazy Serialization khi hết debounce (Invariant 8). |
