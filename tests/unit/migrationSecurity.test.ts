import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';

const MIGRATIONS_DIR = 'supabase/migrations';

function readAllMigrations(): Array<{ file: string; sql: string }> {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((file) => ({ file, sql: readFileSync(`${MIGRATIONS_DIR}/${file}`, 'utf8') }));
}

describe('migrations: SECURITY DEFINER functions must revoke public execute', () => {
  it('purge_old_deleted_notes has an explicit revoke in migrations', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005000000_revoke_purge_notes.sql',
      'utf8',
    );
    expect(sql).toMatch(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.purge_old_deleted_notes\(\)\s+FROM\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.purge_old_deleted_notes\(\)\s+TO\s+service_role/i,
    );
  });
});

describe('migrations: backup tables are locked, never dropped', () => {
  const BACKUP_TABLES = [
    'tags_backup_20260907',
    'todo_tags_backup_20260907',
    'note_tags_backup_20260907',
  ];

  it('revokes anon/authenticated and keeps service_role for rollback', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005000001_lock_backup_tables.sql',
      'utf8',
    );
    for (const t of BACKUP_TABLES) {
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON TABLE public\\.${t}\\s+FROM anon, authenticated`, 'i'),
      );
      expect(sql).toMatch(
        new RegExp(`GRANT ALL ON TABLE public\\.${t}\\s+TO service_role`, 'i'),
      );
    }
    expect(sql).not.toMatch(/DROP\s+TABLE/i);
  });
});

describe('migrations: default privileges block recurrence', () => {
  it('revokes future tables/functions/sequences for postgres grantor', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005000002_alter_default_privileges.sql',
      'utf8',
    );
    expect(sql).toMatch(
      /ALTER\s+DEFAULT\s+PRIVILEGES\s+FOR\s+ROLE\s+postgres\s+IN\s+SCHEMA\s+public\s+REVOKE\s+ALL\s+ON\s+TABLES\s+FROM\s+anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /ALTER\s+DEFAULT\s+PRIVILEGES\s+FOR\s+ROLE\s+postgres\s+IN\s+SCHEMA\s+public\s+REVOKE\s+EXECUTE\s+ON\s+FUNCTIONS\s+FROM\s+public,\s*anon,\s*authenticated/i,
    );
    expect(sql).toMatch(
      /ALTER\s+DEFAULT\s+PRIVILEGES\s+FOR\s+ROLE\s+postgres\s+IN\s+SCHEMA\s+public\s+REVOKE\s+ALL\s+ON\s+SEQUENCES\s+FROM\s+anon,\s*authenticated/i,
    );
  });
});

describe('migrations: RLS auto-enable trigger is codified', () => {
  it('contains rls_auto_enable covering CTAS/SELECT INTO and the event trigger', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005000003_ensure_rls_event_trigger.sql',
      'utf8',
    );
    expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.rls_auto_enable/i);
    expect(sql).toMatch(/CREATE\s+TABLE[\s\S]*CREATE TABLE AS[\s\S]*SELECT INTO/i);
    expect(sql).toMatch(/CREATE\s+EVENT\s+TRIGGER\s+ensure_rls/i);
    expect(sql).toMatch(
      /REVOKE\s+EXECUTE\s+ON\s+FUNCTION\s+public\.rls_auto_enable\(\)\s+FROM\s+public,\s*anon,\s*authenticated/i,
    );
  });
});

describe('migrations: invariant against recurrence', () => {
  it('every CTAS/SELECT INTO table is locked by a migration (all lock files count)', () => {
    const all = readAllMigrations();
    const lockFiles = all
      .map((m, idx) => ({ sql: m.sql, idx }))
      .filter((m) => m.sql.includes('REVOKE ALL ON TABLE'));
    expect(lockFiles.length, 'missing backup lock migration').toBeGreaterThan(0);
    // Strip comment để mention tên bảng trong comment không pass giả.
    const stripComments = (sql: string): string =>
      sql
        .replace(/--[^\n]*/g, '\n')
        .replace(/\/\*[\s\S]*?\*\//g, '\n');

    const isLockedAtOrAfter = (table: string, createIdx: number): boolean =>
      lockFiles.some(
        (m) => m.idx >= createIdx && new RegExp(`\\b${table}\\b`).test(stripComments(m.sql)),
      );

    const ctasTables: Array<{ table: string; idx: number }> = [];
    all.forEach((m, idx) => {
      const re =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s+AS\s+SELECT/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(m.sql)) !== null) {
        if (match[1]) ctasTables.push({ table: match[1], idx });
      }
    });
    expect(ctasTables.length).toBeGreaterThan(0);
    for (const { table, idx } of ctasTables) {
      expect(
        isLockedAtOrAfter(table, idx),
        `CTAS table ${table} is not locked by REVOKE (at/after creation)`,
      ).toBe(true);
    }

    // SELECT INTO cũng tạo bảng (cùng họ với CTAS) nhưng cú pháp khác nên
    // scanner CTAS không thấy. Strip thân function (dollar-quoted $$ lẫn $tag$:
    // plpgsql dùng SELECT...INTO <biến>, không phải tạo bảng) rồi mới quét DDL.
    // [^;]+? để không match xuyên qua dấu ; sang statement khác.
    const selectIntoTables: Array<{ table: string; idx: number }> = [];
    all.forEach((m, idx) => {
      const ddl = m.sql
        .replace(/\$\$[\s\S]*?\$\$/g, '\n')
        .replace(/\$[A-Za-z_]\w*\$[\s\S]*?\$[A-Za-z_]\w*\$/g, '\n');
      const re =
        /SELECT[^;]+?\bINTO\s+((?:(?:TEMP(?:ORARY)?|UNLOGGED|TABLE)\s+)*)(?:public\.)?(\w+)\s+FROM/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(ddl)) !== null) {
        const modifiers = (match[1] ?? '').toUpperCase();
        if (/TEMP|UNLOGGED/.test(modifiers)) continue;
        if (match[2]) selectIntoTables.push({ table: match[2], idx });
      }
    });
    for (const { table, idx } of selectIntoTables) {
      expect(
        isLockedAtOrAfter(table, idx),
        `SELECT INTO table ${table} is not locked by REVOKE`,
      ).toBe(true);
    }
  });

  it('every bare CREATE TABLE has RLS enabled at or after creation, or is locked', () => {
    const all = readAllMigrations();
    const lockSql = all
      .filter((m) => m.sql.includes('REVOKE ALL ON TABLE'))
      .map((m) => m.sql.replace(/--[^\n]*/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '\n'))
      .join('\n');

    const bareTables: Array<{ name: string; idx: number }> = [];
    all.forEach((m, idx) => {
      const re =
        /CREATE\s+(TEMP\s+|TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(m.sql)) !== null) {
        if (match[1]) continue;
        const name = match[2];
        if (!name || /^pg_/i.test(name)) continue;
        bareTables.push({ name, idx });
      }
    });
    expect(bareTables.length).toBeGreaterThan(0);
    for (const { name, idx } of bareTables) {
      // Order-sensitive: RLS phải xuất hiện ở cùng hoặc SAU migration tạo bảng.
      // Check gộp toàn bộ file sẽ pass giả khi bảng tạo ở N+1 mà RLS cùng tên
      // đã có từ migration N, hoặc khi DROP + tạo lại không RLS.
      const laterSql = all
        .slice(idx)
        .map((m) => m.sql)
        .join('\n');
      const hasRls = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${name}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i',
      ).test(laterSql);
      const isLocked = new RegExp(`\\b${name}\\b`).test(lockSql);
      expect(
        hasRls || isLocked,
        `table ${name} has neither ENABLE RLS (at/after creation) nor explicit lock`,
      ).toBe(true);
    }
  });

  it('default-privileges migration documents the supabase_admin residual', () => {
    const sql = readFileSync(
      'supabase/migrations/20261005000002_alter_default_privileges.sql',
      'utf8',
    );
    expect(sql).toMatch(/supabase_admin/);
    expect(sql).toMatch(/RESIDUAL/);
  });
});
