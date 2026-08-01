# Bộ Prompt Triển Khai UI/UX Cho FlowState — v2

> **Cách dùng:** Đưa từng prompt cho agent (Claude Code/Cursor) theo đúng thứ tự bên dưới.
> Prompt #0 phải chạy trước tiên vì các component sau phụ thuộc vào nó.

---

## Prompt #0 — Nền tảng chung (BẮT BUỘC chạy trước)

```
Trước khi code các popover/dropdown mới (Search, Calendar, Notification), 
hãy thiết lập nền tảng chung cho toàn bộ dự án:

1. TẠO SHARED ANIMATION CONFIG
   - Tạo file lib/motion.ts (hoặc constants/animation.ts) chứa config 
     Framer Motion dùng chung cho mọi popover/dropdown/panel trong app:
     
     export const popoverMotion = {
       initial: { opacity: 0, y: -8, scale: 0.96 },
       animate: { opacity: 1, y: 0, scale: 1 },
       exit: { opacity: 0, y: -8, scale: 0.96 },
       transition: { type: "spring", stiffness: 300, damping: 25 }
     }
     
     export const overlayMotion = {
       initial: { opacity: 0 },
       animate: { opacity: 1 },
       exit: { opacity: 0 },
       transition: { duration: 0.15 }
     }
   
   - Mọi popover mới (SearchAutocomplete, CalendarPopover, 
     NotificationPopover) phải import và dùng chung config này, 
     không tự định nghĩa animation riêng.

2. TẠO SHARED UI STATE COMPONENTS
   Tạo các component dùng chung trong components/ui/state/:
   - <LoadingSkeleton variant="list" | "card" | "text" /> — skeleton 
     loading dùng chung, style khớp dark theme hiện tại của app.
   - <EmptyState icon={...} title="..." description="..." /> — trạng 
     thái rỗng dùng chung (VD: "Không tìm thấy kết quả", "Chưa có 
     thông báo nào").
   - <ErrorState message="..." onRetry={...} /> — trạng thái lỗi có 
     nút thử lại.
   Mọi component fetch dữ liệu (search, notification, category) đều 
   phải dùng 3 state này thay vì tự viết loading/error riêng.

3. QUẢN LÝ CLICK-OUTSIDE VÀ SINGLE-PANEL-OPEN
   Tạo hook dùng chung hooks/useDropdownManager.ts (dùng Context) để:
   - Đảm bảo chỉ 1 popover được mở tại 1 thời điểm (mở cái mới thì tự 
     đóng cái cũ).
   - Xử lý click outside để đóng popover (dùng 1 listener chung, không 
     phải mỗi component tự thêm event listener riêng — tránh xung đột).
   - Xử lý phím Esc để đóng popover đang mở, dù đang focus ở đâu.

4. FLOATING POSITION (chống tràn màn hình)
   Cài đặt @floating-ui/react nếu chưa có. Tạo wrapper component 
   <FloatingPanel anchorRef={...} placement="bottom-start"> để các 
   popover tự động flip vị trí khi gần mép màn hình (đặc biệt quan 
   trọng cho mobile và calendar popover).

5. DATA LAYER
   Cho biết dự án đang dùng React Query/SWR/Zustand hay chỉ 
   useState+useEffect thuần để mình quyết định cách tích hợp Supabase 
   Realtime cho Notification/Categories ở các bước sau. Nếu chưa có 
   thư viện fetching nào, hãy cài đặt @tanstack/react-query vì mình sẽ 
   cần cache + optimistic update + realtime invalidation ở các 
   component tiếp theo.

Không cần code UI cụ thể ở bước này — chỉ tạo nền tảng (config, hooks, 
component dùng chung) để các bước sau tái sử dụng.
```

---

## Prompt #1 — Search Autocomplete

```
Tạo component components/widget/SearchAutocomplete.tsx thay thế ô 
search tĩnh hiện tại ở header. Dùng chung popoverMotion, LoadingSkeleton, 
EmptyState, ErrorState, useDropdownManager, FloatingPanel đã tạo ở bước 
nền tảng.

YÊU CẦU CHỨC NĂNG:
1. Debounce input 300ms trước khi query (dùng useDebouncedValue hoặc 
   lodash.debounce).
2. Dùng AbortController: mỗi lần gõ mới phải abort request cũ để tránh 
   race condition (kết quả cũ trả về sau đè lên kết quả mới).
3. Query trên cả title, description, và category name của task (JOIN 
   nếu cần), không chỉ title.
4. States rõ ràng: idle (chưa gõ gì) → loading (đang debounce/fetch) → 
   empty (gõ xong, không có kết quả) → success (có kết quả) → error 
   (fetch lỗi, có nút Thử lại).

YÊU CẦU UX:
5. Keyboard nav chuẩn WAI-ARIA:
   - ArrowDown/ArrowUp: di chuyển giữa các kết quả, có vòng lặp 
     (xuống hết thì quay lại đầu).
   - Enter: mở modal chi tiết task đang highlight.
   - Esc: đóng dropdown, blur input.
   - Dùng role="listbox", role="option", aria-selected, 
     aria-activedescendant đúng chuẩn.
6. Highlight từ khóa khớp trong kết quả: bọc phần text trùng khớp 
   trong <mark> hoặc <span className="text-purple-400 font-semibold">, 
   so khớp không phân biệt hoa/thường và không phân biệt dấu tiếng 
   Việt (dùng thư viện diacritics hoặc tự viết hàm loại dấu để so sánh).
7. Aria-live region (aria-live="polite") thông báo số lượng kết quả 
   cho screen reader mỗi khi kết quả thay đổi.
8. Animation: dropdown xuất hiện bằng popoverMotion, mỗi item trong 
   danh sách kết quả nên có stagger nhẹ (delay 20-30ms mỗi item) khi 
   xuất hiện lần đầu.
9. Giới hạn hiển thị 8 kết quả, nếu nhiều hơn thêm text "Xem tất cả X 
   kết quả" dẫn tới trang search đầy đủ (nếu app đã có/sẽ có trang đó; 
   nếu chưa có, bỏ qua phần này).

Test lại bằng cách: gõ nhanh liên tục 1 từ khóa, xác nhận không có 
hiện tượng kết quả cũ đè kết quả mới; gõ từ khóa không tồn tại xác 
nhận empty state hiển thị đúng.
```

---

## Prompt #2 — Calendar Popover

```
Tạo component components/widget/CalendarPopover.tsx thay thế icon 
calendar tĩnh ở header. Dùng chung popoverMotion, FloatingPanel, 
useDropdownManager.

YÊU CẦU CHỨC NĂNG:
1. Hiển thị lịch tháng hiện tại, có dot indicator nhỏ dưới các ngày có 
   task (màu dot theo priority cao nhất của ngày đó: đỏ=cao, 
   vàng=trung bình, xanh=thấp).
2. Click chọn 1 ngày → tự động lọc danh sách Todo trên Dashboard theo 
   ngày đó (dùng shared state/query param, KHÔNG chuyển trang).
3. Nút "+ Thêm việc cho ngày này" trong popover: mở quick-add input 
   ngay trong popover, không cần đóng popover hay chuyển trang. Sau 
   khi thêm xong, dot indicator của ngày đó cập nhật ngay (optimistic 
   update).
4. Nút "Hôm nay" luôn hiển thị góc trên, bấm để nhảy nhanh về tháng/
   ngày hiện tại dù đang xem tháng nào.
5. Chuyển tháng (nút < >) có hiệu ứng CSS slide animation mượt 
   (translateX, dùng AnimatePresence mode="wait" của Framer Motion, 
   hướng slide theo hướng bấm next/prev), đảm bảo 60fps (chỉ animate 
   transform/opacity).

YÊU CẦU XỬ LÝ EDGE-CASE:
6. Timezone: đảm bảo ngày hiển thị trên lịch khớp với giờ Việt Nam 
   (Asia/Ho_Chi_Minh), không bị lệch ngày với task có due_date gần 
   nửa đêm UTC. Dùng date-fns-tz hoặc dayjs với plugin timezone.
7. First day of week = Thứ Hai (locale vi-VN), không dùng mặc định 
   Chủ Nhật của thư viện lịch.
8. Task không có due_date: không hiển thị trên lịch, nhưng khi lọc 
   theo "Tất cả" ở Dashboard vẫn phải xuất hiện — xác nhận logic lọc 
   không làm mất các task này.
9. FloatingPanel tự flip vị trí nếu popover mở gần mép phải/dưới màn 
   hình (đặc biệt test trên viewport nhỏ/mobile).

Test lại: chọn ngày 31/12/2026 (có sẵn task VibeCoding trong dữ liệu 
mẫu) → xác nhận Dashboard lọc đúng task đó; test thêm task lúc 23h50 
xác nhận nó nằm đúng ngày trên lịch theo giờ VN chứ không bị nhảy 
sang ngày hôm sau do UTC.
```

---

## Prompt #3 — Notification Center

```
Tạo component components/widget/NotificationPopover.tsx thay thế icon 
chuông tĩnh ở header. Dùng chung popoverMotion, LoadingSkeleton, 
EmptyState, useDropdownManager, và React Query (hoặc thư viện fetching 
đã xác nhận ở Prompt #0).

YÊU CẦU CHỨC NĂNG:
1. REALTIME: dùng Supabase Realtime subscription (postgres_changes) 
   lắng nghe bảng notifications/tasks để badge số lượng và danh sách 
   tự cập nhật khi có thay đổi, KHÔNG chỉ fetch 1 lần lúc mount. Nếu 
   user mở 2 tab, đánh dấu đã đọc ở tab A phải phản ánh sang tab B.
2. Phân loại 3 nhóm rõ rệt, có header phân cách trong danh sách:
   - 🔴 Quá hạn (task có due_date < now, chưa complete)
   - 🟡 Sắp đến hạn (due_date trong 24h tới)
   - ⭐ Việc quan trọng (task được đánh dấu Vital)
3. Mỗi card thông báo có 2 nút quick action:
   - "Đã xong": cập nhật task status=completed ngay (optimistic 
     update — cập nhật UI trước, rollback nếu request lỗi), không 
     cần rời popover.
   - "Ẩn thông báo": dismiss khỏi danh sách. LƯU Ý: phải có cơ chế 
     Undo — hiện toast "Đã ẩn thông báo [Hoàn tác]" trong 5 giây, 
     bấm Hoàn tác thì khôi phục lại.
4. Nút "Đánh dấu tất cả đã đọc" ở header của popover (bulk action), 
   riêng biệt với việc dismiss từng cái.
5. Badge chấm đỏ trên icon chuông: có animation pulse nhẹ (scale 
   1→1.15→1, lặp lại chu kỳ 2s) khi có thông báo unread mới, dùng 
   Framer Motion animate với repeat: Infinity.

YÊU CẦU HIỆU NĂNG:
6. Giới hạn hiển thị 20 thông báo gần nhất trong popover, thêm nút 
   "Xem thêm" load thêm 20 cái tiếp theo (infinite scroll trong 
   popover hoặc pagination đơn giản), tránh render hết toàn bộ lịch 
   sử thông báo cùng lúc.

Test lại: mở app trên 2 tab trình duyệt, đánh dấu đã đọc ở tab 1, xác 
nhận tab 2 cập nhật theo (không cần reload); dismiss 1 thông báo, bấm 
Hoàn tác trong toast, xác nhận thông báo quay lại đúng vị trí.
```

---

## Prompt #4 — Sidebar Navigation & Layout Transitions

```
Cải thiện components/layout/Sidebar.tsx (menu Dashboard, Vital Tasks, 
My Tasks, Task Categories...) với các yêu cầu sau:

1. ACTIVE PILL ANIMATION:
   Dùng Framer Motion layoutId (VD: layoutId="sidebar-active-pill") 
   để vệt màu tím active tự động trượt mượt giữa các mục khi user 
   click chuyển tab, dùng transition cubic-bezier(0.4, 0, 0.2, 1), 
   duration ~250ms. Đây là kỹ thuật "magic move" chuẩn của Framer 
   Motion, không cần tự tính toán vị trí bằng tay.

2. PERFORMANCE:
   - Thêm will-change: transform vào pill đang animate.
   - Nếu dùng Next.js: dùng <Link prefetch> cho các route trong 
     sidebar để prefetch sẵn, giảm độ trễ chuyển trang.

3. ACCESSIBILITY:
   - Thêm aria-current="page" cho menu item đang active.
   - Đảm bảo khi chuyển trang bằng bàn phím (Tab + Enter), focus 
     được chuyển đúng tới heading/nội dung chính của trang mới (dùng 
     ref + focus() trong useEffect khi route thay đổi), không để 
     focus bị "mất" giữa chừng.

4. RESPONSIVE (MOBILE):
   - Dưới breakpoint 768px: sidebar chuyển thành trạng thái ẩn mặc 
     định, hiện icon hamburger menu ở header để mở/đóng.
   - Sidebar trên mobile mở dạng overlay trượt từ trái (slide-in, 
     dùng chung popoverMotion pattern nhưng translateX thay vì Y), có 
     backdrop tối phía sau, bấm backdrop để đóng.
   - Khi chuyển sang mobile, đảm bảo state active pill vẫn hoạt động 
     đúng sau khi sidebar đóng/mở lại.

5. UNSAVED CHANGES WARNING (nếu áp dụng được):
   Nếu user đang có input/form dở dang (VD: đang gõ task mới ở ô 
   "Thêm việc cần làm mới" mà chưa submit) và bấm chuyển sang tab 
   khác trong sidebar, hiển thị confirm dialog nhỏ "Bạn có thay đổi 
   chưa lưu, tiếp tục rời trang?" — chỉ áp dụng cho các form có nội 
   dung thực sự, không hiện dialog nếu input đang rỗng.

Test lại: click nhanh liên tục qua lại giữa các tab, xác nhận pill 
không bị giật/nhảy lệch vị trí; test trên viewport mobile, xác nhận 
hamburger menu hoạt động đúng.
```

---

## Prompt #5 — Categories Realtime & Validation

```
Cải thiện hooks/useCategories.ts và các component liên quan đến Task 
Categories, dùng chung React Query + Supabase Realtime.

YÊU CẦU CHỨC NĂNG:
1. CASCADE ON DELETE: khi xóa 1 category, mọi task thuộc category đó 
   tự động chuyển category_id = null (hiển thị "Chưa phân loại"). Xử 
   lý ở DB level bằng ON DELETE SET NULL trong migration Supabase, 
   KHÔNG xử lý bằng code phía client (tránh race condition/inconsistent 
   state nếu xóa qua nhiều client cùng lúc).
2. REALTIME SYNC: dùng Supabase Realtime subscription cho bảng 
   categories và tasks, để badge danh mục trên mọi Todo Card tự cập 
   nhật ngay khi category bị đổi tên/xóa ở tab khác, không cần reload.
3. VALIDATE TRÙNG TÊN: khi tạo/sửa category, check tên đã tồn tại 
   chưa (so sánh case-insensitive, trim khoảng trắng) TRƯỚC khi gửi 
   request lên server, hiển thị lỗi inline ngay dưới input, không để 
   user submit rồi mới báo lỗi từ server.
4. OPTIMISTIC UPDATE + ROLLBACK: khi tạo/sửa/xóa category, cập nhật UI 
   ngay lập tức (optimistic), nếu request thất bại (mất mạng, lỗi 
   server) thì tự động rollback lại UI về trạng thái trước đó + hiện 
   toast báo lỗi rõ ràng (dùng React Query's onError + context rollback 
   pattern).
5. COLOR CONTRAST CHECK: khi user chọn màu cho badge category (color 
   picker), tự động tính độ tương phản (WCAG contrast ratio) giữa màu 
   nền đã chọn và màu chữ (trắng/đen), nếu tương phản dưới 4.5:1 thì 
   tự động chọn màu chữ phù hợp hơn (trắng hoặc đen) thay vì để user tự 
   chọn sai làm chữ khó đọc.

Test lại: xóa 1 category đang có task gắn với nó, xác nhận task chuyển 
"Chưa phân loại" ngay lập tức không cần reload; thử tạo category trùng 
tên (khác hoa/thường), xác nhận bị chặn với thông báo rõ ràng trước 
khi gửi request.
```

---

## Prompt #6 — Avatar Upload & Compression

```
Cải thiện app/dashboard/settings/account/page.tsx (phần đổi avatar), 
xử lý toàn bộ pipeline từ chọn ảnh đến lưu Supabase Storage.

YÊU CẦU CHỨC NĂNG (theo đúng thứ tự pipeline):
1. VALIDATE TRƯỚC: 
   - Chỉ chấp nhận file type image/jpeg, image/png, image/webp (check 
     bằng file.type VÀ magic bytes đầu file, không chỉ tin đuôi file, 
     để tránh file giả mạo đuôi ảnh).
   - Giới hạn dung lượng file gốc tối đa 10MB, báo lỗi ngay nếu vượt 
     quá, KHÔNG cố xử lý file quá nặng gây treo trình duyệt.

2. CROP THỦ CÔNG (bổ sung mới so với plan cũ):
   - Sau khi chọn ảnh, mở modal crop đơn giản dùng react-easy-crop 
     hoặc react-image-crop, cho phép user kéo/zoom để chọn vùng vuông 
     1:1 trước khi nén, tránh bị cắt mất mặt nếu ảnh gốc không vuông.
   - Preview vùng crop dạng tròn (khớp với UI avatar tròn hiện tại 
     của app).

3. NÉN PHÍA CLIENT (client-side canvas compression):
   - Sau khi crop, dùng Canvas API để resize về 400x400px, xuất dạng 
     WebP (fallback JPEG nếu trình duyệt không hỗ trợ WebP), điều 
     chỉnh quality để dung lượng cuối < 50KB (dùng vòng lặp giảm dần 
     quality nếu cần, tối đa vài lần thử).
   - Hiển thị preview kết quả nén tức thì (< 0.1s) trước khi upload.

4. UPLOAD & DỌN DẸP:
   - Upload file đã nén lên Supabase Storage với tên file có hash/
     timestamp để tránh cache cũ (VD: avatar-{userId}-{timestamp}.webp).
   - QUAN TRỌNG: sau khi upload thành công, XÓA file avatar cũ trên 
     Storage (nếu có) để tránh rò rỉ dung lượng (orphaned files) — 
     lưu lại storage path cũ trước khi ghi đè để biết cần xóa gì.
   - Cập nhật avatar_url trong bảng users/profiles chỉ SAU KHI upload 
     thành công (tránh trường hợp DB trỏ tới file chưa tồn tại).

5. XỬ LÝ LỖI & RETRY:
   - Nếu upload thất bại giữa chừng (mất mạng), hiển thị lỗi rõ ràng 
     kèm nút "Thử lại" dùng lại chính file đã nén sẵn trong memory 
     (không bắt user chọn/crop/nén lại từ đầu).
   - Loading state rõ ràng cho từng bước: "Đang nén ảnh..." → "Đang 
     tải lên..." → "Hoàn tất".

Test lại: upload ảnh 8MB kích thước 4000x3000px không vuông, xác nhận 
crop tool cho chọn đúng vùng mong muốn, ảnh cuối cùng đúng 400x400 và 
dưới 50KB; ngắt mạng giữa lúc upload, xác nhận nút Thử lại dùng lại 
file đã nén mà không bắt làm lại từ đầu.
```

---

## Ghi chú cho người triển khai

- **Thứ tự khuyến nghị:** #0 → #1 → #2 → #3 → #4 → #5 → #6 (search/calendar/notification ưu tiên cao vì nằm ở header, ảnh hưởng cảm nhận đầu tiên).
- Sau mỗi prompt, nên yêu cầu agent chạy `npm run build` hoặc `tsc --noEmit` để bắt lỗi type trước khi chuyển sang prompt tiếp theo.
- Nếu agent trả lời quá dài dòng hoặc lệch hướng, có thể bổ sung câu: *"Chỉ sửa các file liên quan trực tiếp đến yêu cầu này, không refactor các phần khác."*