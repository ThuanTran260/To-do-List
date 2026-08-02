'use client';

import { useState } from 'react';
import { useCreateTodo } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { uploadTaskImage } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import {
  Plus,
  Calendar,
  AlertCircle,
  FolderKanban,
  Sparkles,
  AlignLeft,
  Loader2,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showExtra, setShowExtra] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Status for image uploading & saving
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const createMutation = useCreateTodo();
  const { data: categories = [] } = useCategories();

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setCategoryId('');
    setSelectedFile(null);
    setShowExtra(false);
    setErrorMsg('');
    setStatusText('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên công việc!');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl: string | null = null;

      // 1. Upload image if selected
      if (selectedFile && user) {
        setStatusText('Đang nén và tải ảnh đính kèm...');
        uploadedImageUrl = await uploadTaskImage(selectedFile, user.id, (s) => setStatusText(s));
      }

      // 2. Save task record into Supabase Database
      setStatusText('Đang lưu dữ liệu...');
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        category_id: categoryId || undefined,
        image_url: uploadedImageUrl || undefined,
      });

      resetForm();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra khi tạo công việc');
    } finally {
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
      <form
        onSubmit={handleSubmit}
        className="p-4 sm:p-6 rounded-3xl glass-panel bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl transition-all space-y-4"
      >
        {/* Title Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Add New Task (Tạo công việc mới)</span>
          </h3>

          {/* High-Contrast Expandable Toggle Button */}
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className={`text-xs font-bold transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-2xs ${
              showExtra || description || categoryId || selectedFile
                ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300'
                : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>{showExtra ? 'Thu gọn' : 'Chi tiết & Ảnh'}</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Title (Tiêu đề)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tên công việc (ví dụ: Submit Documents, Walk the dog...)"
              className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* Date & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Due Date (Hạn hoàn thành)
              </label>
              <button
                type="button"
                onClick={() => setIsDatePickerOpen(true)}
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 hover:border-indigo-500 focus:outline-none font-semibold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{formattedDueDateDisplay}</span>
                </div>
                <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Priority (Mức ưu tiên)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="low">Thấp (Low)</option>
                <option value="medium">Trung bình (Medium)</option>
                <option value="high">Cao (High)</option>
              </select>
            </div>
          </div>

          {/* Framer Motion Smooth Accordion Slide-Out Panel (0ms lag, zero stutter) */}
          <AnimatePresence initial={false}>
            {(showExtra || description || categoryId || selectedFile) && (
              <motion.div
                key="expandable-extra-panel"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={springPillMotion}
                className="overflow-hidden"
              >
                <div className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Category (Danh mục)
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                    >
                      <option value="">Chưa chọn danh mục</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          📁 {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Task Description (Mô tả chi tiết)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Start writing here... (Nội dung chi tiết, mục tiêu, yêu cầu công việc)"
                      rows={3}
                      className="w-full bg-slate-100/80 dark:bg-slate-800/80 p-3 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium resize-y"
                    />
                  </div>

                  <ImageUpload
                    onChangeFile={(file) => setSelectedFile(file)}
                    isUploading={isSubmitting}
                    statusText={statusText}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Done CTA Button */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting || createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Done (Tạo công việc)</span>
          </button>
        </div>
      </form>

      {/* Date Picker Modal Trigger */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate || null}
        onApply={(iso) => setDueDate(iso || '')}
      />
    </>
  );
}
