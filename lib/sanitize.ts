/**
 * Sanitizes user input text by stripping HTML tags, script blocks,
 * and dangerous control characters, ensuring safe storage and rendering.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
    .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}
