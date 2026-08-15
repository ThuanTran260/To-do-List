'use client';

interface WeekStripProps {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}

export function WeekStrip({ selectedDate, onSelectDate }: WeekStripProps) {
  const get7Days = () => {
    const days: Date[] = [];
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday
    const startOfWeek = new Date(current);
    startOfWeek.setDate(current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Monday start

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = get7Days();
  const today = new Date();

  return (
    <div className="grid grid-cols-7 gap-1.5 p-2 bg-surface-1 border border-hairline rounded-xl">
      {days.map((d, i) => {
        const isToday = d.toDateString() === today.toDateString();
        const isSelected = d.toDateString() === selectedDate.toDateString();
        const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        return (
          <button
            key={i}
            onClick={() => onSelectDate(d)}
            className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors cursor-pointer ${
              isSelected
                ? 'bg-primary text-on-primary font-semibold shadow-xs'
                : isToday
                ? 'bg-primary-subtle text-primary border border-primary-border font-medium'
                : 'hover:bg-surface-2 text-ink-muted hover:text-ink'
            }`}
          >
            <span className="text-[10px] font-medium uppercase">{dayNames[d.getDay()]}</span>
            <span className="text-xs font-semibold mt-0.5">{d.getDate()}</span>
          </button>
        );
      })}
    </div>
  );
}
