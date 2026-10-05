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
  });
});

describe('migrations: invariant against recurrence', () => {
  it('every CTAS backup table is locked by a later migration', () => {
    const all = readAllMigrations();
    const locked = all.find((m) => m.sql.includes('REVOKE ALL ON TABLE'));
    expect(locked, 'missing backup lock migration').toBeDefined();

    const ctasTables: string[] = [];
    for (const m of all) {
      const re =
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s+AS\s+SELECT/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(m.sql)) !== null) {
        if (match[1]) ctasTables.push(match[1]);
      }
    }
    expect(ctasTables.length).toBeGreaterThan(0);
    for (const table of ctasTables) {
      expect(
        locked!.sql.includes(table),
        `CTAS table ${table} is not locked by REVOKE`,
      ).toBe(true);
    }
  });

  it('every bare CREATE TABLE has RLS enabled or is explicitly locked', () => {
    const all = readAllMigrations();
    const joined = all.map((m) => m.sql).join('\n');
    const lockedSql = all
      .filter((m) => m.sql.includes('REVOKE ALL ON TABLE'))
      .map((m) => m.sql)
      .join('\n');

    const bareTables = new Set<string>();
    for (const m of all) {
      const re =
        /CREATE\s+(TEMP\s+|TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)\s*\(/gi;
      let match: RegExpExecArray | null;
      while ((match = re.exec(m.sql)) !== null) {
        if (match[1]) continue;
        const name = match[2];
        if (!name || /^pg_/i.test(name)) continue;
        bareTables.add(name);
      }
    }
    expect(bareTables.size).toBeGreaterThan(0);
    for (const name of bareTables) {
      const hasRls = new RegExp(
        `ALTER\\s+TABLE\\s+(?:public\\.)?${name}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`,
        'i',
      ).test(joined);
      const isLocked = lockedSql.includes(name);
      expect(
        hasRls || isLocked,
        `table ${name} has neither ENABLE RLS nor explicit lock`,
      ).toBe(true);
    }
  });
});
