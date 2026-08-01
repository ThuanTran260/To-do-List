'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories, useCreateCategory, useDeleteCategory, getReadableTextColor } from '@/hooks/useCategories';
import { useTodos } from '@/hooks/useTodos';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { FolderKanban, Plus, Trash2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

export default function CategoriesPage() {
  const router = useRouter();
  const { data: categories = [], isLoading, isError, error, refetch } = useCategories();
  const { data: todosData } = useTodos(1, 100);
  const createMutation = useCreateCategory();
  const deleteMutation = useDeleteCategory();

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#6366f1');
  const [errorMsg, setErrorMsg] = useState('');

  const todos = todosData?.todos || [];

  const getTaskCountForCategory = (catId: string) => {
    return todos.filter((t) => t.category_id === catId).length;
  };

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

  const handleDeleteCategory = (catId: string, catName: string) => {
    const taskCount = getTaskCountForCategory(catId);
    const warningMsg =
      taskCount > 0
        ? `⚠️ Danh mục "${catName}" đang chứa ${taskCount} công việc.\n\nBạn có chắc muốn xóa? Các công việc này sẽ chuyển về trạng thái "Chưa phân loại".`
        : `Xóa danh mục "${catName}"?`;

    if (confirm(warningMsg)) {
      deleteMutation.mutate(catId);
    }
  };

  const handleCategoryCardClick = (catId: string) => {
    router.push(`/dashboard/tasks?category=${catId}`);
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
            className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
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
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Tạo danh mục</span>
            </button>
          </div>
        </div>
      </form>

      {/* Categories Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Danh sách danh mục hiện có ({categories.length})
        </h3>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : isError ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="Chưa có danh mục nào"
            description="Tạo danh mục mới ở trên để bắt đầu phân loại công việc."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const textColor = getReadableTextColor(cat.color);
              const taskCount = getTaskCountForCategory(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryCardClick(cat.id)}
                  style={{ backgroundColor: cat.color, color: textColor }}
                  className="p-5 rounded-2xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-between group cursor-pointer relative"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <h4 className="font-extrabold text-base truncate">{cat.name}</h4>
                    <p className="text-xs font-medium opacity-85">
                      {taskCount} công việc
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.name);
                      }}
                      className="p-2 rounded-xl bg-black/10 hover:bg-black/20 text-current transition-colors"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 rounded-xl bg-black/10 text-current group-hover:translate-x-1 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
