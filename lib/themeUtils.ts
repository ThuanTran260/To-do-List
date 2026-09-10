export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Xoay vòng theme 1 chạm cho mobile: light -> dark -> system -> light
 * Fallback mặc định là 'light' khi gặp giá trị không xác định.
 */
export function getNextTheme(current: string): ThemeMode {
  if (current === 'light') return 'dark';
  if (current === 'dark') return 'system';
  return 'light';
}
