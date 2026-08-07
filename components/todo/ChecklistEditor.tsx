'use client';

import { useState } from 'react';
import { ChecklistItem } from './ChecklistProgress';
import { Plus, X, Check, Trash2 } from 'lucide-react';

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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Checklist / Subtasks ({items.filter((i) => i.is_done).length}/{items.length})
        </label>
      </div>

      {/* Item List */}
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 text-xs group"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => handleToggleItem(item.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${
                  item.is_done
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                }`}
              >
                {item.is_done && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <span
                className={`truncate ${
                  item.is_done
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-800 dark:text-slate-200 font-medium'
                }`}
              >
                {item.title}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteItem(item.id)}
              className="p-1 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
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
          className="flex-1 bg-slate-100/80 dark:bg-slate-800/80 px-3 py-2 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/60 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
        />
        <button
          type="submit"
          disabled={!newItemTitle.trim()}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
