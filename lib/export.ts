import { TodoItemData } from '@/hooks/useTodos';

/**
 * E-M8: neutralize CSV formula injection — cell bắt đầu bằng = + - @ Tab CR
 * (sau trim left) được prefix single-quote BÊN TRONG quotes, Excel coi là text.
 */
export function escapeCSVCell(str: string | null | undefined): string {
  if (!str) return '""';
  const escaped = str.replace(/"/g, '""');
  const needsNeutralize = /^[\s]*[=+\-@\t\r]/.test(str);
  return needsNeutralize ? `"'${escaped}"` : `"${escaped}"`;
}

/**
 * Exports an array of todos to a downloadable CSV file.
 */
export function exportToCSV(todos: TodoItemData[], filename = 'flowstate-tasks.csv') {
  if (!todos || todos.length === 0) return;

  const headers = [
    'id',
    'title',
    'description',
    'priority',
    'is_completed',
    'is_vital',
    'due_date',
    'created_at',
  ];

  const rows = todos.map((t) => [
    escapeCSVCell(t.id),
    escapeCSVCell(t.title),
    escapeCSVCell(t.description),
    escapeCSVCell(t.priority),
    escapeCSVCell(String(t.is_completed)),
    escapeCSVCell(String(t.is_vital || false)),
    escapeCSVCell(t.due_date),
    escapeCSVCell(t.created_at),
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports an array of todos to a downloadable JSON file.
 */
export function exportToJSON(todos: TodoItemData[], filename = 'flowstate-tasks.json') {
  if (!todos || todos.length === 0) return;

  const exportData = {
    app: 'Flow State',
    version: '1.0',
    exported_at: new Date().toISOString(),
    total_tasks: todos.length,
    todos: todos.map((t) => ({
      title: t.title,
      description: t.description || '',
      priority: t.priority || 'medium',
      is_completed: t.is_completed || false,
      is_vital: t.is_vital || false,
      due_date: t.due_date || null,
      created_at: t.created_at,
    })),
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
