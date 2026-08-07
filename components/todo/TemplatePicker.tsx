'use client';

import { useState } from 'react';
import { useTaskTemplates } from '@/hooks/useTaskTemplates';
import type { TaskTemplate } from '@/types/todo';
import { LayoutTemplate, ChevronDown } from 'lucide-react';

interface TemplatePickerProps {
  onSelectTemplate: (template: TaskTemplate['template_data']) => void;
}

export function TemplatePicker({ onSelectTemplate }: TemplatePickerProps) {
  const { data: templates = [] } = useTaskTemplates();
  const [isOpen, setIsOpen] = useState(false);

  if (templates.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white text-xs transition-colors"
      >
        <LayoutTemplate className="w-3.5 h-3.5 text-indigo-400" />
        <span>Chọn mẫu</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 flex flex-col gap-1">
          <div className="text-[11px] font-semibold text-slate-400 px-2 py-1">Mẫu công việc</div>
          {templates.map(tpl => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                onSelectTemplate(tpl.template_data);
                setIsOpen(false);
              }}
              className="flex flex-col items-start px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-left text-xs transition-colors"
            >
              <span className="font-medium text-slate-200">{tpl.name}</span>
              {tpl.template_data.checklist && (
                <span className="text-[10px] text-slate-400">
                  {tpl.template_data.checklist.length} checklist items
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
