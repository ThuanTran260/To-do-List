export interface RecordedCall {
  method: string;
  args: unknown[];
}

/**
 * Chainable stub ghi lại mọi call để assert filter.
 * `then` resolve { data, error, count } nên `await builder` hoạt động,
 * destructuring { data, error } an toàn.
 */
export function createFakeSupabase(returnedRows: unknown[] = []) {
  const calls: RecordedCall[] = [];
  const builder: unknown = new Proxy(function () {}, {
    get(_t, prop: string | symbol) {
      if (prop === 'then') {
        return (resolve: (v: unknown) => void) =>
          resolve({ data: returnedRows, error: null, count: returnedRows.length });
      }
      return (...args: unknown[]) => {
        calls.push({ method: String(prop), args });
        return builder;
      };
    },
    apply() {
      return builder;
    },
  });
  return {
    calls,
    supabase: {
      from: (table: string) => {
        calls.push({ method: 'from', args: [table] });
        return builder;
      },
    },
  };
}

export function hasEq(calls: RecordedCall[], column: string, value: unknown): boolean {
  return calls.some(
    (c) => c.method === 'eq' && c.args[0] === column && c.args[1] === value
  );
}
