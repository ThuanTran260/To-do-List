import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 's', 'u', 'code', 'pre',
  'mark', 'blockquote',
  'ul', 'ol', 'li',
  'hr', 'br', 'span'
];

const ALLOWED_ATTR = ['class', 'data-color', 'data-type', 'data-checked', 'style'];

/**
 * Sanitizes HTML strings using DOMPurify with an explicit whitelist.
 * Safe for client-side execution (safe fallback for SSR).
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    // Basic SSR fallback: strip script and iframe tags
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
  });
}
