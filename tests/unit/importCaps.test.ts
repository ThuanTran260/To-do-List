import { describe, it, expect } from 'vitest';
import { parseCSVImport, parseJSONImport } from '@/lib/import';

describe('import caps (E-M9 DoS)', () => {
  it('caps CSV rows at 1000 with a visible warning', () => {
    const rows = Array.from({ length: 1500 }, (_, i) => `Task ${i},desc`).join('\n');
    const { validTasks, errors } = parseCSVImport(`title,description\n${rows}`);
    expect(validTasks.length).toBeLessThanOrEqual(1000);
    expect(errors.some((e) => e.includes('1000'))).toBe(true);
  });

  it('caps JSON todos at 1000 with a visible warning', () => {
    const todos = Array.from({ length: 1500 }, (_, i) => ({ title: `T${i}` }));
    const { validTasks, errors } = parseJSONImport(JSON.stringify(todos));
    expect(validTasks.length).toBeLessThanOrEqual(1000);
    expect(errors.some((e) => e.includes('1000'))).toBe(true);
  });

  it('truncates overlong title/description cells', () => {
    const { validTasks } = parseCSVImport(`title,description\n${'x'.repeat(2000)},${'y'.repeat(20000)}`);
    expect(validTasks[0].title.length).toBeLessThanOrEqual(500);
    expect(validTasks[0].description!.length).toBeLessThanOrEqual(5000);
  });

  it('still reports structural JSON errors (branch not killed by caps)', () => {
    const { validTasks, errors } = parseJSONImport('{"foo": 1}');
    expect(validTasks).toEqual([]);
    expect(errors.length).toBeGreaterThan(0);
  });
});
