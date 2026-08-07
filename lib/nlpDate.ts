import * as chrono from 'chrono-node';

/**
 * Natural Language Date Parsing with Vietnamese pre-processing.
 * Converts phrases like "ngày mai 3h", "thứ 2 tuần sau", "hôm nay" to ISO Date.
 */
export function parseNaturalLanguageDate(text: string): Date | null {
  if (!text || text.trim().length === 0) return null;

  let query = text.toLowerCase().trim();

  // Vietnamese pre-processing map
  query = query
    .replace(/hôm nay/g, 'today')
    .replace(/ngày mai/g, 'tomorrow')
    .replace(/ngày kia/g, 'day after tomorrow')
    .replace(/thứ 2/g, 'Monday')
    .replace(/thứ 3/g, 'Tuesday')
    .replace(/thứ 4/g, 'Wednesday')
    .replace(/thứ 5/g, 'Thursday')
    .replace(/thứ 6/g, 'Friday')
    .replace(/thứ 7/g, 'Saturday')
    .replace(/chủ nhật/g, 'Sunday')
    .replace(/tuần sau/g, 'next week')
    .replace(/cuối tháng/g, 'end of month');

  const parsed = chrono.parseDate(query);
  return parsed || null;
}
