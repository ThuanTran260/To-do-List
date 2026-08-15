'use client';

export interface TagItem {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

interface TagBadgesProps {
  tags?: TagItem[];
}

export function TagBadges({ tags }: TagBadgesProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tags.map((tag) => (
        <span
          key={tag.id}
          style={{ backgroundColor: `${tag.color}15`, color: tag.color, borderColor: `${tag.color}35` }}
          className="px-1.5 py-0.5 rounded text-[10px] font-medium border"
        >
          #{tag.name}
        </span>
      ))}
    </div>
  );
}
