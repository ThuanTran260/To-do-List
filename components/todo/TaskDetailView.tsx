'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTodos, useDeleteTodo, useToggleTodo, useUpdateTodo } from '@/hooks/useTodos';
import { deleteTaskImage } from '@/lib/storage';
import { PriorityBadge } from '@/components/ui/Badge';
import { EditTodoModal } from '@/components/todo/EditTodoModal';
import { ChecklistEditor } from '@/components/todo/ChecklistEditor';
import { LoadingSkeleton } from '@/components/ui/state/LoadingSkeleton';
import { ErrorState } from '@/components/ui/state/ErrorState';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion, overlayMotion } from '@/lib/motion';
import { ArrowLeft, Edit3, Trash2, Sparkles, Calendar, Clock, Check, AlertCircle } from 'lucide-react';

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

  return (
    <>
      <AnimatePresence>
        {activeTaskId && (
          <>
            {/* Backdrop overlay with smooth Framer Motion fade-in / fade-out (z-[9000]) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={overlayMotion}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[9000] cursor-pointer"
            />

            {/* Slide-Over Drawer / Panel with 60fps Spring Motion (z-[9500]) */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={springPillMotion}
              className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white/95 dark:bg-slate-900/95 border-l border-slate-200/80 dark:border-slate-800 shadow-2xl z-[9500] overflow-y-auto p-4 sm:p-8 space-y-6 backdrop-blur-xl"
            >
              {/* Header Bar with Go Back */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-slate-800">
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Go Back</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleVital}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border cursor-pointer ${
                      currentTask?.is_vital
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/40 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                    title="Đánh dấu Vital Task"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentTask?.is_vital ? 'Vital Task ⭐' : 'Mark Vital'}</span>
                  </button>
                </div>
              </div>

              {/* Loading State */}
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
                  <AlertCircle className="w-12 h-12 text-amber-500 opacity-80 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Công việc không tồn tại
                  </h3>
                  <p className="text-xs text-slate-500">
                    Công việc này có thể đã bị xóa hoặc đường dẫn không chính xác.
                  </p>
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Quay lại danh sách
                  </button>
                </div>
              ) : (
                /* Main Task Content */
                <div className="space-y-6">
                  {/* Split Hero Layout: Image Left / Top, Metadata Right / Below */}
                  <div className="flex flex-col md:flex-row items-stretch gap-6">
                    {currentTask.image_url ? (
                      <div className="w-full md:w-1/2 aspect-video md:aspect-square rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950/5 shadow-md flex-shrink-0">
                        {/* eslint-disable-next-html-link */}
                        <img
                          src={currentTask.image_url}
                          alt={currentTask.title}
                          className="w-full h-full object-cover rounded-3xl"
                        />
                      </div>
                    ) : (
                      <div className="w-full md:w-1/2 aspect-video md:aspect-square rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-slate-400 gap-2 flex-shrink-0">
                        <Sparkles className="w-8 h-8 opacity-40" />
                        <span className="text-xs font-semibold">Không có ảnh đính kèm</span>
                      </div>
                    )}

                    {/* Metadata Panel Right */}
                    <div className="w-full md:w-1/2 space-y-4 flex flex-col justify-between">
                      <div className="space-y-3">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug break-words">
                          {currentTask.title}
                        </h1>

                        <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-normal">Priority:</span>
                            <PriorityBadge priority={currentTask.priority} />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 font-normal">Status:</span>
                            {currentTask.is_completed ? (
                              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                                Done
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold">
                                Not Started
                              </span>
                            )}
                          </div>

                          {formattedCreatedDate && (
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-normal">Created on:</span>
                              <span className="text-slate-800 dark:text-slate-200">{formattedCreatedDate}</span>
                            </div>
                          )}

                          {formattedDueDate && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-slate-400 font-normal">Deadline:</span>
                              <div
                                className={`flex items-center gap-1 font-bold ${
                                  isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {isOverdue ? <Clock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                <span>{formattedDueDate}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mark Complete Action Button */}
                      <button
                        onClick={() =>
                          toggleMutation.mutate({
                            id: currentTask.id,
                            is_completed: !currentTask.is_completed,
                          })
                        }
                        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          currentTask.is_completed
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/25'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{currentTask.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Mark as Done'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Task Description Body */}
                  <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                      Task Description & Detailed Notes
                    </h3>

                    {currentTask.description ? (
                      <div className="p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                        {currentTask.description}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Không có mô tả chi tiết cho công việc này.</p>
                    )}
                  </div>

                  {/* Checklist & Subtasks Section */}
                  <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800">
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

                  {/* Bottom Action Bar: Delete & Edit */}
                  <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Task</span>
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Task</span>
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
