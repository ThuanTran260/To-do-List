import { describe, it, expect } from 'vitest';
import { getNextTheme } from '@/lib/themeUtils';
import { removeAccents, filterSearchTodos } from '@/lib/searchFilter';
import type { TodoItemData } from '@/types/todo';

describe('themeUtils.getNextTheme', () => {
  it('cycles light -> dark', () => {
    expect(getNextTheme('light')).toBe('dark');
  });

  it('cycles dark -> system', () => {
    expect(getNextTheme('dark')).toBe('system');
  });

  it('cycles system -> light', () => {
    expect(getNextTheme('system')).toBe('light');
  });

  it('defaults to light when unknown string is passed', () => {
    expect(getNextTheme('unknown')).toBe('light');
  });
});

describe('searchFilter helpers', () => {
  it('removes Vietnamese accents accurately', () => {
    expect(removeAccents('Ôn Luyện IELTS Viết')).toBe('on luyen ielts viet');
    expect(removeAccents('Hà Nội 10/9')).toBe('ha noi 10/9');
  });

  it('filters todos diacritic-insensitively and respects limit', () => {
    const mockTodos: Partial<TodoItemData>[] = [
      { id: '1', title: 'Học từ vựng', description: 'IELTS vocabulary' },
      { id: '2', title: 'Lam bai tap', description: 'Bai tap toan' },
      { id: '3', title: 'Đi siêu thị', description: 'Mua hoa quả' },
    ];

    const results = filterSearchTodos(mockTodos as TodoItemData[], 'hoc tu', 8);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('1');

    const descResults = filterSearchTodos(mockTodos as TodoItemData[], 'hoa qua', 8);
    expect(descResults).toHaveLength(1);
    expect(descResults[0].id).toBe('3');

    const emptyResults = filterSearchTodos(mockTodos as TodoItemData[], '   ', 8);
    expect(emptyResults).toHaveLength(0);
  });
});
