'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useUpdateTodo, type TodoItemData } from '@/hooks/useTodos';
import { useAuth } from '@/hooks/useAuth';
import { uploadTaskImage, deleteTaskImage } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { Loader2, Check, Calendar, Clock } from 'lucide-react';

interface EditTodoModalProps {
  todo: TodoItemData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTodoModal({ todo, isOpen, onClose }: EditTodoModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeImageRequested, setRemoveImageRequested] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const updateMutation = useUpdateTodo();

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '');
      setDescription(todo.description || '');
      setPriority(todo.priority || 'medium');
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
            due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
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
            <p className="text-xs text-rose-500 font-semibold p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              {errorMsg}
            </p>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tiêu đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="high">High (Extreme)</option>
                <option value="medium">Medium (Moderate)</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Hạn hoàn thành
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 hover:border-indigo-500 focus:outline-none flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{formattedDueDateDisplay}</span>
                </div>
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Mô tả công việc
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusText || 'Đang lưu...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
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
