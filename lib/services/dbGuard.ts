/**
 * E-H5: defense-in-depth — RLS là lớp 1, app assert là lớp 2.
 * PostgREST trả 0-row (không error) khi RLS chặn → phải assert tường minh.
 */
export function assertOwnedRow<T>(data: T[] | null, op: string): T[] {
  if (!data || data.length === 0) {
    throw new Error(`${op} failed: not found or access denied`);
  }
  return data;
}

export function assertBulkAffected(data: unknown[] | null, ids: string[], op: string): void {
  // Review fix (#16): ids rỗng → pass (không false-positive). LƯU Ý: assert chạy SAU
  // query nên không tránh được `.in('id', [])` — callers bulk với ids rỗng là no-op
  // ở tầng UI (button disabled khi không chọn); PostgREST empty-IN trả [] an toàn.
  if (ids.length === 0) return;
  if (!data || data.length === 0) {
    throw new Error(`${op} failed: not found or access denied`);
  }
  if (data && data.length !== ids.length) {
    console.warn(`[${op}] partial match`, { matched: data.length, requested: ids.length });
  }
}
