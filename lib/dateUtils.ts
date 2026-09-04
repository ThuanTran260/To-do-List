/**
 * Date utilities for month-based task filtering in Flow State.
 */

export interface TaskDateItem {
  due_date?: string | null;
  created_at?: string;
}

/**
 * Returns a month key in format "YYYY-MM" (e.g. "2026-08") based on task due_date or created_at.
 */
export function getTaskMonthKey(task: TaskDateItem): string {
  const dateStr = task.due_date || task.created_at;
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'unknown';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Formats a month key "YYYY-MM" into user-friendly Vietnamese label "Tháng MM/YYYY".
 */
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'unknown') return 'Không rõ ngày';
  if (monthKey === 'latest') return 'Tháng gần nhất';
  if (monthKey === 'all') return 'Tất cả các tháng';
  const [year, month] = monthKey.split('-');
  if (!year || !month) return monthKey;
  return `Tháng ${month}/${year}`;
}

/**
 * Extracts a sorted list of unique months (descending, latest first) present in the task list.
 */
export function getAvailableMonths(tasks: TaskDateItem[]): string[] {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const set = new Set<string>();
  for (const t of tasks) {
    const key = getTaskMonthKey(t);
    if (key !== 'unknown') {
      set.add(key);
    }
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a));
}
