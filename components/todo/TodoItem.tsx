'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToggleTodo, useDeleteTodo, type TodoItemData } from '@/hooks/useTodos';
import { useCategories, getReadableTextColor } from '@/hooks/useCategories';
import { PriorityBadge } from '@/components/ui/Badge';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { ChecklistProgress } from '@/components/todo/ChecklistProgress';
import { TagBadges } from '@/components/todo/TagBadges';
import { getRRuleDescription } from '@/lib/recurrence';
import { Check, Edit3, Trash2, Calendar, Clock, Eye, Repeat, Timer } from 'lucide-react';
import { toast } from 'sonner';

interface TodoItemProps {
  item: TodoItemData;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showBulkSelect?: boolean;
}

function TodoItemContent({ item, isSelected = false, onToggleSelect, showBulkSelect = false }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const toggleMutation = useToggleTodo();
  const deleteMutation = useDeleteTodo();
  const { data: categories = [] } = useCategories();

  const itemCategory = item.category_id
    ? categories.find((c) => c.id === item.category_id)
    : null;

  const handleOpenDetail = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set('task', item.id);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleSelectCategoryFilter = (e: React.MouseEvent, catId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const params = new URLSearchParams(window.location.search);
    params.set('category', catId);
    params.delete('page');

    const newUrl = `?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleDeleteWithUndo = () => {
    setIsPendingDelete(true);
    let isCancelled = false;

    toast(`Đã xóa "${item.title}"`, {
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          isCancelled = true;
          setIsPendingDelete(false);
          toast.success(`Đã khôi phục "${item.title}"`);
        },
      },
      onAutoClose: () => {
        if (!isCancelled) {
          deleteMutation.mutate(item.id);
        }
      },
      duration: 5000,
    });
  };

  if (isPendingDelete) return null;

  // Due date formatting
  let isOverdue = false;
  let formattedDueDate = '';
  if (item.due_date) {
    const due = new Date(item.due_date);
    isOverdue = due < new Date() && !item.is_completed;
    formattedDueDate = due.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const categoryTextColor = itemCategory ? getReadableTextColor(itemCategory.color) : '#ffffff';

  return (
    <>
      <div
        className={`group relative p-4 rounded-2xl border backdrop-blur-md transition-all duration-200 hover:shadow-xl ${
          item.is_completed
            ? 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/40 opacity-75'
            : isOverdue
            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40'
            : 'glass-panel bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-700'
        } ${isSelected ? 'ring-2 ring-indigo-500 border-indigo-500' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Multi-select checkbox */}
          {showBulkSelect && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          )}

          {/* Left Column: Checkbox & Content */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() =>
                toggleMutation.mutate({
                  id: item.id,
                  is_completed: !item.is_completed,
                  currentTodo: item,
                })
              }
              disabled={toggleMutation.isPending}
              className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
                item.is_completed
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-800'
              }`}
              title={item.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            >
              {item.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            </button>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  onClick={handleOpenDetail}
                  className={`font-bold text-sm sm:text-base cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors break-words ${
                    item.is_completed
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {item.title}
                </span>

                <PriorityBadge priority={item.priority} />

                {itemCategory && (
                  <button
                    type="button"
                    onClick={(e) => handleSelectCategoryFilter(e, itemCategory.id)}
                    style={{ backgroundColor: itemCategory.color, color: categoryTextColor }}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1.5 shadow-2xs border border-white/20 transition-transform active:scale-95 cursor-pointer"
                  >
                    <span>📁</span>
                    <span>{itemCategory.name}</span>
                  </button>
                )}

                {item.tags && item.tags.length > 0 && (
                  <TagBadges tags={item.tags} />
                )}

                {item.recurrence_rule && (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>{getRRuleDescription(item.recurrence_rule)}</span>
                  </span>
                )}

                {item.pomodoro_count && item.pomodoro_count > 0 ? (
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-[10px] font-semibold flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>🍅 {item.pomodoro_count}</span>
                  </span>
                ) : null}
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium">
                  {item.description}
                </p>
              )}

              {/* Meta information & Action Links */}
              <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 flex-wrap pt-0.5">
                {item.due_date && (
                  <div
                    className={`flex items-center gap-1 font-semibold text-[11px] ${
                      isOverdue
                        ? 'text-rose-600 dark:text-rose-400 font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isOverdue ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                    <span>{isOverdue ? `Quá hạn: ${formattedDueDate}` : formattedDueDate}</span>
                  </div>
                )}

                <ChecklistProgress items={item.checklist || []} />

                <button
                  type="button"
                  onClick={handleOpenDetail}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem chi tiết</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Thumbnail Image */}
          {item.image_url && (
            <div
              onClick={handleOpenDetail}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 flex-shrink-0 cursor-pointer group-hover:shadow-md transition-all relative"
            >
              {/* eslint-disable-next-html-link */}
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteWithUndo}
              disabled={deleteMutation.isPending}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Xóa công việc"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <EditTodoModal todo={item} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </>
  );
}

export function TodoItem(props: TodoItemProps) {
  return (
    <Suspense fallback={null}>
      <TodoItemContent {...props} />
    </Suspense>
  );
}
