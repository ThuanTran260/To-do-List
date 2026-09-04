import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 's', 'u', 'code', 'pre',
  'mark', 'blockquote',
  'ul', 'ol', 'li',
  'hr', 'br', 'span',
  // Review fix (#7): khớp TaskItem DOM (<label><input type=checkbox><div>), đồng bộ serverSanitize
  'label', 'div', 'input'
];

const ALLOWED_ATTR = ['class', 'data-color', 'data-type', 'data-checked', 'type', 'checked'];

/**
 * Sanitizes HTML strings using DOMPurify with an explicit whitelist.
 * Safe for client-side execution (safe fallback for SSR).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    // S-04: SSR fallback — chỉ render-safe text, không fallback nửa vời.
    // Strip TOÀN BỘ tag thay vì chỉ script/iframe (bypass qua <svg onload>, <img onerror>, <math>...).
    return html.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
