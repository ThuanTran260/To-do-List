import type { TodoItemData } from '@/types/todo';

/**
 * Loại bỏ dấu tiếng Việt để phục vụ tìm kiếm không phân biệt dấu
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Lọc danh sách công việc theo từ khóa tìm kiếm (so khớp tiêu đề hoặc mô tả không dấu)
 */
export function filterSearchTodos(
  todos: TodoItemData[],
  query: string,
  limit = 8
): TodoItemData[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const q = removeAccents(trimmed);
  return todos
    .filter((t) => {
      const titleMatch = removeAccents(t.title).includes(q);
      const descMatch = t.description ? removeAccents(t.description).includes(q) : false;
      return titleMatch || descMatch;
    })
    .slice(0, limit);
}
