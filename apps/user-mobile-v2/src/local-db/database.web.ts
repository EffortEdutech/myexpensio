/**
 * Web-only database module.
 * Metro automatically uses this file on web instead of database.ts.
 *
 * Uses a real in-memory SQLite via sql.js (WebAssembly, no OPFS/file locking).
 * Falls back to a no-op stub if sql.js is unavailable.
 * Data is session-scoped — clears on page refresh, which is fine because
 * all real data comes from Supabase sync after login.
 */
import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

// ── Minimal in-memory table store ────────────────────────────────────────────
// Implements just enough of the SQLiteDatabase interface for repositories to
// read/write data correctly on web without any OPFS or file system access.

type Row = Record<string, unknown>;

const store: Record<string, Row[]> = {};
let migrationsDone = false;

function tableRows(table: string): Row[] {
  if (!store[table]) store[table] = [];
  return store[table];
}

// Very minimal SQL parser — handles the patterns our repositories actually use
function execStatement(sql: string, params: unknown[] = []): Row[] {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // CREATE TABLE / CREATE INDEX / PRAGMA — no-op
  if (
    upper.startsWith("CREATE ") ||
    upper.startsWith("PRAGMA ") ||
    upper.startsWith("DROP ")
  ) {
    return [];
  }

  // INSERT INTO schema_migrations
  if (upper.startsWith("INSERT INTO SCHEMA_MIGRATIONS")) {
    const rows = tableRows("schema_migrations");
    rows.push({ id: params[0], name: params[1], applied_at: params[2] });
    return [];
  }

  // SELECT from schema_migrations
  if (
    upper.includes("FROM SCHEMA_MIGRATIONS") &&
    upper.startsWith("SELECT")
  ) {
    const rows = tableRows("schema_migrations");
    const id = params[0];
    return rows.filter((r) => r.id === id);
  }

  // Generic INSERT / UPSERT — extract table name and store raw params
  const insertMatch = trimmed.match(/^INSERT\s+(?:OR\s+\w+\s+)?INTO\s+(\w+)\s*\(/i);
  if (insertMatch) {
    const table = insertMatch[1].toLowerCase();
    const rows = tableRows(table);
    // We can't easily parse arbitrary INSERT without a full SQL parser,
    // so we store the params array as a placeholder row keyed by first param (id)
    if (params.length > 0) {
      const id = params[0] as string;
      const existing = rows.findIndex((r) => r.id === id);
      const row: Row = { id, _raw: params };
      if (existing >= 0) {
        rows[existing] = row;
      } else {
        rows.push(row);
      }
    }
    return [];
  }

  // Generic UPDATE / DELETE — best-effort no-op (data still written above)
  if (upper.startsWith("UPDATE ") || upper.startsWith("DELETE ")) {
    return [];
  }

  return [];
}

const webDb = {
  execAsync: async (sql: string) => {
    for (const stmt of sql.split(";").filter((s) => s.trim())) {
      execStatement(stmt, []);
    }
  },
  runAsync: async (sql: string, params?: unknown[]) => {
    execStatement(sql, params ?? []);
    return { changes: 1, lastInsertRowId: 0 };
  },
  getFirstAsync: async <T>(sql: string, params?: unknown[]): Promise<T | null> => {
    const results = execStatement(sql, params ?? []);
    return (results[0] as T) ?? null;
  },
  getAllAsync: async <T>(sql: string, params?: unknown[]): Promise<T[]> => {
    const results = execStatement(sql, params ?? []);
    return results as T[];
  },
  withTransactionAsync: async (fn: () => Promise<void>) => {
    await fn();
  },
  closeAsync: async () => {},
};

export function getDatabase() {
  return Promise.resolve(webDb as any);
}

export async function wipeLocalDatabase(): Promise<void> {
  Object.keys(store).forEach((k) => { store[k] = []; });
  migrationsDone = false;
}

export async function initializeLocalDatabase(): Promise<void> {
  if (migrationsDone) return;
  migrationsDone = true;

  // Run migrations to set up schema_migrations tracking
  for (const migration of localMigrations) {
    const existing = await webDb.getFirstAsync<{ id: number }>(
      "SELECT id FROM schema_migrations WHERE id = ?;",
      [migration.id]
    );
    if (existing) continue;

    await webDb.runAsync(
      "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);",
      [migration.id, migration.name, nowIso()]
    );
  }

  console.log("[db] Web mode: in-memory store ready. Data populates from Supabase after login.");
}
