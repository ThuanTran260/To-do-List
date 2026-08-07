'use client';

import { useMemo, useDeferredValue, Suspense } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useRealtimeTodos } from '@/hooks/useRealtimeTodos';
import { useSearchParams } from 'next/navigation';
import { TodoItem } from '@/components/todo/TodoItem';
import { SortableTodoItem } from '@/components/todo/SortableTodoItem';
import { CategoryFilterBar } from '@/components/todo/CategoryFilterBar';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { SearchAutocomplete } from '@/components/widget/SearchAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

function TodoListContent() {
  const searchParams = useSearchParams();

  // Read URL query parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') || 'all') as 'all' | 'active' | 'completed';
  const priorityFilter = (searchParams.get('priority') || 'all') as 'all' | 'low' | 'medium' | 'high';
  const categoryParam = searchParams.get('category');

  // Deferred search query for smooth 60fps typing without rendering stutter
  const deferredSearch = useDeferredValue(search);

  // Subscribe to Supabase Realtime updates
  useRealtimeTodos();

  const pageSize = 100;
  const { data, isLoading, isError, error, refetch } = useTodos(page, pageSize);
  const { data: categories = [] } = useCategories();

  const todoList = data?.todos || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Validate category ownership & existence
  const activeCategoryFilter = useMemo(() => {
    if (categoryParam === 'uncategorized') return 'uncategorized';
    if (categoryParam && categories.some((c) => c.id === categoryParam)) return categoryParam;
    return null;
  }, [categoryParam, categories]);

  // Client-side memoized filtering for 60fps search and filters
  const filteredTodos = useMemo(() => {
    const searchLower = deferredSearch.toLowerCase();

    return todoList.filter((item) => {
      const matchesSearch =
        !deferredSearch ||
        item.title.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower));

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
  }, [todoList, deferredSearch, statusFilter, priorityFilter, activeCategoryFilter]);

  const activeCount = useMemo(() => todoList.filter((t) => !t.is_completed).length, [todoList]);
  const completedCount = useMemo(() => todoList.filter((t) => t.is_completed).length, [todoList]);

  return (
    <div className="space-y-4 min-h-[420px]">
      {/* Category Filter Pills Bar */}
      <CategoryFilterBar />

      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Autocomplete Bar */}
        <div className="flex-1 max-w-md">
          <SearchAutocomplete />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.delete('status');
              window.history.replaceState(null, '', `?${params.toString()}`);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('status', 'active');
              window.history.replaceState(null, '', `?${params.toString()}`);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Đang làm ({activeCount})
          </button>
          <button
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString());
              params.set('status', 'completed');
              window.history.replaceState(null, '', `?${params.toString()}`);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Đã xong ({completedCount})
          </button>

          {/* Priority Select Filter */}
          <div className="flex items-center gap-1 pl-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value === 'all') params.delete('priority');
                else params.set('priority', e.target.value);
                window.history.replaceState(null, '', `?${params.toString()}`);
              }}
              className="bg-white/60 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Tất cả ưu tiên</option>
              <option value="high">Cao (High)</option>
              <option value="medium">Trung bình (Medium)</option>
              <option value="low">Thấp (Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List Rendering with Framer Motion Smooth Height Expansion */}
      <motion.div layout transition={springPillMotion}>
        {isLoading ? (
          <div className="space-y-3">
            <LoadingSkeleton variant="card" count={3} />
          </div>
        ) : isError ? (
          <ErrorState message={(error as Error).message} onRetry={refetch} />
        ) : filteredTodos.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={search ? 'Không tìm thấy công việc phù hợp' : 'Chưa có công việc nào'}
            description={
              search
                ? `Không tìm thấy kết quả nào với từ khóa "${search}". Thử từ khóa khác.`
                : 'Hãy bắt đầu tạo công việc mới ở form phía trên.'
            }
          />
        ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredTodos.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)' }}
                  transition={{
                    type: 'spring',
                    damping: 22,
                    stiffness: 300,
                    delay: Math.min(index * 0.03, 0.2),
                  }}
                >
                  <SortableTodoItem item={item} />
                </motion.div>
              ))}
            </AnimatePresence>
        )}
      </motion.div>

      {/* Pagination Bar (If needed) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-semibold text-slate-500">
          <span>
            Trang {page} / {totalPages} (Tổng {total} công việc)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page - 1));
                window.history.replaceState(null, '', `?${params.toString()}`);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set('page', String(page + 1));
                window.history.replaceState(null, '', `?${params.toString()}`);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TodoList() {
  return (
    <Suspense fallback={<LoadingSkeleton variant="card" count={3} />}>
      <TodoListContent />
    </Suspense>
  );
}
