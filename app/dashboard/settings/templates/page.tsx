'use client';

import { useState } from 'react';
import { useTaskTemplates, useCreateTaskTemplate, useDeleteTaskTemplate } from '@/hooks/useTaskTemplates';
import { LayoutTemplate, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTaskTemplates();
  const createTemplate = useCreateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();

  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !title.trim()) return;

    try {
      await createTemplate.mutateAsync({
        name,
        template_data: {
          title,
          description: description || undefined,
          priority,
        },
      });
      setName('');
      setTitle('');
      setDescription('');
      toast.success('Đã lưu mẫu công việc');
    } catch {
      toast.error('Không thể tạo mẫu công việc');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast.success('Đã xóa mẫu');
    } catch {
      toast.error('Không thể xóa mẫu');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-ink flex items-center gap-2">
          <LayoutTemplate className="w-5 h-5 text-primary" />
          <span>Quản Lý Mẫu Công Việc (Templates)</span>
        </h1>
        <p className="text-ink-subtle text-xs mt-0.5">
          Tạo các mẫu công việc định sẵn để tái sử dụng nhanh chóng khi tạo task mới.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Form tạo template */}
        <form onSubmit={handleCreate} className="surface-panel bg-surface-1 border border-hairline rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Tạo mẫu mới</h2>
          
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Tên mẫu</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Kiểm thử Release Sprint"
              className="w-full px-3 py-2 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Tiêu đề task mặc định</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Chạy test suite & deploy staging"
              className="w-full px-3 py-2 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Mô tả mặc định</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập ghi chú hoặc quy trình cần theo dõi..."
              className="w-full px-3 py-2 text-xs bg-surface-2 border border-hairline rounded-md text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-normal min-h-[70px]"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-muted">Độ ưu tiên</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-surface-2 border border-hairline rounded-md text-ink focus:outline-none font-medium cursor-pointer"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary-hover text-on-primary font-medium text-xs rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Lưu Template</span>
          </button>
        </form>

        {/* Danh sách templates */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink">Danh sách mẫu hiện tại ({templates.length})</h2>
          {isLoading ? (
            <p className="text-ink-subtle text-xs">Đang tải templates...</p>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-hairline rounded-xl text-ink-subtle text-xs">
              Chưa có mẫu nào được lưu.
            </div>
          ) : (
            <div className="space-y-2.5">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-3.5 surface-panel bg-surface-1 border border-hairline rounded-xl flex items-start justify-between">
                  <div className="min-w-0 pr-2">
                    <h3 className="text-xs font-semibold text-primary">{tpl.name}</h3>
                    <p className="text-xs text-ink font-medium mt-0.5">{tpl.template_data.title}</p>
                    {tpl.template_data.description && (
                      <p className="text-[11px] text-ink-muted mt-0.5 line-clamp-2">{tpl.template_data.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1 rounded-md text-ink-subtle hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
