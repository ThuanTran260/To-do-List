Đây là plan tham vọng nhất trong loạt bạn đưa ra, và có nhiều điểm hay (spring physics, URL sync, liquid glass) — nhưng cũng chứa vài lỗi kiến trúc nghiêm trọng mà nếu code thẳng theo plan này, sẽ gây ra bug khó debug sau này chứ không chỉ là thiếu polish. Mình tách theo mức độ nghiêm trọng.

🔴 Lỗi nghiêm trọng — sẽ gây bug thực sự nếu code đúng như plan

1. layoutId="activePill" dùng chung cho cả Sidebar và CategoryFilterBar — đây là bug, không phải feature

Plan viết layoutId="activePill" cho Sidebar, nhưng CategoryFilterBar cũng cần active indicator dạng pill tương tự. Nếu 2 component khác nhau này vô tình dùng cùng 1 chuỗi layoutId, Framer Motion sẽ hiểu đây là 1 phần tử duy nhất và cố "morph" pill từ vị trí Sidebar sang vị trí CategoryFilterBar khi cả 2 cùng render trên màn hình — tạo ra hiệu ứng giật/bay lung tung hoàn toàn không mong muốn.

→ Bắt buộc đặt tên layoutId riêng biệt theo namespace: sidebar-active-pill và category-filter-active-pill, đồng thời bọc mỗi nhóm trong <LayoutGroup id="..."> riêng để cô lập animation.

2. Spring config trong plan này (stiffness: 450, damping: 35) khác với config đã chốt trước đó (stiffness: 300, damping: 25)

Ở bước nền tảng (Prompt #0) bạn đã yêu cầu tạo lib/motion.ts dùng chung để mọi popover/panel nhất quán 1 loại easing. Plan này lại tự định nghĩa số mới ngay trong mô tả tính năng — nếu agent code theo đúng plan, Sidebar sẽ "nảy" khác hẳn với Search/Calendar/Notification đã làm trước đó, phá vỡ chính nguyên tắc "Apple-consistent motion" mà bạn đang theo đuổi.

→ Phải sửa lại: dùng chung popoverMotion/pillMotion từ lib/motion.ts, không hard-code số mới trong từng component.

3. "Instant Visual Feedback 0ms Latency" — chưa xử lý trường hợp navigation thất bại

Plan yêu cầu highlight pill ngay khi click, trước khi route transition hoàn tất. Đây là optimistic UI — nhưng plan không nói điều gì xảy ra nếu navigation lỗi (mất mạng, route lỗi 404, hoặc user click quá nhanh nhiều tab liên tiếp). Nếu không có cơ chế đồng bộ lại, pill sẽ "nói dối" — hiển thị tab A đang active trong khi thực tế trang vẫn ở tab B.

→ Cần định nghĩa: pill state phải bind vào usePathname() (nguồn sự thật duy nhất — URL thực tế), không phải vào click event. Optimistic chỉ nên là animation timing sớm hơn, không phải state độc lập với URL.

4. Next.js App Router không tự động unmount/remount khi chuyển route — PageTransition.tsx sẽ không hoạt động như mong đợi nếu code ngây thơ

Đây là gotcha kỹ thuật quan trọng nhất bị bỏ sót: với App Router (khác Pages Router cũ), nếu chỉ bọc <motion.div initial=... animate=...> quanh children mà không có key theo pathname, animation sẽ không retrigger khi chuyển trang, vì React không coi đó là component mới. Cần:

<AnimatePresence mode="wait">
  <motion.div key={pathname} initial={...} animate={...} exit={...}>
    {children}
  </motion.div>
</AnimatePresence>

và đặt trong template.tsx (không phải layout.tsx) ở App Router, vì template.tsx mới đảm bảo remount mỗi lần chuyển route — layout.tsx thì không. Plan hoàn toàn không nhắc đến chi tiết này, dễ khiến agent code ra 1 component "trông đúng" nhưng chạy thực tế không có hiệu ứng gì.

🔴 Lỗi nghiêm trọng — chưa giải quyết quyết định kiến trúc còn treo từ trước

5. ?task=<id> để mở TaskDetailView drawer — đây chính là câu hỏi mình đã hỏi bạn ở lượt trước và chưa được trả lời

Ở plan Task Detail View trước, mình đã nêu rõ cần chốt: TaskDetailView là route riêng hay modal/drawer overlay. Plan lần này ngầm giả định là drawer điều khiển bằng query param ?task=<id>, nhưng lại áp dụng đồng thời với ?category=<id> trên cùng 1 URL (TodoList.tsx) — tức là URL cuối cùng có thể là /dashboard/tasks?category=abc&task=xyz.

Plan không hề định nghĩa 2 query param này phối hợp với nhau ra sao:

Đóng drawer (task param) có xóa mất category param đang lọc không?
Nếu chưa xử lý đúng bằng URLSearchParams (chỉ set/xóa từng key riêng thay vì overwrite toàn bộ query string), rất dễ xảy ra bug: đóng detail view xong thì filter category cũng bị mất theo.
🟠 Lỗi nghiêm trọng về bảo mật & tính toàn vẹn dữ liệu

6. Không validate quyền sở hữu category id từ query param

?category=<id> lấy trực tiếp từ URL — nếu không kiểm tra category đó có thuộc về user hiện tại hay không trước khi query, dù RLS ở Supabase có chặn ở tầng data, nhưng UI vẫn nên xử lý gracefully khi id không hợp lệ/không tồn tại (dẫn đến trang trắng hoặc lỗi crash thay vì tự động fallback về "All Tasks").

7. Bulk Actions ("Clear All Trash", "Restore All") thiếu 2 điều bắt buộc:

Không có confirm dialog cho "Clear All Trash" — đây là hành động xóa vĩnh viễn, không thể hoàn tác, còn nguy hiểm hơn cả xóa 1 category (mà plan trước đã yêu cầu confirm). Thiếu confirm ở đây là một bước lùi so với chuẩn UX bạn tự đặt ra trước đó.
Không xử lý file đính kèm mồ côi: nếu task trong Trash có image_url (từ tính năng Image Upload đã làm ở plan trước), "Clear All Trash" xóa task nhưng không xóa ảnh trên Supabase Storage → lặp lại đúng lỗi orphaned files đã cảnh báo 2 lần trước đó trong conversation này.
Về mặt kỹ thuật, bulk action nên chạy qua 1 query duy nhất (DELETE WHERE user_id = ... AND deleted_at IS NOT NULL) thay vì loop từng item gọi API riêng lẻ — plan không nói rõ cách implement, dễ dẫn đến agent code theo kiểu loop chậm và có thể fail giữa chừng để lại trạng thái nửa vời.
🟡 Thiếu sót đáng chú ý khác
CategoryFilterBar horizontal scroll + layoutId indicator: đây là tổ hợp nổi tiếng hay bị bug trong Framer Motion — pill indicator có thể "bay" ra ngoài vùng nhìn thấy khi list đang cuộn ngang, vì animation tính toán theo tọa độ tuyệt đối chứ không theo vùng scroll. Cần test kỹ hoặc dùng layout="position" thay vì mặc định.
Realtime consistency chưa được nhắc: nếu category đang được filter (?category=abc) mà category đó bị xóa ở tab khác (đã có Realtime từ plan trước) — trang hiện tại cần tự fallback về "All Tasks", nhưng plan này không đề cập.
Notification click chưa nói có đánh dấu "đã đọc" hay không — không nhất quán với NotificationPopover đã làm ở plan trước.
Accessibility cho CategoryFilterBar: pill bar dạng scroll ngang cần role="tablist"/role="tab" và điều hướng bằng phím mũi tên trái/phải — hoàn toàn chưa được nhắc, trong khi Search Autocomplete trước đó đã yêu cầu chuẩn WAI-ARIA nghiêm ngặt.
📐 Verification Plan — thiếu các case quan trọng nhất
Case còn thiếu	Vì sao nghiêm trọng
Hard refresh trực tiếp vào URL ?task=<id>&category=<id>	Xác nhận app không chỉ hoạt động đúng khi client-navigate, mà cả khi load thẳng từ URL
Đóng drawer task nhưng vẫn giữ filter category	Test đúng lỗi #5 đã nêu ở trên
Click "Clear All Trash" 2 lần liên tiếp nhanh	Test race condition/double-submit
Category đang filter bị xóa ở tab khác trong lúc đang xem	Test đồng bộ Realtime + fallback UI
Kiểm tra Storage sau khi "Clear All Trash" với task có ảnh	Xác nhận không còn orphaned file

Tóm lại 3 điều bắt buộc phải chốt trước khi đưa cho agent code:

layoutId phải namespace riêng theo từng nhóm pill, không dùng chung 1 tên.
Spring config phải tái sử dụng từ lib/motion.ts, không định nghĩa số mới.
Cách 2 query param (category, task) cùng tồn tại và không ghi đè lẫn nhau khi update URL.