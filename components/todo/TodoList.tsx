'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTodos } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useRealtimeTodos } from '@/hooks/useRealtimeTodos';
import { TodoItem } from '@/components/todo/TodoItem';
import { CategoryFilterBar } from '@/components/todo/CategoryFilterBar';
import { Search, Filter, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

function TodoListContent() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');

  // Realtime subscription
  useRealtimeTodos();

  const { data, isLoading, isError, error } = useTodos(page);
  const { data: categories = [] } = useCategories();

  const todoList = data?.todos || [];
  const total = data?.total || 0;
  const pageSize = data?.pageSize || 30;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Validate category ownership & existence (Graceful Fallback)
  let activeCategoryFilter: string | null = null;
  if (categoryParam === 'uncategorized') {
    activeCategoryFilter = 'uncategorized';
  } else if (categoryParam && categories.some((c) => c.id === categoryParam)) {
    activeCategoryFilter = categoryParam;
  }

  // Client-side filtering for search, status, priority, and category
  const filteredTodos = todoList.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? !item.is_completed
        : item.is_completed;

    const matchesPriority =
      priorityFilter === 'all' ? true : item.priority === priorityFilter;

    let matchesCategory = true;
    if (activeCategoryFilter === 'uncategorized') {
      matchesCategory = !item.category_id;
    } else if (activeCategoryFilter) {
      matchesCategory = item.category_id === activeCategoryFilter;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const activeCount = todoList.filter((t) => !t.is_completed).length;
  const completedCount = todoList.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-4">
      {/* Category Filter Pills Bar */}
      <CategoryFilterBar />

      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl glass-panel bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm công việc..."
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Đang làm ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Đã xong ({completedCount})
          </button>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl text-xs text-slate-700 dark:text-slate-300 border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
          >
            <option value="all">Tất cả ưu tiên</option>
            <option value="high">Cao (High)</option>
            <option value="medium">Trung bình (Medium)</option>
            <option value="low">Thấp (Low)</option>
          </select>
        </div>
      </div>

      {/* Todo List Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-20 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl glass-panel bg-rose-500/10 border border-rose-500/20 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
            Không thể tải danh sách todo: {(error as Error).message}
          </p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Không tìm thấy công việc nào
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' || activeCategoryFilter
              ? 'Thử thay đổi từ khóa hoặc bộ lọc danh mục của bạn.'
              : 'Hãy bắt đầu bằng cách thêm công việc mới ở trên!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((item) => (
            <TodoItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Trang {page} / {totalPages} (Tổng {total} công việc)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TodoList() {
  return (
    <Suspense fallback={null}>
      <TodoListContent />
    </Suspense>
  );
}
