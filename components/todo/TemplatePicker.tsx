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
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-hairline bg-surface-2 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer"
      >
        <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
        <span>Chọn mẫu</span>
        <ChevronDown className="w-3 h-3 text-ink-subtle" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1.5 w-56 p-1.5 bg-surface-1 border border-hairline rounded-lg shadow-xl z-50 flex flex-col gap-0.5">
          <div className="text-[11px] font-semibold text-ink-subtle px-2 py-1">Mẫu công việc</div>
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                onSelectTemplate(tpl.template_data);
                setIsOpen(false);
              }}
              className="flex flex-col items-start px-2.5 py-1.5 rounded-md hover:bg-surface-2 text-left text-xs transition-colors cursor-pointer"
            >
              <span className="font-medium text-ink">{tpl.name}</span>
              {tpl.template_data.checklist && (
                <span className="text-[10px] text-ink-subtle">
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
