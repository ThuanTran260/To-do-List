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
        className="relative rounded-xl surface-panel bg-surface-1 border border-hairline overflow-hidden"
      >
        <div className="p-4 sm:p-5 space-y-4 max-h-[70dvh] overflow-y-auto overscroll-contain no-scrollbar">
          {/* Header Bar with TemplatePicker */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary-subtle text-primary border border-primary-border">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-semibold text-xs sm:text-sm text-ink uppercase tracking-wider">
                Tạo công việc mới
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <TemplatePicker onSelectTemplate={handleSelectTemplate} />

              <button
                type="button"
                onClick={() => setShowExtra(!showExtra)}
                className={`relative text-xs font-medium transition-colors px-2.5 py-1.5 rounded-md flex items-center gap-1.5 border cursor-pointer ${
                  showExtra || description || categoryId || selectedFile
                    ? 'bg-primary-subtle border-primary-border text-primary'
                    : 'bg-surface-2 border-hairline text-ink-muted hover:text-ink hover:bg-surface-3'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>{showExtra ? 'Thu gọn' : 'Chi tiết'}</span>
                {!showExtra && (description || categoryId || selectedFile) && (
                  <span className="w-2 h-2 rounded-full bg-primary" title="Đã có nội dung đính kèm bên trong" />
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Main Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1">
                Tiêu đề (gõ &quot;ngày mai&quot;, &quot;thứ 2&quot; để tự phát hiện hạn)
              </label>
              <input
                id="todo-title-input"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Tên công việc (ví dụ: Nộp báo cáo ngày mai 3h...)"
                className="w-full bg-surface-2 px-3 py-2 rounded-md text-xs sm:text-sm text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
              />

              {/* Natural Language Date Suggestion Pill */}
              {nlpPreview && (
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyNlpDate}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary-subtle border border-primary-border text-primary text-xs font-medium hover:bg-primary-subtle/80 transition-colors"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-warning" />
                    <span>Phát hiện hạn: {nlpPreview.toLocaleString('vi-VN')} — <b>Áp dụng</b></span>
                  </button>
                </div>
              )}
            </div>

            {/* Date & Priority Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1">
                  Hạn hoàn thành (Due date)
                </label>
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(true)}
                  className="w-full bg-surface-2 px-3 py-2 rounded-md text-xs text-ink border border-hairline hover:border-hairline-strong focus:outline-none font-medium flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 truncate">
                    <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span className="truncate">{formattedDueDateDisplay}</span>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-ink-subtle flex-shrink-0" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1">
                  Mức ưu tiên (Priority)
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
              {showExtra && (
                <motion.div
                  key="expandable-extra-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={springPillMotion}
                  className="overflow-visible"
                >
                  <div className="space-y-3 pt-3 border-t border-hairline">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1">
                        Danh mục (Category)
                      </label>
                      <CustomCategorySelect
                        categories={categories}
                        value={categoryId}
                        onChange={(id) => setCategoryId(id)}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-ink-subtle uppercase tracking-wider mb-1">
                        Mô tả chi tiết (Description)
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Nội dung chi tiết, mục tiêu, yêu cầu công việc..."
                        rows={3}
                        className="w-full bg-surface-2 p-2.5 rounded-md text-xs text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium resize-y"
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
        <div className="sticky bottom-0 z-[60] px-4 py-3 bg-surface-1/95 backdrop-blur-md border-t border-hairline flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium text-ink-subtle hidden sm:block">
            {showExtra ? 'Chế độ nhập chi tiết' : 'Chế độ tạo nhanh'}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="w-full sm:w-auto px-5 py-2 rounded-md bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs transition-colors flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isSubmitting || createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>Tạo công việc</span>
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
