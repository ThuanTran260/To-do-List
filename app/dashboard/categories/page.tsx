'use client';

import { useState } from 'react';
import { useCategories, useCreateCategory, useDeleteCategory, getReadableTextColor } from '@/hooks/useCategories';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { FolderKanban, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CategoriesPage() {
  const { data: categories = [], isLoading, isError, error, refetch } = useCategories();
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!newCatName.trim()) {
      setErrorMsg('Vui lòng nhập tên danh mục');
      return;
    }

    createMutation.mutate(
      { name: newCatName, color: newCatColor },
      {
        onSuccess: () => {
          setNewCatName('');
          setNewCatColor('#6366f1');
        },
        onError: (err) => {
          setErrorMsg((err as Error).message);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <FolderKanban className="w-6 h-6 text-indigo-500" />
          <span>Task Categories (Danh mục công việc DB Realtime)</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Quản lý và sắp xếp các danh mục công việc với dữ liệu Supabase Database kết nối Realtime.
        </p>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddCategory}
        className="p-5 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xl"
      >
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Tạo danh mục mới
        </h3>

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Tên danh mục (ví dụ: Marketing, Học tập, UI/UX...)"
            className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Màu sắc:</span>
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-9 h-9 rounded-xl cursor-pointer border-0 p-0 shadow-sm"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 stroke-[3]" />
              )}
              <span>Thêm danh mục</span>
            </button>
          </div>
        </div>
      </form>

      {/* Category Grid */}
      {isLoading ? (
        <LoadingSkeleton variant="card" count={3} />
      ) : isError ? (
        <ErrorState message="Không thể tải danh sách danh mục" onRetry={refetch} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Chưa có danh mục nào"
          description="Hãy tạo danh mục đầu tiên phía trên để phân loại công việc tốt hơn."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const textColor = getReadableTextColor(cat.color);
            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-md transition-all hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full shadow-sm flex items-center justify-center font-bold text-[10px]"
                    style={{ backgroundColor: cat.color, color: textColor }}
                  >
                    ●
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-medium">Realtime Category</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(cat.id)}
                  disabled={deleteMutation.isPending}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                  title="Xóa danh mục"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
