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
  const [newCatColor, setNewCatColor] = useState('#5e6ad2');
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
          setNewCatColor('#5e6ad2');
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
    router.push(`/dashboard/tasks?category=${catId}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-primary" />
          <span>Task Categories (Danh mục công việc)</span>
        </h2>
        <p className="text-xs text-ink-subtle font-normal">
          Quản lý và sắp xếp các danh mục công việc với dữ liệu kết nối Realtime.
        </p>
      </div>

      {/* Add Category Form */}
      <form
        onSubmit={handleAddCategory}
        className="p-4 sm:p-5 rounded-xl surface-panel bg-surface-1 border border-hairline space-y-3.5 shadow-xs"
      >
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
          Tạo danh mục mới
        </h3>

        {errorMsg && (
          <p className="text-xs font-medium text-danger flex items-center gap-1">
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
            className="flex-1 bg-surface-2 px-3 py-2 rounded-md text-xs text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs font-normal text-ink-subtle">Màu:</span>
            <input
              type="color"
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
              className="w-8 h-8 rounded-md cursor-pointer border border-hairline p-0 bg-transparent"
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Tạo danh mục</span>
            </button>
          </div>
        </div>
      </form>

      {/* Categories Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-ink uppercase tracking-wider">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const textColor = getReadableTextColor(cat.color);
              const taskCount = getTaskCountForCategory(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => handleCategoryCardClick(cat.id)}
                  style={{ backgroundColor: cat.color, color: textColor }}
                  className="p-4 rounded-xl shadow-xs transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between group cursor-pointer relative border border-white/20"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <h4 className="font-semibold text-sm truncate">{cat.name}</h4>
                    <p className="text-xs font-normal opacity-85">
                      {taskCount} công việc
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.name);
                      }}
                      className="p-1.5 rounded-md bg-black/15 hover:bg-black/30 text-current transition-colors cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1.5 rounded-md bg-black/15 text-current group-hover:translate-x-0.5 transition-transform">
                      <ArrowRight className="w-3.5 h-3.5" />
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
