import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

type DOMPurifyWindow = Parameters<typeof DOMPurify>[0];
type DOMPurifyInstance = ReturnType<typeof DOMPurify>;

let purifyInstance: DOMPurifyInstance | null = null;

// Lazy singleton initialization: avoids module-evaluation cold-start crash on Vercel Serverless
// while preserving singleton reuse (~10x faster than per-request JSDOM instance creation).
export function getPurify(): DOMPurifyInstance {
  if (!purifyInstance) {
    const { window } = new JSDOM('');
    purifyInstance = DOMPurify(window as unknown as DOMPurifyWindow);
  }
  return purifyInstance;
}

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
  return getPurify().sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
