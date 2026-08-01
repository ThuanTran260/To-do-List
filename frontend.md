
```

---

## Ghi chú cho người triển khai

- **Thứ tự khuyến nghị:** #0 → #1 → #2 → #3 → #4 → #5 → #6 (search/calendar/notification ưu tiên cao vì nằm ở header, ảnh hưởng cảm nhận đầu tiên).
- Sau mỗi prompt, nên yêu cầu agent chạy `npm run build` hoặc `tsc --noEmit` để bắt lỗi type trước khi chuyển sang prompt tiếp theo.
- Nếu agent trả lời quá dài dòng hoặc lệch hướng, có thể bổ sung câu: *"Chỉ sửa các file liên quan trực tiếp đến yêu cầu này, không refactor các phần khác."*