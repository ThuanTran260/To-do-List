export const DEFAULT_TAG_COLOR = '#6366f1';
export const TAG_PRESET_COLORS = ['#5e6ad2', '#f2555a', '#27a644', '#f59e0b', '#3b82f6', '#8b5cf6'];

/**
 * Normalizes hex color string to lowercase 6-digit hex (#rrggbb).
 * Supports #rgb, #rrggbb, #rrggbbaa (alpha stripped), with or without leading #.
 * Falls back to DEFAULT_TAG_COLOR for invalid or empty inputs.
 */
export function normalizeHexColor(color?: string | null): string {
  if (!color || typeof color !== 'string') {
    return DEFAULT_TAG_COLOR;
  }
  let c = color.trim();
  if (!c) return DEFAULT_TAG_COLOR;

  if (!c.startsWith('#')) {
    c = '#' + c;
  }

  // 3-digit hex #rgb -> #rrggbb
  if (/^#[0-9a-fA-F]{3}$/.test(c)) {
    c = `#${c[1]}${c[1]}${c[2]}${c[2]}${c[3]}${c[3]}`;
  } else if (/^#[0-9a-fA-F]{8}$/.test(c)) {
    // 8-digit hex #rrggbbaa -> remove alpha
    c = c.slice(0, 7);
  }

  // 6-digit hex #rrggbb -> lowercase
  if (/^#[0-9a-fA-F]{6}$/.test(c)) {
    return c.toLowerCase();
  }

  return DEFAULT_TAG_COLOR;
}

/**
 * Generates an rgba hex tint string (e.g. #rrggbb22) from a tag color.
 */
export function getTagTint(color?: string | null, alphaHex = '22'): string {
  return `${normalizeHexColor(color)}${alphaHex}`;
}
