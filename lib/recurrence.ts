import { RRule, Frequency } from 'rrule';

export function getRRuleDescription(ruleStr: string | null | undefined): string {
  if (!ruleStr) return '';

  try {
    const rule = RRule.fromString(ruleStr);
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

export function getNextOccurrenceDate(ruleStr: string, fromDate = new Date()): Date | null {
  try {
    const rule = RRule.fromString(ruleStr);
    return rule.after(fromDate, true);
  } catch {
    return null;
  }
}
