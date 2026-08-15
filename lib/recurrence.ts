import { rrulestr, Frequency } from 'rrule';

export function getRRuleDescription(ruleStr: string | null | undefined): string {
  if (!ruleStr) return '';

  try {
    const rule = rrulestr(ruleStr);
    const freq = rule.options.freq;

    if (freq === Frequency.DAILY) return 'Lặp lại: Hàng ngày';
    if (freq === Frequency.WEEKLY) return 'Lặp lại: Hàng tuần';
    if (freq === Frequency.MONTHLY) return 'Lặp lại: Hàng tháng';
    if (freq === Frequency.YEARLY) return 'Lặp lại: Hàng năm';

    return 'Lặp lại theo chu kỳ';
  } catch {
    return 'Lặp lại';
  }
}

/**
 * Calculates the next occurrence date for a recurring task.
 *
 * @param ruleStr - The iCalendar RRule string (e.g. "FREQ=DAILY", "FREQ=WEEKLY")
 * @param fromDate - The original due date of the task (or current date if no due date was set)
 * @param recurrenceEnd - Optional ISO date string when recurrence should stop
 * @returns The next Date object, or null if recurrence ended or rule is invalid
 */
export function getNextOccurrenceDate(
  ruleStr: string,
  fromDate: Date = new Date(),
  recurrenceEnd?: string | null
): Date | null {
  try {
    // 1. Create rule with dtstart anchored to fromDate to preserve original task time of day (hour, minute, second)
    const rule = rrulestr(ruleStr, { dtstart: fromDate });

    // 2. Base date: If the task is overdue (completed days late), use current date as reference so the next task
    // is generated in the future instead of remaining stuck in the past.
    const now = new Date();
    const baseDate = fromDate < now ? now : fromDate;

    // 3. Compute next occurrence strictly after baseDate (inc = false)
    const nextDate = rule.after(baseDate, false);
    if (!nextDate) return null;

    // 4. Check recurrence_end (if set)
    if (recurrenceEnd) {
      const endDate = new Date(recurrenceEnd);
      if (nextDate > endDate) return null;
    }

    return nextDate;
  } catch {
    return null;
  }
}
