'use client';

import { useState } from 'react';
import { useCreateTodo } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { uploadTaskImage } from '@/lib/storage';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Plus, Calendar, Flag, AlignLeft, Loader2, FolderKanban, Sparkles, Check } from 'lucide-react';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [showExtra, setShowExtra] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { user } = useAuth();
  const createMutation = useCreateTodo();
  const { data: categories = [] } = useCategories();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMsg('Vui lòng nhập tiêu đề todo');
      return;
    }
    if (cleanTitle.length > 500) {
      setErrorMsg('Tiêu đề không được vượt quá 500 ký tự');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedImageUrl: string | undefined = undefined;

      // Deferred Image Upload upon clicking "Done" / submit
      if (selectedFile && user) {
        uploadedImageUrl = await uploadTaskImage(selectedFile, user.id, (status) => {
          setStatusText(status);
        });
      }

      setStatusText('Đang tạo todo...');

      createMutation.mutate(
        {
          title: cleanTitle,
          description: description.trim() || undefined,
          priority,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          category_id: categoryId || undefined,
          image_url: uploadedImageUrl,
          is_vital: priority === 'high',
        },
        {
          onSuccess: () => {
            setTitle('');
            setDescription('');
            setDueDate('');
            setCategoryId('');
            setPriority('medium');
            setSelectedFile(null);
            setShowExtra(false);
          },
          onError: (err) => {
            setErrorMsg((err as Error).message || 'Không thể tạo todo');
          },
          onSettled: () => {
            setIsSubmitting(false);
            setStatusText('');
          },
        }
      );
    } catch (err) {
      setErrorMsg((err as Error).message || 'Lỗi xử lý tải ảnh');
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  return (
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
        <button
          type="button"
          onClick={() => setShowExtra(!showExtra)}
          className={`text-xs font-bold transition-all px-2.5 py-1 rounded-xl flex items-center gap-1 border ${
            showExtra || description || dueDate || categoryId || selectedFile
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
              : 'border-slate-200/60 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span>{showExtra ? 'Thu gọn' : 'Chi tiết & Ảnh'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          {errorMsg}
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
              Date (Hạn hoàn thành)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 pl-9 pr-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Priority (Ưu tiên)
            </label>
            <div className="flex items-center gap-1.5 pt-0.5">
              {[
                { key: 'high', label: 'Extreme', color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
                { key: 'medium', label: 'Moderate', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
                { key: 'low', label: 'Low', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key as any)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                    priority === p.key
                      ? `${p.color} ring-2 ring-indigo-500/40 shadow-sm scale-105`
                      : 'border-slate-200/60 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Options (Description & Category & Image) */}
        {(showExtra || description || categoryId || selectedFile) && (
          <div className="space-y-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category (Danh mục)
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
        )}
      </div>

      {/* Done CTA */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting || createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{statusText || 'Đang xử lý...'}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Done (Tạo Task)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
