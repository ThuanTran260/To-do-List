import { TodoItemData } from '@/hooks/useTodos';

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

  const escapeCSV = (str: string | null | undefined) => {
    if (!str) return '""';
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const rows = todos.map((t) => [
    escapeCSV(t.id),
    escapeCSV(t.title),
    escapeCSV(t.description),
    escapeCSV(t.priority),
    escapeCSV(String(t.is_completed)),
    escapeCSV(String(t.is_vital || false)),
    escapeCSV(t.due_date),
    escapeCSV(t.created_at),
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
