'use client';

import { TagData } from '@/hooks/useTags';

interface TagBadgesProps {
  tags?: TagData[];
}

export function TagBadges({ tags }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag.id}
          style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}40` }}
          className="px-2 py-0.5 rounded-md text-[10px] font-extrabold border uppercase tracking-wider"
        >
          #{tag.name}
        </span>
      ))}
    </div>
  );
}
