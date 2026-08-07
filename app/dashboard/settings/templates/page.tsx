'use client';

import { useState } from 'react';
import { useTaskTemplates, useCreateTaskTemplate, useDeleteTaskTemplate } from '@/hooks/useTaskTemplates';
import { LayoutTemplate, Plus, Trash2, CheckCircle2 } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <LayoutTemplate className="w-6 h-6 text-indigo-400" />
          Quản Lý Mẫu Công Việc (Templates)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Tạo các mẫu công việc định sẵn để tái sử dụng nhanh chóng khi tạo task mới.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form tạo template */}
        <form onSubmit={handleCreate} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Tạo mẫu mới</h2>
          
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tên mẫu</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Kiểm thử Release Sprint"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tiêu đề task mặc định</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Chạy test suite & deploy staging"
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Mô tả mặc định</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Nhập ghi chú hoặc quy trình cần theo dõi..."
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Độ ưu tiên</label>
            <select
              value={priority}
              onChange={e => setPriority(e.target.value as any)}
              className="w-full px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Lưu Template</span>
          </button>
        </form>

        {/* Danh sách templates */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-200">Danh sách mẫu hiện tại ({templates.length})</h2>
          {isLoading ? (
            <p className="text-slate-400 text-sm">Đang tải templates...</p>
          ) : templates.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-sm">
              Chưa có mẫu nào được lưu.
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map(tpl => (
                <div key={tpl.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-indigo-400">{tpl.name}</h3>
                    <p className="text-xs text-slate-300 font-medium mt-1">{tpl.template_data.title}</p>
                    {tpl.template_data.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tpl.template_data.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
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
