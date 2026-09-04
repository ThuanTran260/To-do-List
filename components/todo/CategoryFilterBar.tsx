'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCategories, useRealtimeCategories } from '@/hooks/useCategories';
import { LayoutGroup, motion } from 'framer-motion';
import { springPillMotion } from '@/lib/motion';
import { Layers, Calendar, SlidersHorizontal } from 'lucide-react';
import { formatMonthLabel } from '@/lib/dateUtils';

interface CategoryFilterBarProps {
  availableMonths?: string[];
  activeMonth?: string;
  onSelectMonth?: (month: string) => void;
  monthCounts?: Record<string, number>;
  taskLimit?: string;
  onSelectLimit?: (limit: string) => void;
  totalTasks?: number;
}

function CategoryFilterBarContent({
  availableMonths = [],
  activeMonth,
  onSelectMonth,
  monthCounts = {},
  taskLimit = '20',
  onSelectLimit,
  totalTasks = 0,
}: CategoryFilterBarProps) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category');

  // Local state for 0ms instant active tab switching & 60fps Framer Motion slide
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(initialCategory);

  // Sync state if URL searchParams change externally
  useEffect(() => {
    setActiveCategoryId(searchParams.get('category'));
  }, [searchParams]);

  // Realtime subscription for categories
  useRealtimeCategories();

  const { data: categories = [] } = useCategories();

  const handleSelectCategory = (catId: string | null) => {
    setActiveCategoryId(catId);

    const params = new URLSearchParams(window.location.search);
    if (catId) {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    params.delete('page');

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
    window.dispatchEvent(new Event('popstate'));
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
    { id: null, name: 'Tất cả', color: null },
    { id: 'uncategorized', name: 'Chưa phân loại', color: '#8a8f98' },
    ...categories.map((c) => ({ id: c.id, name: c.name, color: c.color })),
  ];

  const latestMonth = availableMonths[0];

  return (
    <div className="space-y-2 pb-1">
      {/* Category Pills Section */}
      <LayoutGroup id="category-filter">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
            <span>Lọc theo Danh mục</span>
            {onSelectLimit && (
              <div className="flex items-center gap-1.5 normal-case font-normal">
                <SlidersHorizontal className="w-3 h-3 text-ink-subtle" />
                <span>Hiển thị:</span>
                <select
                  value={taskLimit}
                  onChange={(e) => onSelectLimit(e.target.value)}
                  className="bg-surface-1 border border-hairline rounded px-1.5 py-0.5 text-xs font-medium text-ink focus:outline-none cursor-pointer"
                >
                  <option value="10">10 task</option>
                  <option value="20">20 task</option>
                  <option value="50">50 task</option>
                  <option value="all">Tất cả task</option>
                </select>
              </div>
            )}
          </div>

          <div
            role="tablist"
            aria-label="Category Filter List"
            className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth"
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
                  className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 flex-shrink-0 border focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer ${
                    isActive
                      ? 'text-on-primary border-transparent font-semibold shadow-xs'
                      : 'bg-surface-1 border-hairline text-ink-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="category-filter-active-pill"
                      transition={springPillMotion}
                      className="absolute inset-0 rounded-md bg-primary z-0 shadow-xs"
                    />
                  )}

                  <div className="flex items-center gap-1.5 relative z-10">
                    {item.color ? (
                      <span
                        className="w-2 h-2 rounded-full shadow-xs"
                        style={{ backgroundColor: item.color }}
                      />
                    ) : (
                      <Layers className="w-3 h-3 flex-shrink-0 opacity-80" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </LayoutGroup>

      {/* Month Filter Section (Only rendered if there are tasks with months) */}
      {availableMonths.length > 0 && onSelectMonth && (
        <LayoutGroup id="month-filter">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scroll-smooth border-t border-hairline/60 pt-1.5">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider pr-1 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Tháng:</span>
            </div>

            {/* Quick Option: Tháng gần nhất */}
            {latestMonth && (
              <button
                type="button"
                onClick={() => onSelectMonth(latestMonth)}
                className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0 border cursor-pointer ${
                  activeMonth === latestMonth
                    ? 'text-on-primary border-transparent font-semibold shadow-xs'
                    : 'bg-surface-1 border-hairline text-ink-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                {activeMonth === latestMonth && (
                  <motion.div
                    layoutId="month-filter-active-pill"
                    transition={springPillMotion}
                    className="absolute inset-0 rounded-md bg-primary z-0 shadow-xs"
                  />
                )}
                <span className="relative z-10">
                  Tháng gần nhất ({formatMonthLabel(latestMonth).replace('Tháng ', 'T')})
                  {monthCounts[latestMonth] !== undefined ? ` • ${monthCounts[latestMonth]}` : ''}
                </span>
              </button>
            )}

            {/* Individual Past Months */}
            {availableMonths.map((m) => {
              // Skip duplicating latestMonth if it's already first
              if (m === latestMonth) return null;
              const isMonthActive = activeMonth === m;

              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMonth(m)}
                  className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0 border cursor-pointer ${
                    isMonthActive
                      ? 'text-on-primary border-transparent font-semibold shadow-xs'
                      : 'bg-surface-1 border-hairline text-ink-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  {isMonthActive && (
                    <motion.div
                      layoutId="month-filter-active-pill"
                      transition={springPillMotion}
                      className="absolute inset-0 rounded-md bg-primary z-0 shadow-xs"
                    />
                  )}
                  <span className="relative z-10">
                    {formatMonthLabel(m)}
                    {monthCounts[m] !== undefined ? ` • ${monthCounts[m]}` : ''}
                  </span>
                </button>
              );
            })}

            {/* Option: Tất cả các tháng */}
            <button
              type="button"
              onClick={() => onSelectMonth('all')}
              className={`relative px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 flex-shrink-0 border cursor-pointer ${
                activeMonth === 'all'
                  ? 'text-on-primary border-transparent font-semibold shadow-xs'
                  : 'bg-surface-1 border-hairline text-ink-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              {activeMonth === 'all' && (
                <motion.div
                  layoutId="month-filter-active-pill"
                  transition={springPillMotion}
                  className="absolute inset-0 rounded-md bg-primary z-0 shadow-xs"
                />
              )}
              <span className="relative z-10">
                Tất cả tháng {totalTasks > 0 ? `• ${totalTasks}` : ''}
              </span>
            </button>
          </div>
        </LayoutGroup>
      )}
    </div>
  );
}

export function CategoryFilterBar(props: CategoryFilterBarProps) {
  return (
    <Suspense fallback={null}>
      <CategoryFilterBarContent {...props} />
    </Suspense>
  );
}

