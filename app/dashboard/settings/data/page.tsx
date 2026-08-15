'use client';

import { useState } from 'react';
import { useTodos, useCreateTodo } from '@/hooks/useTodos';
import { exportToCSV, exportToJSON } from '@/lib/export';
import { parseCSVImport, parseJSONImport, ImportedTask } from '@/lib/import';
import { toast } from 'sonner';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Database,
  Loader2,
} from 'lucide-react';

export default function DataSettingsPage() {
  const { data } = useTodos(1, 500);
  const createTodoMutation = useCreateTodo();
  const todos = data?.todos || [];

  const [previewTasks, setPreviewTasks] = useState<ImportedTask[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setPreviewTasks([]);
    setImportErrors([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      if (file.name.endsWith('.json')) {
        const { validTasks, errors } = parseJSONImport(content);
        setPreviewTasks(validTasks);
        setImportErrors(errors);
      } else if (file.name.endsWith('.csv')) {
        const { validTasks, errors } = parseCSVImport(content);
        setPreviewTasks(validTasks);
        setImportErrors(errors);
      } else {
        toast.error('Định dạng file không hỗ trợ! Vui lòng chọn file .csv hoặc .json');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (previewTasks.length === 0) return;

    setIsImporting(true);
    let successCount = 0;

    for (const task of previewTasks) {
      try {
        await createTodoMutation.mutateAsync({
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'medium',
          is_vital: task.is_vital || false,
          due_date: task.due_date || undefined,
        });
        successCount++;
      } catch {
        // Continue with remaining tasks
      }
    }

    setIsImporting(false);
    toast.success(`Đã nhập thành công ${successCount}/${previewTasks.length} công việc!`);
    setPreviewTasks([]);
    setFileName('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg bg-primary-subtle text-primary border border-primary-border">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-ink">
            Xuất & Nhập Dữ Liệu
          </h2>
          <p className="text-xs text-ink-subtle font-normal">
            Sao lưu dữ liệu công việc hoặc chuyển dịch từ các ứng dụng Todo khác
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Export Section */}
        <div className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-ink">
              Xuất Dữ Liệu (Export)
            </h3>
          </div>
          <p className="text-xs text-ink-subtle leading-relaxed font-normal">
            Tải xuống toàn bộ <strong>{todos.length}</strong> công việc của bạn thành file CSV hoặc JSON để lưu trữ an toàn.
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => {
                exportToCSV(todos);
                toast.success('Đã xuất file CSV thành công!');
              }}
              disabled={todos.length === 0}
              className="w-full py-2.5 px-3.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink border border-hairline font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-success" />
              <span>Xuất File Bảng Tính (.CSV)</span>
            </button>

            <button
              onClick={() => {
                exportToJSON(todos);
                toast.success('Đã xuất file JSON thành công!');
              }}
              disabled={todos.length === 0}
              className="w-full py-2.5 px-3.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink border border-hairline font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileCode className="w-4 h-4 text-primary" />
              <span>Xuất File Cấu Trúc (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-ink">
              Nhập Dữ Liệu (Import)
            </h3>
          </div>
          <p className="text-xs text-ink-subtle leading-relaxed font-normal">
            Chọn file .CSV hoặc .JSON chứa danh sách công việc để thêm tự động vào hệ thống Flow State.
          </p>

          <label className="block w-full p-4 rounded-lg border border-dashed border-hairline hover:border-hairline-strong bg-surface-2 text-center cursor-pointer transition-colors">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-5 h-5 mx-auto text-primary mb-1.5" />
            <span className="text-xs font-medium text-ink">
              {fileName ? fileName : 'Bấm để chọn file CSV hoặc JSON'}
            </span>
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {previewTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <h4 className="font-semibold text-xs text-ink">
                Tìm thấy {previewTasks.length} công việc hợp lệ
              </h4>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="py-1.5 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Nhập tất cả ({previewTasks.length})</span>
              )}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
            {previewTasks.slice(0, 20).map((t, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-surface-2 border border-hairline flex items-center justify-between text-xs"
              >
                <span className="font-medium text-ink truncate max-w-md">
                  {t.title}
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-1 border border-hairline font-medium uppercase text-[10px] text-ink-muted">
                  {t.priority || 'medium'}
                </span>
              </div>
            ))}
            {previewTasks.length > 20 && (
              <p className="text-center text-xs text-ink-subtle italic">
                ...và {previewTasks.length - 20} công việc khác
              </p>
            )}
          </div>
        </div>
      )}

      {/* Errors Section */}
      {importErrors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-xs space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>Có {importErrors.length} cảnh báo/lỗi khi đọc file:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2 text-xs">
            {importErrors.slice(0, 5).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
