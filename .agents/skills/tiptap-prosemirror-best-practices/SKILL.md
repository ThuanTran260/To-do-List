---
name: tiptap-prosemirror-best-practices
description: >-
  Best practices and architectural standards for integrating TipTap, ProseMirror,
  Tailwind Typography, and Supabase autosave in Flow State. Use whenever creating,
  modifying, or debugging rich text editors, task lists, and real-time autosave.
---

# TipTap & ProseMirror Best Practices Runbook

Cẩm nang quy chuẩn kỹ thuật và xử lý sự cố chuyên sâu cho trình soạn thảo TipTap (ProseMirror), tích hợp Tailwind CSS Typography (`.prose`), và hệ thống lưu tự động (Autosave Engine) với Supabase.

---

## 1. 🛡️ Quy Chuẩn Tích Hợp Tailwind Typography (`not-prose` Isolation)

### Vấn đề:
Lớp `.prose` của Tailwind áp dụng các style con như `margin-top: 1.25em` trên thẻ `<p>` và `display: list-item` trên thẻ `<li>`. Khi TipTap render cấu trúc lồng nhau (như `TaskList`, `TaskItem`, `CodeBlock`), các style này phá vỡ bố cục Flexbox và làm tách rời ô checkbox với con trỏ văn bản.

### Giải pháp bắt buộc:
1. **Gán `not-prose` qua `HTMLAttributes`:**
   ```tsx
   import TaskList from '@tiptap/extension-task-list';
   import TaskItem from '@tiptap/extension-task-item';

   const editor = useEditor({
     extensions: [
       TaskList.configure({
         HTMLAttributes: {
           class: 'not-prose task-list space-y-1 my-2 p-0 list-none',
         },
       }),
       TaskItem.configure({
         nested: true,
         HTMLAttributes: {
           class: 'flex flex-row items-start gap-2.5 my-1 list-none',
         },
       }),
     ],
   });
   ```

2. **Công Thức Geometric Line-Height Equality (`24px` = `1.5rem`):**
   - Cả container ô checkbox (`<label>`) và container văn bản (`<p>`) phải có cùng chiều cao dòng và `margin: 0`:
   ```css
   ul.task-list li > label {
     display: flex !important;
     align-items: center !important;
     justify-content: center !important;
     flex: 0 0 1.25rem !important;
     width: 1.25rem !important;
     height: 1.5rem !important; /* 24px */
     line-height: 1.5rem !important;
   }

   ul.task-list li > div > p {
     margin: 0 !important;
     padding: 0 !important;
     line-height: 1.5rem !important; /* 24px */
     min-height: 1.5rem !important;
   }
   ```

---

## 2. ⚡ Kiến Trúc Luồng Dữ Liệu 1 Chiều (Unidirectional Autosave Engine)

```
┌────────────────────────────────────────────────────────┐
│             UNIDIRECTIONAL AUTOSAVE ENGINE             │
├────────────────────────────────────────────────────────┤
│                                                        │
│   Gõ phím / Thao tác TipTap                            │
│         │                                              │
│         ▼                                              │
│   onUpdate({ editor })                                 │
│         │                                              │
│         ▼                                              │
│   dataRef.current = { title, content, color }          │
│   setStatus('dirty')                                   │
│         │                                              │
│         ▼ (debounce 600ms)                             │
│   executeSave() ➔ Đọc trực tiếp từ dataRef.current     │
│         │                                              │
│         ▼                                              │
│   Supabase mutateAsync() ➔ status: 'saved'             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Quy tắc bất biến:
- **KHÔNG BAO GIỜ** dùng 2-way sync `useEffect` gọi `editor.commands.setContent(content)` khi người dùng đang soạn thảo trên cùng một ghi chú.
- Chỉ gọi `setContent` khi chuyển đổi sang ghi chú khác (`note.id` thay đổi).
- Dùng `dataRef.current` đệm dữ liệu thay vì phụ thuộc state closures trong `setTimeout`.

---

## 3. 🎯 Toolbar Focus Stealing Prevention

Mọi nút bấm trên thanh công cụ soạn thảo **bắt buộc phải có `onMouseDown={(e) => e.preventDefault()}`**:
```tsx
<button
  type="button"
  onMouseDown={(e) => e.preventDefault()}
  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
>
  <Heading1 className="w-4 h-4" />
</button>
```

---

## 4. 🗄️ Supabase REST Update Invariant (Anti-Pattern Lỗi 406)

- **Lỗi 406 Not Acceptable (PGRST116)** xảy ra khi PostgREST `.select().single()` tìm thấy 0 dòng do so sánh chuỗi timestamp `updated_at` bị lệch microsecond giữa JavaScript (`.toISOString()`) và PostgreSQL (`timestamptz`).
- **Chuẩn update:**
  ```ts
  const { data, error } = await supabase
    .from('notes')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  ```

---

## 5. 🔍 Bảng Tra Cứu Sự Cố Nhanh (Troubleshooting Matrix)

| Hiện Tượng | Nguyên Nhân Gốc Rễ | Cách Khắc Phục Ngay Lập Tức |
|---|---|---|
| Ô Checkbox bị rớt xuống dòng riêng bên trên con trỏ | `.prose` ép kiểu block và `margin-top` trên `<p>` | Thêm `not-prose` vào `TaskList.configure({ HTMLAttributes })` + đồng bộ `height: 1.5rem` trên `<label>` và `line-height: 1.5rem` trên `<p>`. |
| Lỗi `Maximum update depth exceeded` | `useEffect` 2 chiều gọi `editor.commands.setContent` liên tục | Xóa bỏ `useEffect` 2-way sync, chỉ gọi `setContent` khi `note.id` thay đổi. |
| Lỗi `406 Not Acceptable` khi lưu ghi chú | So sánh chuỗi `updated_at` trong URL REST | Bỏ `.eq('updated_at', ...)` trong `useUpdateNote()`. |
| Bấm nút H1/H2/List nhưng không có tác dụng | Mất focus (Focus Stealing) khi click chuột | Thêm `onMouseDown={(e) => e.preventDefault()}` vào thẻ `<button>`. |
