import { describe, it, expect } from 'vitest';
import { getTaskMonthKey, formatMonthLabel, getAvailableMonths } from '@/lib/dateUtils';

describe('dateUtils month filtering pure functions', () => {
  it('extracts month key from due_date or created_at correctly', () => {
    expect(getTaskMonthKey({ due_date: '2026-08-14T22:21:00Z', created_at: '2026-07-01T00:00:00Z' })).toBe('2026-08');
    expect(getTaskMonthKey({ due_date: null, created_at: '2026-07-15T12:00:00Z' })).toBe('2026-07');
    expect(getTaskMonthKey({ due_date: undefined, created_at: undefined })).toBe('unknown');
    expect(getTaskMonthKey({ due_date: 'invalid-date', created_at: 'invalid' })).toBe('unknown');
  });

  it('formats month labels in Vietnamese properly', () => {
    expect(formatMonthLabel('2026-08')).toBe('Tháng 08/2026');
    expect(formatMonthLabel('2025-12')).toBe('Tháng 12/2025');
    expect(formatMonthLabel('latest')).toBe('Tháng gần nhất');
    expect(formatMonthLabel('all')).toBe('Tất cả các tháng');
    expect(formatMonthLabel('unknown')).toBe('Không rõ ngày');
  });

  it('collects unique months sorted in descending order', () => {
    const tasks = [
      { due_date: '2026-06-10T00:00:00Z' },
      { due_date: '2026-08-14T00:00:00Z' },
      { due_date: '2026-07-20T00:00:00Z' },
      { due_date: '2026-08-01T00:00:00Z' },
      { due_date: null, created_at: '2026-05-15T00:00:00Z' },
    ];

    const months = getAvailableMonths(tasks);
    expect(months).toEqual(['2026-08', '2026-07', '2026-06', '2026-05']);
  });

  it('handles empty or null tasks array safely', () => {
    expect(getAvailableMonths([])).toEqual([]);
    expect(getAvailableMonths(null as unknown as [])).toEqual([]);
  });
});
