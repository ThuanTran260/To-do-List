'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { LayoutGroup, motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Layers } from 'lucide-react';

function CategoryFilterBarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get('category');

  const { data: categories = [] } = useCategories();

  const handleSelectCategory = (catId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (catId) {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, totalItems: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIndex = (index + 1) % totalItems;
      const targetBtn = document.getElementById(`cat-tab-${nextIndex}`);
      targetBtn?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIndex = (index - 1 + totalItems) % totalItems;
      const targetBtn = document.getElementById(`cat-tab-${prevIndex}`);
      targetBtn?.focus();
    }
  };

  const items = [
    { id: null, name: 'Tất cả (All)', color: null },
    { id: 'uncategorized', name: 'Chưa phân loại', color: '#94a3b8' },
    ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
  ];

  return (
    <LayoutGroup id="category-filter">
      <div className="space-y-1.5 pb-2">
        <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          <span>Lọc theo Danh mục (Categories Filter)</span>
          <span>Dùng ◄ ► để chuyển</span>
        </div>

        <div
          role="tablist"
          aria-label="Category Filter List"
          className="flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar scroll-smooth"
        >
          {items.map((item, index) => {
            const isActive =
              (item.id === null && !activeCategoryId) ||
              (item.id !== null && activeCategoryId === item.id);

            return (
              <button
                key={item.id || 'all'}
                id={`cat-tab-${index}`}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => handleSelectCategory(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index, items.length)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                  isActive
                    ? 'text-white border-transparent shadow-md shadow-indigo-500/20'
                    : 'bg-white/80 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="category-filter-active-pill"
                    transition={springPillMotion}
                    className="absolute inset-0 rounded-xl bg-indigo-600 dark:bg-indigo-600 z-0"
                  />
                )}

                <div className="flex items-center gap-1.5 relative z-10">
                  {item.color ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-xs"
                      style={{ backgroundColor: item.color }}
                    />
                  ) : (
                    <Layers className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                  )}
                  <span className="truncate">{item.name}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

export function CategoryFilterBar() {
  return (
    <Suspense fallback={null}>
      <CategoryFilterBarContent />
    </Suspense>
  );
}
