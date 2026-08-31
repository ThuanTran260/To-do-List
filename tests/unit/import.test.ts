import { describe, it, expect } from 'vitest';
import { parseCSVImport, parseJSONImport } from '@/lib/import';

describe('parseCSVImport', () => {
  it('parses quoted titles with commas', () => {
    const csv = 'title,description,priority\n"Hello, world",desc,high';
    const result = parseCSVImport(csv);
    expect(result.validTasks[0].title).toBe('Hello, world');
  });

  it('parses escaped double quotes inside quoted fields', () => {
    const csv = 'title,description,priority\n"She said ""hi""",desc,low';
    const result = parseCSVImport(csv);
    expect(result.validTasks[0].title).toBe('She said "hi"');
  });

  it('removes UTF-8 BOM', () => {
    const csv = '\uFEFFtitle,description\nTask A,desc';
    const result = parseCSVImport(csv);
    expect(result.validTasks).toHaveLength(1);
    expect(result.validTasks[0].title).toBe('Task A');
  });

  it('skips id column when first col is a UUID (36 chars) — legacy export', () => {
    const csv = 'id,title,description,priority,is_completed\nabc12345-1234-1234-1234-123456789abc,Task B,desc,high,true';
    const result = parseCSVImport(csv);
    expect(result.validTasks[0].title).toBe('Task B');
    expect(result.validTasks[0].priority).toBe('high');
    expect(result.validTasks[0].is_completed).toBe(true);
  });

  it('maps fixed positions when no id column', () => {
    const csv = 'title,description,priority,is_completed\nTask C,desc,low,false';
    const result = parseCSVImport(csv);
    expect(result.validTasks[0].title).toBe('Task C');
    expect(result.validTasks[0].priority).toBe('low');
    expect(result.validTasks[0].is_completed).toBe(false);
  });

  it('reports error rows for empty titles instead of silent skip', () => {
    const csv = 'title,description\n,desc\nTask D,desc';
    const result = parseCSVImport(csv);
    expect(result.validTasks).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('defaults priority to medium for unknown values', () => {
    const csv = 'title,description,priority\nTask E,desc,urgent';
    const result = parseCSVImport(csv);
    expect(result.validTasks[0].priority).toBe('medium');
  });

  it('handles CRLF line endings', () => {
    const csv = 'title,description\r\nTask F,desc\r\nTask G,desc2';
    const result = parseCSVImport(csv);
    expect(result.validTasks).toHaveLength(2);
  });
});

describe('parseJSONImport', () => {
  it('parses valid todos array', () => {
    const result = parseJSONImport('[{"title":"T1"},{"title":"T2","priority":"high"}]');
    expect(result.validTasks).toHaveLength(2);
  });

  it('collects errors for invalid rows without aborting', () => {
    const json = JSON.stringify({ todos: [{ title: 'OK' }, { title: '' }, { title: 'OK2' }] });
    const result = parseJSONImport(json);
    expect(result.validTasks).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
  });
});
