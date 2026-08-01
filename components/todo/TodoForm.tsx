'use client';

import { useState } from 'react';
import { useCreateTodo } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { Plus, Calendar, Flag, AlignLeft, Loader2, FolderKanban } from 'lucide-react';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [showExtra, setShowExtra] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const createMutation = useCreateTodo();
  const { data: categories = [] } = useCategories();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Vui lòng nhập tiêu đề todo');
      return;
    }
    if (cleanTitle.length > 500) {
      setErrorMsg('Tiêu đề không được vượt quá 500 ký tự');
      return;
    }

    createMutation.mutate(
      {
        title: cleanTitle,
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        category_id: categoryId || undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setDueDate('');
          setCategoryId('');
          setPriority('medium');
          setShowExtra(false);
        },
        onError: (err) => {
          setErrorMsg((err as Error).message || 'Không thể tạo todo');
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 sm:p-5 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all space-y-3"
    >
      {/* Main Input Row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Thêm việc cần làm mới..."
          className="flex-1 bg-transparent px-3 py-2 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-medium"
        />

        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className={`p-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1 border ${
            showExtra || description || dueDate || categoryId
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-200/60 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
          title="Tùy chọn chi tiết"
        >
          <AlignLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Chi tiết</span>
        </button>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 stroke-[3]" />
          )}
          <span>Thêm</span>
        </button>
      </div>

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs text-rose-500 font-medium px-3">{errorMsg}</p>
      )}

      {/* Expandable Options Panel */}
      {showExtra && (
        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Priority Picker */}
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Độ ưu tiên:</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    priority === p
                      ? p === 'low'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : p === 'medium'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {p === 'low' ? 'Thấp' : p === 'medium' ? 'T.Bình' : 'Cao'}
                </button>
              ))}
            </div>
          </div>

          {/* Category Dropdown Picker */}
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Danh mục:</span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:outline-none flex-1"
            >
              <option value="">Chưa phân loại</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Hạn chót:</span>
            <input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs focus:outline-none"
            />
          </div>

          {/* Description Field */}
          <div className="sm:col-span-3 space-y-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Thêm ghi chú/mô tả chi tiết (tùy chọn)..."
              rows={2}
              className="w-full bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
    </form>
  );
}
