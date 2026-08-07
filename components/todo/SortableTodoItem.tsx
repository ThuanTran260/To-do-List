'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TodoItem } from './TodoItem';
import type { TodoItemData } from '@/types/todo';
import { GripVertical } from 'lucide-react';

interface SortableTodoItemProps {
  item: TodoItemData;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showBulkSelect?: boolean;
}

export function SortableTodoItem({ item, isSelected, onToggleSelect, showBulkSelect }: SortableTodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/sortable">
      {/* Drag Grip Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-1 top-1/2 -translate-y-1/2 z-20 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable:opacity-100 transition-opacity"
        title="Kéo thả để sắp xếp"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="pl-4">
        <TodoItem
          item={item}
          isSelected={isSelected}
          onToggleSelect={onToggleSelect}
          showBulkSelect={showBulkSelect}
        />
      </div>
    </div>
  );
}
