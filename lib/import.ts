import { z } from 'zod';

export interface ImportedTask {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  is_completed?: boolean;
  is_vital?: boolean;
  due_date?: string | null;
}

const importedTaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  is_completed: z.boolean().optional().default(false),
  is_vital: z.boolean().optional().default(false),
  due_date: z.string().nullable().optional(),
});

/**
 * Parses JSON file content and validates tasks.
 */
export function parseJSONImport(jsonContent: string): { validTasks: ImportedTask[]; errors: string[] } {
  const errors: string[] = [];
  const validTasks: ImportedTask[] = [];

  try {
    const data = JSON.parse(jsonContent);
    const rawList = Array.isArray(data) ? data : data.todos;

    if (!Array.isArray(rawList)) {
      return { validTasks: [], errors: ['File JSON không đúng cấu trúc (thiếu danh sách todos)'] };
    }

    rawList.forEach((item, idx) => {
      const res = importedTaskSchema.safeParse(item);
      if (res.success) {
        validTasks.push(res.data);
      } else {
        errors.push(`Dòng ${idx + 1}: ${res.error.issues[0].message}`);
      }
    });
  } catch (err) {
    errors.push(`Lỗi đọc file JSON: ${(err as Error).message}`);
  }

  return { validTasks, errors };
}

/**
 * Parses CSV file content and validates tasks.
 */
export function parseCSVImport(csvContent: string): { validTasks: ImportedTask[]; errors: string[] } {
  const errors: string[] = [];
  const validTasks: ImportedTask[] = [];

  try {
    // Remove UTF-8 BOM if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      return { validTasks: [], errors: ['File CSV trống hoặc chỉ chứa tiêu đề'] };
    }

    // Skip header line
    const dataLines = lines.slice(1);

    dataLines.forEach((line, idx) => {
      // Split CSV line taking quotes into account
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim());

      if (cols.length === 0 || !cols[0]) return;

      // Extract fields: title is expected at index 0 or 1 depending on whether id exists
      const hasId = cols.length > 2 && cols[0].length > 20; // Heuristic for UUID
      const titleIndex = hasId ? 1 : 0;
      const descIndex = hasId ? 2 : 1;
      const priorityIndex = hasId ? 3 : 2;
      const completedIndex = hasId ? 4 : 3;

      const title = cols[titleIndex] || cols[0];
      const description = cols[descIndex] || '';
      const priorityRaw = cols[priorityIndex]?.toLowerCase();
      const priority = ['low', 'medium', 'high'].includes(priorityRaw)
        ? (priorityRaw as 'low' | 'medium' | 'high')
        : 'medium';
      const is_completed = cols[completedIndex] === 'true' || cols[completedIndex] === '1';

      if (!title || title.trim().length === 0) {
        errors.push(`Dòng ${idx + 2}: Tiêu đề trống`);
        return;
      }

      validTasks.push({
        title: title.trim(),
        description: description.trim(),
        priority,
        is_completed,
      });
    });
  } catch (err) {
    errors.push(`Lỗi đọc file CSV: ${(err as Error).message}`);
  }

  return { validTasks, errors };
}
