'use client';

import { useState } from 'react';
import { useTodos, useCreateTodo } from '@/hooks/useTodos';
import { exportToCSV, exportToJSON } from '@/lib/export';
import { parseCSVImport, parseJSONImport, ImportedTask } from '@/lib/import';
import { MotionPage } from '@/components/ui/MotionPage';
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
    <MotionPage className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-500/20">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Xuất & Nhập Dữ Liệu
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sao lưu dữ liệu công việc hoặc chuyển dịch từ các ứng dụng Todo khác
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="p-6 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Xuất Dữ Liệu (Export)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tải xuống toàn bộ <strong>{todos.length}</strong> công việc của bạn thành file CSV hoặc JSON để lưu trữ an toàn.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                exportToCSV(todos);
                toast.success('Đã xuất file CSV thành công!');
              }}
              disabled={todos.length === 0}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>Xuất File Bảng Tính (.CSV)</span>
            </button>

            <button
              onClick={() => {
                exportToJSON(todos);
                toast.success('Đã xuất file JSON thành công!');
              }}
              disabled={todos.length === 0}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/80 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileCode className="w-4 h-4 text-violet-500" />
              <span>Xuất File Cấu Trúc (.JSON)</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="p-6 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-indigo-500" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Nhập Dữ Liệu (Import)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Chọn file .CSV hoặc .JSON chứa danh sách công việc để thêm tự động vào hệ thống Flow State.
          </p>

          <label className="block w-full p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-800/40 text-center cursor-pointer transition-all">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Upload className="w-6 h-6 mx-auto text-indigo-500 mb-2" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {fileName ? fileName : 'Bấm để chọn file CSV hoặc JSON'}
            </span>
          </label>
        </div>
      </div>

      {/* Preview Section */}
      {previewTasks.length > 0 && (
        <div className="p-6 rounded-3xl glass-panel bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                Tìm thấy {previewTasks.length} công việc hợp lệ
              </h4>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={isImporting}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Nhập tất cả ({previewTasks.length})</span>
                </>
              )}
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {previewTasks.slice(0, 20).map((t, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
                  {t.title}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-bold uppercase text-[10px]">
                  {t.priority || 'medium'}
                </span>
              </div>
            ))}
            {previewTasks.length > 20 && (
              <p className="text-center text-xs text-slate-400 italic">
                ...và {previewTasks.length - 20} công việc khác
              </p>
            )}
          </div>
        </div>
      )}

      {/* Errors Section */}
      {importErrors.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4" />
            <span>Có {importErrors.length} cảnh báo/lỗi khi đọc file:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 pl-2">
            {importErrors.slice(0, 5).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </MotionPage>
  );
}
