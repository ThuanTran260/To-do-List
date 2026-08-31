import { describe, it, expect } from 'vitest';
import { getNextOccurrenceDate } from '@/lib/recurrence';

// Decision #2 (2026-08-31): overdue N kỳ chỉ sinh 1 bản duy nhất từ now — không catch-up N bản.
describe('getNextOccurrenceDate (1-occurrence policy)', () => {
  it('returns a future date for a valid daily rule', () => {
    const next = getNextOccurrenceDate('FREQ=DAILY', new Date(), null);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThan(Date.now());
  });

  it('overdue 60 ngày vẫn chỉ sinh 1 bản kế tiếp từ now, không sinh 60 bản', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const next = getNextOccurrenceDate('FREQ=DAILY', sixtyDaysAgo, null);

    expect(next).not.toBeNull();
    // Next occurrence phải gần now (dựa trên baseDate=now), không phải 60 ngày trước
    expect(next!.getTime()).toBeGreaterThan(Date.now() - 86400000);
    // Và không vượt quá 2 ngày tính từ now (FREQ=DAILY → kế tiếp ≤ 1 ngày sau now)
    expect(next!.getTime()).toBeLessThanOrEqual(Date.now() + 2 * 86400000);
  });

  it('respects recurrence_end', () => {
    const past = new Date('2026-01-01T09:00:00Z');
    const end = new Date(Date.now() + 86400000).toISOString();
    const next = getNextOccurrenceDate('FREQ=DAILY', past, end);
    expect(next).not.toBeNull();

    const nextBeyondEnd = getNextOccurrenceDate('FREQ=DAILY', past, '2026-01-02T00:00:00Z');
    expect(nextBeyondEnd).toBeNull();
  });

  it('returns null for invalid rule string', () => {
    expect(getNextOccurrenceDate('NOT_A_RRULE', new Date(), null)).toBeNull();
  });
});
