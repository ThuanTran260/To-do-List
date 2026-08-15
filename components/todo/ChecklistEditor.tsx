'use client';

import { useState } from 'react';
import { ChecklistItem } from './ChecklistProgress';
import { Plus, Check, Trash2 } from 'lucide-react';

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (newItems: ChecklistItem[]) => void;
}

export function ChecklistEditor({ items = [], onChange }: ChecklistEditorProps) {
  const [newItemTitle, setNewItemTitle] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newItemTitle.trim(),
      is_done: false,
    };

    onChange([...items, newItem]);
    setNewItemTitle('');
  };

  const handleToggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, is_done: !item.is_done } : item
    );
    onChange(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    onChange(updated);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink uppercase tracking-wider">
          Checklist / Subtasks ({items.filter((i) => i.is_done).length}/{items.length})
        </label>
      </div>

      {/* Item List */}
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-md bg-surface-2 border border-hairline text-xs group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                  item.is_done
                    ? 'bg-success border-success text-white'
                    : 'border-hairline-strong bg-surface-1'
                }`}
              >
                {item.is_done && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span
                className={`truncate ${
                  item.is_done
                    ? 'line-through text-ink-subtle'
                    : 'text-ink font-normal'
                }`}
              >
                {item.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              className="p-1 text-ink-subtle hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Item Form */}
      <form onSubmit={handleAddItem} className="flex items-center gap-2">
        <input
          type="text"
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Thêm bước nhỏ... (Bấm Enter)"
          className="flex-1 bg-surface-2 px-3 py-1.5 rounded-md text-xs text-ink placeholder:text-ink-subtle border border-hairline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary-border font-medium"
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="p-1.5 rounded-md bg-primary hover:bg-primary-hover text-on-primary text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
