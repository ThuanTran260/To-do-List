Tạo component components/ui/DateRangePickerModal.tsx cho tính năng 
"Cập nhật hạn hoàn thành" trong todo list. Đây là modal chọn khoảng 
thời gian (date range) + giờ hết hạn, dùng chung popoverMotion, 
overlayMotion từ lib/motion.ts đã có trong dự án — KHÔNG tự định nghĩa 
animation config mới.

BỐI CẢNH: Modal này thay thế/nâng cấp UI hiện có (xem ảnh đính kèm), 
đang có bug: khi mở modal, lịch hiển thị sai tháng/năm so với giá trị 
đã chọn (VD: giá trị là "2 Aug 2026" nhưng lịch lại hiện "Jul/Aug 
2019"). Bug này BẮT BUỘC phải fix trong lần code này, không phải chỉ 
làm đẹp giao diện.

CẤU TRÚC COMPONENT:
1. Header: tiêu đề "Cập nhật hạn hoàn thành" + nút đóng (X).
2. Value display bar: hiển thị range đã chọn dạng "D MMM YYYY - D MMM 
   YYYY", format theo locale vi-VN, timezone Asia/Ho_Chi_Minh (dùng 
   dayjs + plugin timezone, nhất quán với CalendarPopover đã làm 
   trước đó).
3. Sidebar trái: danh sách preset (Hôm nay, Hôm qua, 7 ngày qua, 15 
   ngày qua, Tháng trước, Tùy chỉnh) — dùng role="radiogroup" + 
   role="radio" cho từng item, điều hướng được bằng phím Arrow Up/
   Down, Enter để chọn. Active preset có pill background dùng 
   layoutId="date-preset-pill" (đặt trong LayoutGroup riêng, KHÔNG 
   trùng với layoutId="sidebar-active-pill" đã dùng ở Sidebar chính 
   của app — 2 component khác nhau, phải namespace riêng).
4. Calendar chính: hiển thị 2 tháng liên tiếp cạnh nhau (desktop) — 
   TÁI SỬ DỤNG sub-component <MonthGrid> đã dùng trong CalendarPopover 
   nếu có thể, để không viết logic lưới ngày 2 lần. Bug fix bắt buộc: 
   useEffect khi modal mount phải set viewMonth = tháng của startDate 
   đã chọn (hoặc tháng hiện tại nếu chưa có giá trị), KHÔNG hard-code 
   tháng/năm cố định.
5. Chuyển tháng: nút prev/next (< >) rõ ràng, XÓA bỏ hint "cuộn chuột 
   để đổi năm" (không accessible), thay bằng: click vào text năm 
   (VD: "2026") mở dropdown chọn nhanh năm khác.
6. Chọn range: click ngày đầu → click ngày cuối để chọn range (hoặc 
   drag). Ngày đã chọn (start/end) có background tím đậm + text 
   trắng. Các ngày ở giữa range có background tím nhạt nối liền, 
   animate xuất hiện dần khi range thay đổi (không bật tắt cứng).
7. Time picker: làm rõ đây là chọn GIỜ HẾT HẠN của ngày cuối cùng 
   trong range (không phải range giờ mơ hồ như ảnh gốc) — dùng 2 input 
   number riêng biệt (giờ 00-23, phút 00-59) có label rõ ràng, step 
   bằng phím mũi tên lên/xuống trong input.
8. Footer: nút "Reset" (xóa lựa chọn, không đóng modal) và nút "Áp 
   dụng" (Apply) — Apply chỉ enable khi đã có ít nhất 1 ngày được chọn.

YÊU CẦU KỸ THUẬT:
9. Modal mount/unmount dùng popoverMotion + overlayMotion từ 
   lib/motion.ts, click outside overlay để đóng (dùng useDropdownManager 
   đã có), phím Esc để đóng.
10. Responsive: dưới 768px chỉ hiện 1 tháng, thêm swipe gesture 
    (dùng Framer Motion drag hoặc thư viện swipe) để chuyển tháng, 
    sidebar preset chuyển thành horizontal scroll pill bar phía trên 
    thay vì cột dọc bên trái.
11. Khi bấm "Áp dụng": gọi update task deadline theo pattern optimistic 
    update + rollback đã dùng ở Categories trước đó (cập nhật UI ngay, 
    rollback nếu request lỗi + toast báo lỗi).
12. Kiểm tra contrast: label ngày trong tuần (S M T W T F S) phải đạt 
    tối thiểu WCAG AA 4.5:1 trên nền tối hiện tại của app.

Test lại: mở modal với task đã có deadline "2 Aug 2026", xác nhận lịch 
tự động hiển thị đúng tháng 8/2026 và ngày 2 được highlight sẵn — đây 
là test bắt buộc để xác nhận bug ban đầu đã được fix.