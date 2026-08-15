'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTodos, useDeleteTodo, useToggleTodo, useUpdateTodo } from '@/hooks/useTodos';
import { deleteTaskImage } from '@/lib/storage';
import { PriorityBadge } from '@/components/ui/Badge';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { ChecklistEditor } from '@/components/todo/ChecklistEditor';
import { TagBadges } from '@/components/todo/TagBadges';
import { TagPicker } from '@/components/ui/TagPicker';
import { RecurrencePicker } from '@/components/todo/RecurrencePicker';
import { getRRuleDescription } from '@/lib/recurrence';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion, overlayMotion } from '@/lib/motion';
import { ArrowLeft, Edit3, Trash2, Calendar, Clock, Check, AlertCircle, Repeat, Sparkles } from 'lucide-react';

function TaskDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTaskId = searchParams.get('task');

  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, refetch } = useTodos(1, 100);
  const deleteMutation = useDeleteTodo();
  const toggleMutation = useToggleTodo();
  const updateMutation = useUpdateTodo();

  const currentTask = data?.todos.find((t) => t.id === activeTaskId);

  const handleClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('task');
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleDelete = async () => {
    if (!currentTask) return;
    if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn công việc "${currentTask.title}"?`)) {
      if (currentTask.image_url) {
        await deleteTaskImage(currentTask.image_url);
      }
      deleteMutation.mutate(currentTask.id, {
        onSuccess: () => {
          handleClose();
        },
      });
    }
  };

  const handleToggleVital = () => {
    if (!currentTask) return;
    updateMutation.mutate({
      id: currentTask.id,
      update: {
        is_vital: !currentTask.is_vital,
        priority: !currentTask.is_vital ? 'high' : 'medium',
      },
    });
  };

  const handleTagsChange = (tagIds: string[]) => {
    if (!currentTask) return;
    updateMutation.mutate({
      id: currentTask.id,
      update: {},
      tag_ids: tagIds,
    });
  };

  const handleRecurrenceChange = (rule: string | null) => {
    if (!currentTask) return;
    updateMutation.mutate({
      id: currentTask.id,
      update: { recurrence_rule: rule },
    });
  };

  // Due date formatting
  let isOverdue = false;
  let formattedDueDate = '';
  let formattedCreatedDate = '';
  if (currentTask?.due_date) {
    const due = new Date(currentTask.due_date);
    isOverdue = due < new Date() && !currentTask.is_completed;
    formattedDueDate = due.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  if (currentTask?.created_at) {
    formattedCreatedDate = new Date(currentTask.created_at).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const tagIds = currentTask?.tags ? currentTask.tags.map((t) => t.id) : [];

  return (
    <>
      <AnimatePresence>
        {activeTaskId && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayMotion}
              onClick={handleClose}
              className="fixed inset-0 bg-overlay backdrop-blur-xs z-[9000] cursor-pointer"
            />

            {/* Slide-Over Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={springPillMotion}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-surface-1 border-l border-hairline shadow-2xl z-[9500] overflow-y-auto p-4 sm:p-6 space-y-6"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-hairline">
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 text-ink text-xs font-medium transition-colors active:scale-98 cursor-pointer border border-hairline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleVital}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 border cursor-pointer ${
                      currentTask?.is_vital
                        ? 'bg-danger/10 text-danger border-danger/30'
                        : 'bg-surface-2 border-hairline text-ink-muted hover:text-ink'
                    }`}
                    title="Đánh dấu Vital Task"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentTask?.is_vital ? 'Vital Task ⭐' : 'Ghim Vital'}</span>
                  </button>
                </div>
              </div>

              {/* Loading / Error States */}
              {isLoading ? (
                <div className="space-y-4 py-6">
                  <LoadingSkeleton variant="card" count={1} />
                  <LoadingSkeleton variant="text" count={4} />
                </div>
              ) : isError ? (
                <ErrorState
                  message="Không thể tải chi tiết công việc. Có lỗi khi kết nối dữ liệu."
                  onRetry={refetch}
                />
              ) : !currentTask ? (
                <div className="py-16 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-warning opacity-80 mx-auto" />
                  <h3 className="text-base font-semibold text-ink">
                    Công việc không tồn tại
                  </h3>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-md bg-primary text-on-primary font-medium text-xs shadow-xs"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              ) : (
                /* Main Task Content */
                <div className="space-y-6">
                  {/* Hero Layout */}
                  <div className="flex flex-col md:flex-row items-stretch gap-5">
                    {currentTask.image_url ? (
                      <div className="w-full md:w-1/2 aspect-video md:aspect-square rounded-xl overflow-hidden border border-hairline bg-surface-2 flex-shrink-0">
                        {/* eslint-disable-next-html-link */}
                        <img
                          src={currentTask.image_url}
                          alt={currentTask.title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-1/2 aspect-video md:aspect-square rounded-xl border border-dashed border-hairline bg-surface-2/50 flex flex-col items-center justify-center text-ink-subtle gap-2 flex-shrink-0">
                        <Sparkles className="w-6 h-6 opacity-40 text-primary" />
                        <span className="text-xs font-normal">Không có ảnh đính kèm</span>
                      </div>
                    )}

                    {/* Metadata Panel Right */}
                    <div className="w-full md:w-1/2 space-y-3.5 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <h1 className="text-lg sm:text-xl font-semibold text-ink leading-snug break-words">
                          {currentTask.title}
                        </h1>

                        {/* Tag badges */}
                        {currentTask.tags && currentTask.tags.length > 0 && (
                          <TagBadges tags={currentTask.tags} />
                        )}

                        <div className="space-y-1.5 text-xs font-medium text-ink-muted">
                          <div className="flex items-center gap-2">
                            <span className="text-ink-subtle font-normal">Priority:</span>
                            <PriorityBadge priority={currentTask.priority} />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-ink-subtle font-normal">Status:</span>
                            {currentTask.is_completed ? (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-success/10 text-success font-medium border border-success/20">
                                Done
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-warning/10 text-warning font-medium border border-warning/20">
                                In Progress
                              </span>
                            )}
                          </div>

                          {currentTask.recurrence_rule && (
                            <div className="flex items-center gap-1.5 text-primary text-xs">
                              <Repeat className="w-3.5 h-3.5" />
                              <span>{getRRuleDescription(currentTask.recurrence_rule)}</span>
                            </div>
                          )}

                          {formattedCreatedDate && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-ink-subtle font-normal">Created:</span>
                              <span className="text-ink">{formattedCreatedDate}</span>
                            </div>
                          )}

                          {formattedDueDate && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-ink-subtle font-normal">Deadline:</span>
                              <div
                                className={`flex items-center gap-1 font-medium ${
                                  isOverdue ? 'text-danger font-semibold' : 'text-ink'
                                }`}
                              >
                                {isOverdue ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                                <span>{formattedDueDate}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Controls row for Tags & Recurrence */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <TagPicker selectedTagIds={tagIds} onChange={handleTagsChange} />
                        <RecurrencePicker value={currentTask.recurrence_rule || null} onChange={handleRecurrenceChange} />
                      </div>

                      {/* Mark Complete Action Button */}
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: currentTask.id,
                            is_completed: !currentTask.is_completed,
                            currentTodo: currentTask,
                          })
                        }
                        className={`w-full py-2 px-3.5 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          currentTask.is_completed
                            ? 'bg-surface-2 text-ink hover:bg-surface-3 border border-hairline'
                            : 'bg-primary hover:bg-primary-hover text-on-primary shadow-xs'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{currentTask.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu Hoàn thành'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Task Description Body */}
                  <div className="pt-4 border-t border-hairline space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                      Mô tả chi tiết (Description)
                    </h3>

                    {currentTask.description ? (
                      <div className="p-4 rounded-lg bg-surface-2 border border-hairline text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line font-normal">
                        {currentTask.description}
                      </div>
                    ) : (
                      <p className="text-xs text-ink-subtle italic">Không có mô tả chi tiết cho công việc này.</p>
                    )}
                  </div>

                  {/* Checklist & Subtasks Section */}
                  <div className="pt-4 border-t border-hairline">
                    <ChecklistEditor
                      items={(currentTask as any).checklist || []}
                      onChange={(newItems) => {
                        updateMutation.mutate({
                          id: currentTask.id,
                          update: {
                            checklist: newItems as any,
                          },
                        });
                      }}
                    />
                  </div>

                  {/* Bottom Action Bar */}
                  <div className="pt-4 border-t border-hairline flex items-center justify-end gap-2">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-2 rounded-md bg-surface-2 hover:bg-surface-3 text-primary text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer border border-hairline"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="px-3.5 py-2 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa công việc</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {currentTask && (
        <EditTodoModal
          todo={currentTask}
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
        />
      )}
    </>
  );
}

export function TaskDetailView() {
  return (
    <Suspense fallback={null}>
      <TaskDetailContent />
    </Suspense>
  );
}
