'use client';

import { useState } from 'react';
import { useCreateTodo } from '@/hooks/useTodos';
import { useCategories } from '@/hooks/useCategories';
import { useAuth } from '@/hooks/useAuth';
import { uploadTaskImage } from '@/lib/storage';
import { DatePickerModal } from '@/components/ui/DatePickerModal';
import { CustomPrioritySelect, type PriorityType } from '@/components/ui/CustomPrioritySelect';
import { CustomCategorySelect } from '@/components/ui/CustomCategorySelect';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { TagPicker } from '@/components/ui/TagPicker';
import { RecurrencePicker } from '@/components/todo/RecurrencePicker';
import { TemplatePicker } from '@/components/todo/TemplatePicker';
import { parseNaturalLanguageDate } from '@/lib/nlpDate';
import { motion, AnimatePresence } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import {
  Plus,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  AlignLeft,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import type { TaskTemplate } from '@/types/todo';

export function TodoForm() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityType>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [recurrenceRule, setRecurrenceRule] = useState<string | null>(null);

  const [showExtra, setShowExtra] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [statusText, setStatusText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [nlpPreview, setNlpPreview] = useState<Date | null>(null);

  const createMutation = useCreateTodo();
  const { data: categories = [] } = useCategories();

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const parsed = parseNaturalLanguageDate(val);
    if (parsed && !dueDate) {
      setNlpPreview(parsed);
    } else {
      setNlpPreview(null);
    }
  };

  const applyNlpDate = () => {
    if (nlpPreview) {
      setDueDate(nlpPreview.toISOString());
      setNlpPreview(null);
    }
  };

  const handleSelectTemplate = (templateData: TaskTemplate['template_data']) => {
    setTitle(templateData.title);
    if (templateData.description) setDescription(templateData.description);
    if (templateData.priority) setPriority(templateData.priority);
    if (templateData.category_id) setCategoryId(templateData.category_id);
    setShowExtra(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề công việc!');
      return;
    }

    try {
      setIsSubmitting(true);
      let imageUrl: string | undefined = undefined;

      if (selectedFile && user) {
        setStatusText('Đang tải ảnh lên Supabase Storage...');
        const uploaded = await uploadTaskImage(selectedFile, user.id, (s) => setStatusText(s));
        if (uploaded) {
          imageUrl = uploaded;
        }
      }

      const finalDueDate = dueDate || (nlpPreview ? nlpPreview.toISOString() : undefined);

      setStatusText('Đang khởi tạo công việc...');
      createMutation.mutate(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          due_date: finalDueDate,
          category_id: categoryId || undefined,
          image_url: imageUrl,
          tag_ids: selectedTagIds,
          recurrence_rule: recurrenceRule,
        },
        {
          onSuccess: () => {
            setTitle('');
            setDescription('');
            setPriority('medium');
            setDueDate('');
            setCategoryId('');
            setSelectedFile(null);
            setSelectedTagIds([]);
            setRecurrenceRule(null);
            setShowExtra(false);
            setStatusText('');
            setIsSubmitting(false);
            setNlpPreview(null);
          },
          onError: (err) => {
            setErrorMsg((err as Error).message);
            setIsSubmitting(false);
            setStatusText('');
          },
        }
      );
    } catch (err) {
      setErrorMsg((err as Error).message);
      setIsSubmitting(false);
      setStatusText('');
    }
  };

  // Due date display string
  let formattedDueDateDisplay = 'Chọn hạn (Due date)';
  if (dueDate) {
    const d = new Date(dueDate);
    formattedDueDateDisplay = d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="relative rounded-3xl glass-panel bg-white/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden"
      >
        <div className="p-4 sm:p-6 space-y-4 max-h-[70dvh] overflow-y-auto overscroll-contain no-scrollbar">
          {/* Header Bar with TemplatePicker */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Add New Task (Tạo công việc mới)
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <TemplatePicker onSelectTemplate={handleSelectTemplate} />

              <button
                type="button"
                onClick={() => setShowExtra(!showExtra)}
                className={`text-xs font-bold transition-all px-3 py-1.5 rounded-xl flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                  showExtra || description || categoryId || selectedFile || selectedTagIds.length > 0
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>{showExtra ? 'Thu gọn' : 'Chi tiết'}</span>
              </button>
            </div>
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
                Title (Tiêu đề - Gõ "ngày mai", "thứ 2" để tự phát hiện ngày)
              </label>
              <input
                id="todo-title-input"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Tên công việc (ví dụ: Nộp báo cáo ngày mai 3h...)"
                className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />

              {/* Natural Language Date Suggestion Pill */}
              {nlpPreview && (
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyNlpDate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Phát hiện hạn: {nlpPreview.toLocaleString('vi-VN')} — <b>Áp dụng</b></span>
                  </button>
                </div>
              )}
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
                  className="w-full bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2.5 rounded-xl text-xs text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700 hover:border-indigo-500 focus:outline-none font-semibold flex items-center justify-between transition-colors cursor-pointer"
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
                <CustomPrioritySelect
                  value={priority}
                  onChange={(val) => setPriority(val)}
                />
              </div>
            </div>

            {/* Tags & Recurrence controls row */}
            <div className="flex items-center gap-3 pt-1">
              <TagPicker selectedTagIds={selectedTagIds} onChange={setSelectedTagIds} />
              <RecurrencePicker value={recurrenceRule} onChange={setRecurrenceRule} />
            </div>

            {/* Expandable Extra Panel */}
            <AnimatePresence initial={false}>
              {(showExtra || description || categoryId || selectedFile) && (
                <motion.div
                  key="expandable-extra-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springPillMotion}
                  className="overflow-visible"
                >
                  <div className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Category (Danh mục)
                      </label>
                      <CustomCategorySelect
                        categories={categories}
                        value={categoryId}
                        onChange={(id) => setCategoryId(id)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Task Description (Mô tả chi tiết)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nội dung chi tiết, mục tiêu, yêu cầu công việc..."
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
        </div>

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-[60] px-4 py-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shadow-lg">
          <div className="text-[11px] font-bold text-slate-400 hidden sm:block">
            {showExtra ? 'Chế độ nhập chi tiết' : 'Chế độ tạo nhanh'}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting || createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 stroke-[3]" />
            )}
            <span>Done (Tạo công việc)</span>
          </button>
        </div>
      </form>

      {/* Date Picker Modal */}
      <DatePickerModal
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedDate={dueDate || null}
        onApply={(iso) => setDueDate(iso || '')}
      />
    </>
  );
}
