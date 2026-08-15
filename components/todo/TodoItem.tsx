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
        className={`group relative p-3.5 sm:p-4 rounded-lg border transition-colors card-hover ${
          item.is_completed
            ? 'bg-surface-2/60 border-hairline opacity-75'
            : isOverdue
            ? 'bg-danger/8 border-danger/30'
            : 'bg-surface-1 border-hairline hover:border-hairline-strong'
        } ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
      >
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Multi-select checkbox */}
          {showBulkSelect && onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(item.id)}
              className="mt-1 w-4 h-4 rounded border-hairline-strong bg-surface-2 text-primary focus:ring-primary cursor-pointer"
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
              className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                item.is_completed
                  ? 'bg-primary border-primary text-on-primary'
                  : 'border-hairline-strong hover:border-primary bg-surface-1'
              }`}
              title={item.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            >
              {item.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  onClick={handleOpenDetail}
                  className={`font-medium text-sm sm:text-base cursor-pointer hover:text-primary transition-colors break-words ${
                    item.is_completed
                      ? 'line-through text-ink-subtle'
                      : 'text-ink'
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
                    className="px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 shadow-2xs border border-white/20 transition-transform active:scale-98 cursor-pointer"
                  >
                    <span>📁</span>
                    <span>{itemCategory.name}</span>
                  </button>
                )}

                {item.tags && item.tags.length > 0 && (
                  <TagBadges tags={item.tags} />
                )}

                {item.recurrence_rule && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary-subtle text-primary border border-primary-border flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>{getRRuleDescription(item.recurrence_rule)}</span>
                  </span>
                )}

                {item.pomodoro_count && item.pomodoro_count > 0 ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-danger/10 text-danger border border-danger/20 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>🍅 {item.pomodoro_count}</span>
                  </span>
                ) : null}
              </div>

              {item.description && (
                <p className="text-xs text-ink-muted line-clamp-2 font-normal">
                  {item.description}
                </p>
              )}

              {/* Meta information & Action Links */}
              <div className="flex items-center gap-3 text-xs text-ink-subtle flex-wrap pt-0.5">
                {item.due_date && (
                  <div
                    className={`flex items-center gap-1 font-medium text-[11px] ${
                      isOverdue
                        ? 'text-danger font-semibold'
                        : 'text-ink-subtle'
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
                  className="text-[11px] font-medium text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer"
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
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-hairline bg-surface-2 flex-shrink-0 cursor-pointer hover:border-hairline-strong transition-colors relative"
            >
              {/* eslint-disable-next-html-link */}
              <img
                src={item.image_url}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md text-ink-subtle hover:text-primary hover:bg-surface-2 transition-colors cursor-pointer"
              title="Chỉnh sửa"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDeleteWithUndo}
              disabled={deleteMutation.isPending}
              className="p-1 rounded-md text-ink-subtle hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              title="Xóa công việc"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
