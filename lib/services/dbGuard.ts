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
  if (ids.length > 0 && (!data || data.length === 0)) {
    throw new Error(`${op} failed: not found or access denied`);
  }
  if (data && data.length !== ids.length) {
    console.warn(`[${op}] partial match`, { matched: data.length, requested: ids.length });
  }
}
