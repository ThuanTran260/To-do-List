'use client';

import { useState } from 'react';
import { useTodos } from '@/hooks/useTodos';
import { useRealtimeTodos } from '@/hooks/useRealtimeTodos';
import { TodoItem } from '@/components/todo/TodoItem';
import { Search, Filter, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export function TodoList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  // Realtime subscription
  useRealtimeTodos();

  const { data, isLoading, isError, error } = useTodos(page);

  const todoList = data?.todos || [];
  const total = data?.total || 0;
  const pageSize = data?.pageSize || 30;
  const totalPages = Math.ceil(total / pageSize) || 1;

  // Client-side filtering for search, status, and priority
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

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const activeCount = todoList.filter((t) => !t.is_completed).length;
  const completedCount = todoList.filter((t) => t.is_completed).length;

  return (
    <div className="space-y-4">
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
            className="w-full bg-slate-100/80 dark:bg-slate-800/80 pl-9 pr-3 py-1.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Tất cả ({total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'active'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Đang làm ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
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
            className="bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value="all">Ưu tiên: Tất cả</option>
            <option value="high">Ưu tiên Cao</option>
            <option value="medium">Ưu tiên Trung bình</option>
            <option value="low">Ưu tiên Thấp</option>
          </select>
        </div>
      </div>

      {/* Main Todo List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-16 rounded-2xl bg-slate-200/60 dark:bg-slate-800/40 animate-pulse"
            />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 rounded-2xl glass-panel text-center space-y-2 text-rose-500">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="font-semibold text-sm">
            {(error as Error).message || 'Đã xảy ra lỗi khi tải danh sách todo'}
          </p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="py-16 text-center rounded-2xl glass-panel bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Không tìm thấy công việc nào khớp bộ lọc'
              : 'Chưa có công việc nào'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bớt các bộ lọc.'
              : 'Hãy bắt đầu tạo công việc đầu tiên của bạn bằng thanh nhập phía trên!'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTodos.map((item) => (
            <TodoItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 text-xs text-slate-500">
          <span>
            Trang {page} / {totalPages} (Tổng {total} công việc)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
