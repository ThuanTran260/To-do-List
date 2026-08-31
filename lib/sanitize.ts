/**
 * Sanitizes user input text by stripping HTML tags, script blocks,
 * and dangerous control characters, ensuring safe storage and rendering.
 * S-06: lặp strip đến khi ổn định để chống malformed tags (<scr<script>ipt>).
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  let prev: string;
  let out = input;
  do {
    prev = out;
    out = out
      .replace(/<script\b[^<]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[^<]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  } while (out !== prev);
  return out;
}
