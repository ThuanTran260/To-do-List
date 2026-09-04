import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

// FIX MD-07: Single JSDOM instance — nhanh hơn per-request ~10x.
// Trade-off: singleton shared DOM — trên Vercel Serverless (process ngắn) an toàn.
// Nếu chạy trên persistent Node server và nghi leak, đổi sang per-request JSDOM:
//   const { window } = new JSDOM(''); DOMPurify(window).sanitize(html); window.close();
const { window } = new JSDOM('');
type DOMPurifyWindow = Parameters<typeof DOMPurify>[0];
const purify = DOMPurify(window as unknown as DOMPurifyWindow);

// Whitelist khớp với TipTap output (paragraph, heading, marks, task list, highlight).
// Review fix (#7): TaskItem render <li><label><input type=checkbox><div> — thiếu
// label/div/input là sanitize on-read strip mất checkbox khi reload.
const ALLOWED_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 's', 'u', 'code', 'pre',
  'mark', 'blockquote',
  'ul', 'ol', 'li',
  'hr', 'br', 'span',
  'label', 'div', 'input',
];
const ALLOWED_ATTR = ['class', 'data-color', 'data-type', 'data-checked', 'type', 'checked'];

export function sanitizeHtmlServer(html: string): string {
  if (!html) return '';
  return purify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
