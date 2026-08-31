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
 * L-08 fix: state-machine CSV line splitter — tôn trọng quotes (RFC 4180),
 * xử lý escaped double quotes ("") và dấu phẩy trong quoted fields.
 * Thay heuristic split(',') fragile + unused `matches` variable.
 */
function splitCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          // Escaped quote ""
          current += '"';
          i++; // skip next quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  cols.push(current.trim());
  return cols;
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

    // RFC 4180: quoted field có thể chứa newline — phải join các line nằm TRONG quotes
    // trước khi split. (exportToCSV của app escape " nhưng không escape \n trong description)
    const lines: string[] = [];
    let currentLine = '';
    let inQuotes = false;
    for (const rawLine of cleanContent.split(/\r?\n/)) {
      if (inQuotes) {
        currentLine += '\n' + rawLine;
      } else {
        currentLine = rawLine;
      }
      // Đếm quotes không-escaped để biết field còn mở không
      const quoteCount = (currentLine.match(/"/g) || []).length;
      inQuotes = quoteCount % 2 === 1;
      if (!inQuotes) {
        lines.push(currentLine);
        currentLine = '';
      }
    }
    if (currentLine) lines.push(currentLine);

    const nonEmptyLines = lines.filter((l) => l.trim().length > 0);

    if (nonEmptyLines.length <= 1) {
      return { validTasks: [], errors: ['File CSV trống hoặc chỉ chứa tiêu đề'] };
    }

    // Skip header line
    const dataLines = nonEmptyLines.slice(1);

    dataLines.forEach((line, idx) => {
      const cols = splitCSVLine(line);

      if (cols.length === 0 || !cols[0]) {
        errors.push(`Dòng ${idx + 2}: Tiêu đề trống`);
        return;
      }

      // Legacy export compatibility (Risk Mitigation): nếu header/cột đầu là UUID
      // (36 chars, chuẩn uuid) thì layout là id,title,description,priority,is_completed
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cols[0]);
      const titleIndex = looksLikeUuid ? 1 : 0;
      const descIndex = looksLikeUuid ? 2 : 1;
      const priorityIndex = looksLikeUuid ? 3 : 2;
      const completedIndex = looksLikeUuid ? 4 : 3;

      const title = cols[titleIndex] || '';
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
