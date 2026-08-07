'use client';

import { useMemo, useDeferredValue, useState, Suspense } from 'react';
import { useTodos, useReorderTodos } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useRealtimeTodos } from '@/hooks/useRealtimeTodos';
import { useBulkSelect } from '@/hooks/useBulkSelect';
import { useSearchParams } from 'next/navigation';
import { SortableTodoItem } from '@/components/todo/SortableTodoItem';
import { TodoItem } from '@/components/todo/TodoItem';
import { CategoryFilterBar } from '@/components/todo/CategoryFilterBar';
import { BulkActionBar } from '@/components/todo/BulkActionBar';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { EmptyState } from '@/components/ui/state/EmptyState';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { SearchAutocomplete } from '@/components/widget/SearchAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckSquare,
  Tag as TagIcon,
} from 'lucide-react';

function TodoListContent() {
  const searchParams = useSearchParams();

  // Read URL query parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const statusFilter = (searchParams.get('status') || 'all') as 'all' | 'active' | 'completed';
  const priorityFilter = (searchParams.get('priority') || 'all') as 'all' | 'low' | 'medium' | 'high';
  const categoryParam = searchParams.get('category');

  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showBulkMode, setShowBulkMode] = useState<boolean>(false);

  const deferredSearch = useDeferredValue(search);

  useRealtimeTodos();

  const pageSize = 100;
  const { data, isLoading, isError, error, refetch } = useTodos(page, pageSize);
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const reorderMutation = useReorderTodos();

  const { selectedIds, toggleSelect, selectAll, clearSelection, isSelected } = useBulkSelect();

  const todoList = data?.todos || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const activeCategoryFilter = useMemo(() => {
    if (categoryParam === 'uncategorized') return 'uncategorized';
    if (categoryParam && categories.some((c) => c.id === categoryParam)) return categoryParam;
    return null;
  }, [categoryParam, categories]);

  // Client-side filtering
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

      let matchesTag = true;
      if (tagFilter !== 'all') {
        matchesTag = item.tags ? item.tags.some((t) => t.id === tagFilter) : false;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTag;
    });
  }, [todoList, deferredSearch, statusFilter, priorityFilter, activeCategoryFilter, tagFilter]);

  const activeCount = useMemo(() => todoList.filter((t) => !t.is_completed).length, [todoList]);
  const completedCount = useMemo(() => todoList.filter((t) => t.is_completed).length, [todoList]);

  // Sensors for DnD kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = filteredTodos.findIndex((t) => t.id === active.id);
      const newIndex = filteredTodos.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(filteredTodos, oldIndex, newIndex);
      reorderMutation.mutate(newOrder.map((t) => t.id));
    }
  };

  return (
    <div className="space-y-4 min-h-[420px]">
      {/* Category Filter Pills Bar */}
      <CategoryFilterBar />

      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchAutocomplete />
        </div>

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

          {/* Tag Select Filter */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="bg-white/60 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả thẻ</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          {/* Toggle Multi-Select Mode */}
          <button
            type="button"
            onClick={() => {
              setShowBulkMode(!showBulkMode);
              if (showBulkMode) clearSelection();
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 cursor-pointer ${
              showBulkMode
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>{showBulkMode ? 'Tắt chọn hàng loạt' : 'Chọn hàng loạt'}</span>
          </button>
        </div>
      </div>

      {/* Task List Rendering with DnD Context */}
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
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
                    <SortableTodoItem
                      item={item}
                      isSelected={isSelected(item.id)}
                      onToggleSelect={toggleSelect}
                      showBulkSelect={showBulkMode}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        )}
      </motion.div>

      {/* Bulk Action Floating Bar */}
      <BulkActionBar selectedIds={selectedIds} onClearSelection={clearSelection} />

      {/* Pagination Bar */}
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
