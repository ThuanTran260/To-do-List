'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateTodo, type TodoItemData } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { uploadTaskImage, deleteTaskImage } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { CustomPrioritySelect, type PriorityType } from '@/components/ui/CustomPrioritySelect';
import { CustomCategorySelect } from '@/components/ui/CustomCategorySelect';
import { RecurrencePicker } from '@/components/todo/RecurrencePicker';
import { Loader2, Check, Calendar, Clock } from 'lucide-react';

interface EditTodoModalProps {
  todo: TodoItemData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTodoModal({ todo, isOpen, onClose }: EditTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeImageRequested, setRemoveImageRequested] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const updateMutation = useUpdateTodo();
  const { data: categories = [] } = useCategories();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDescription(todo.description || '');
      setPriority(todo.priority || 'medium');
      setCategoryId(todo.category_id || '');
      setRecurrenceRule(todo.recurrence_rule || null);
      setImageUrl(todo.image_url || null);
      setSelectedFile(null);
      setRemoveImageRequested(false);
      setDueDate(todo.due_date || '');
      setErrorMsg('');
    }
  }, [todo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todo) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Tiêu đề không được để trống');
      return;
    }

    setIsSubmitting(true);

    try {
      let newImageUrl = imageUrl;

      // 1. User selected a new image file -> Upload & Cleanup old image
      if (selectedFile && user) {
        if (todo.image_url) {
          await deleteTaskImage(todo.image_url);
        }
        newImageUrl = await uploadTaskImage(selectedFile, user.id, (s) => setStatusText(s));
      } else if (removeImageRequested && todo.image_url) {
        // 2. User explicitly removed existing image -> Cleanup old image
        await deleteTaskImage(todo.image_url);
        newImageUrl = null;
      }

      setStatusText('Đang lưu...');

      updateMutation.mutate(
        {
          id: todo.id,
          update: {
            title: cleanTitle,
            description: description.trim() || undefined,
            priority,
            category_id: categoryId || undefined,
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
            recurrence_rule: recurrenceRule,
            image_url: newImageUrl || undefined,
            is_vital: priority === 'high',
          },
        },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (err) => {
            setErrorMsg((err as Error).message || 'Không thể cập nhật todo');
          },
          onSettled: () => {
            setIsSubmitting(false);
            setStatusText('');
          },
        }
      );
    } catch (err) {
      setErrorMsg((err as Error).message || 'Lỗi lưu dữ liệu');
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  const formattedDueDateDisplay = dueDate
    ? new Date(dueDate).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Chọn hạn';

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa công việc">
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <p className="text-xs text-danger font-medium p-2 rounded-md bg-danger/10 border border-danger/20">
              {errorMsg}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">
              Tiêu đề <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-2 p-2.5 rounded-md border border-hairline text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-ink-muted">
                Độ ưu tiên
              </label>
              <CustomPrioritySelect
                value={priority}
                onChange={(val) => setPriority(val)}
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink-muted">
                Hạn hoàn thành
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full bg-surface-2 p-2.5 rounded-md border border-hairline text-xs font-medium text-ink hover:border-hairline-strong focus:outline-none flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{formattedDueDateDisplay}</span>
                </div>
                <Clock className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-ink-muted text-xs">
                Danh mục
              </label>
              <CustomCategorySelect
                categories={categories}
                value={categoryId}
                onChange={(id) => setCategoryId(id)}
              />
            </div>

            <RecurrencePicker
              value={recurrenceRule}
              onChange={setRecurrenceRule}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-muted">
              Mô tả công việc
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-surface-2 p-2.5 rounded-md border border-hairline text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-normal resize-y"
            />
          </div>

          <ImageUpload
            value={removeImageRequested ? null : imageUrl}
            onChangeFile={(file) => {
              setSelectedFile(file);
              setRemoveImageRequested(false);
            }}
            onRemoveExistingImage={() => {
              setImageUrl(null);
              setSelectedFile(null);
              setRemoveImageRequested(true);
            }}
            isUploading={isSubmitting}
            statusText={statusText}
          />

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 z-10 pt-3 pb-1 -mx-5 -mb-5 px-5 bg-surface-1/95 backdrop-blur-md border-t border-hairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md text-xs font-medium text-ink-muted hover:bg-surface-2 hover:text-ink cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusText || 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate || null}
        onApply={(iso) => setDueDate(iso || '')}
      />
    </>
  );
}
