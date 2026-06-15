/**
 * Web-only database module.
 * Metro automatically uses this file on web instead of database.ts.
 *
 * Implements a session-scoped in-memory SQL engine with enough coverage for
 * the query patterns our repositories actually use:
 *   - INSERT … ON CONFLICT(id) DO UPDATE SET …  (upsert)
 *   - SELECT * / col-list FROM table [WHERE …] [ORDER BY …] [LIMIT n]
 *   - UPDATE table SET col = ?, … WHERE col = ?
 *   - DELETE FROM table WHERE col = ?
 *   - WHERE supports: col = ?, col IS NULL, col IS NOT NULL,
 *                     col IN (?, …), col LIKE ?
 *
 * Data is session-scoped — clears on page refresh, which is correct because
 * all real data arrives from Supabase sync after login.
 */
import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

// ── Types ─────────────────────────────────────────────────────────────────────
type Row = Record<string, unknown>;

interface Condition {
  col: string;
  op: "eq" | "is_null" | "is_not_null" | "in" | "like";
  val?: unknown;
  vals?: unknown[];
}

interface OrderClause {
  col: string;
  dir: "asc" | "desc";
}

// ── In-memory store ───────────────────────────────────────────────────────────
const store: Record<string, Row[]> = {};
let migrationsDone = false;

function tableRows(table: string): Row[] {
  if (!store[table]) store[table] = [];
  return store[table];
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

/**
 * Extract column names from the INSERT column list:
 *   INSERT INTO tbl (col1, col2, col3) VALUES …
 */
function parseInsertCols(sql: string): string[] | null {
  const m = sql.match(/INTO\s+\w+\s*\(([^)]+)\)\s*VALUES/i);
  if (!m) return null;
  return m[1].split(",").map((c) => c.trim().toLowerCase());
}

/**
 * Parse WHERE conditions from a SQL string.
 * paramOffset = how many ?-params appear before WHERE (e.g. SET params in UPDATE).
 */
function parseWhere(
  sql: string,
  params: unknown[],
  paramOffset: number
): Condition[] {
  // Grab everything between WHERE and ORDER BY / LIMIT / GROUP BY / end
  const whereMatch = sql.match(
    /WHERE\s+([\s\S]+?)(?:\s+ORDER\s+BY|\s+LIMIT|\s+GROUP\s+BY|;?\s*$)/i
  );
  if (!whereMatch) return [];

  const condStr = whereMatch[1].trim();
  const conditions: Condition[] = [];
  let idx = paramOffset;

  // Split by AND (simple — no OR / nested parens support needed)
  const parts = condStr.split(/\s+AND\s+/i);

  for (const part of parts) {
    const p = part.trim();

    // col IN (?, ?, ?)
    const inMatch = p.match(/^(\w+)\s+IN\s*\(([^)]+)\)/i);
    if (inMatch) {
      const col = inMatch[1].toLowerCase();
      const slots = (inMatch[2].match(/\?/g) ?? []).length;
      const vals = params.slice(idx, idx + slots);
      idx += slots;
      conditions.push({ col, op: "in", vals });
      continue;
    }

    // col LIKE ?
    const likeMatch = p.match(/^(\w+)\s+LIKE\s+\?$/i);
    if (likeMatch) {
      conditions.push({
        col: likeMatch[1].toLowerCase(),
        op: "like",
        val: params[idx++],
      });
      continue;
    }

    // col = ?
    const eqMatch = p.match(/^(\w+)\s*=\s*\?$/i);
    if (eqMatch) {
      conditions.push({
        col: eqMatch[1].toLowerCase(),
        op: "eq",
        val: params[idx++],
      });
      continue;
    }

    // col IS NULL
    const isNullMatch = p.match(/^(\w+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
      conditions.push({ col: isNullMatch[1].toLowerCase(), op: "is_null" });
      continue;
    }

    // col IS NOT NULL
    const isNotNullMatch = p.match(/^(\w+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
      conditions.push({ col: isNotNullMatch[1].toLowerCase(), op: "is_not_null" });
      continue;
    }
  }

  return conditions;
}

/** Evaluate a single row against a set of WHERE conditions. */
function rowMatches(row: Row, conditions: Condition[]): boolean {
  return conditions.every(({ col, op, val, vals }) => {
    switch (op) {
      case "eq":
        return row[col] === val;
      case "is_null":
        return row[col] == null;
      case "is_not_null":
        return row[col] != null;
      case "in":
        return (vals ?? []).includes(row[col]);
      case "like": {
        if (typeof val !== "string" || typeof row[col] !== "string") return false;
        // Convert SQL LIKE pattern to a JS regex: % → .*, _ → .
        const pattern = val
          .replace(/[.+^${}()|[\]\\]/g, "\\$&")
          .replace(/%/g, ".*")
          .replace(/_/g, ".");
        return new RegExp(`^${pattern}$`, "i").test(row[col] as string);
      }
      default:
        return true;
    }
  });
}

/** Parse ORDER BY col ASC/DESC, col2 ASC/DESC */
function parseOrderBy(sql: string): OrderClause[] {
  const m = sql.match(/ORDER\s+BY\s+([\s\S]+?)(?:\s+LIMIT|;?\s*$)/i);
  if (!m) return [];
  return m[1].split(",").map((part) => {
    const tokens = part.trim().split(/\s+/);
    const col = tokens[0].toLowerCase();
    const dir = (tokens[1] ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";
    return { col, dir };
  });
}

/** Parse LIMIT n */
function parseLimit(sql: string): number | null {
  const m = sql.match(/LIMIT\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Statement executors ───────────────────────────────────────────────────────

function execInsert(sql: string, params: unknown[]): Row[] {
  const tableMatch = sql.match(/INTO\s+(\w+)/i);
  if (!tableMatch) return [];
  const table = tableMatch[1].toLowerCase();

  const cols = parseInsertCols(sql);
  if (!cols || cols.length === 0) return [];

  // Build row from column list + params
  const row: Row = {};
  cols.forEach((col, i) => {
    row[col] = i < params.length ? params[i] : null;
  });

  const rows = tableRows(table);

  // ON CONFLICT(col) DO UPDATE SET …
  const conflictMatch = sql.match(
    /ON\s+CONFLICT\s*\((\w+)\)\s*DO\s+UPDATE\s+SET\s+([\s\S]+?)(?:;?\s*$)/i
  );
  if (conflictMatch) {
    const conflictCol = conflictMatch[1].toLowerCase();
    const conflictVal = row[conflictCol];
    const idx = rows.findIndex((r) => r[conflictCol] === conflictVal);

    if (idx >= 0) {
      // Apply each "col = excluded.col" assignment
      const assignments = conflictMatch[2].split(",").map((a) => a.trim());
      for (const assignment of assignments) {
        const m = assignment.match(/(\w+)\s*=\s*excluded\.(\w+)/i);
        if (m) {
          const targetCol = m[1].toLowerCase();
          const sourceCol = m[2].toLowerCase();
          rows[idx][targetCol] = row[sourceCol];
        }
      }
      return [];
    }
    // No conflict — fall through to push
  } else {
    // Plain INSERT (or INSERT OR REPLACE): upsert by id if present
    const id = row["id"];
    if (id !== undefined) {
      const idx = rows.findIndex((r) => r["id"] === id);
      if (idx >= 0) {
        rows[idx] = row;
        return [];
      }
    }
  }

  rows.push(row);
  return [];
}

function execSelect(sql: string, params: unknown[]): Row[] {
  // Skip JOIN queries — too complex; only called from export path which uses
  // the backend API on web anyway.
  if (/\bJOIN\b/i.test(sql)) return [];

  const fromMatch = sql.match(/FROM\s+(\w+)/i);
  if (!fromMatch) return [];
  const table = fromMatch[1].toLowerCase();

  // Column projection: extract what's between SELECT and FROM
  const colSection =
    sql.match(/^SELECT\s+([\s\S]+?)\s+FROM/i)?.[1].trim() ?? "*";
  const projectAll = colSection === "*";

  // Parse projected column specs (may include table.col AS alias or bare col)
  const projectedSpecs = projectAll
    ? null
    : colSection.split(",").map((c) => {
        const clean = c.trim();
        // table.col AS alias  OR  col AS alias  OR  col
        const m = clean.match(/(?:\w+\.)?(\w+)(?:\s+AS\s+(\w+))?/i);
        if (!m) return { src: clean, alias: clean };
        return { src: m[1].toLowerCase(), alias: (m[2] ?? m[1]).toLowerCase() };
      });

  const conditions = parseWhere(sql, params, 0);
  const orders = parseOrderBy(sql);
  const limit = parseLimit(sql);

  let rows = tableRows(table).filter((r) => rowMatches(r, conditions));

  // Sort
  if (orders.length > 0) {
    rows = rows.slice().sort((a, b) => {
      for (const { col, dir } of orders) {
        const av = a[col] ?? "";
        const bv = b[col] ?? "";
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }

  // Limit
  if (limit !== null) rows = rows.slice(0, limit);

  // Project columns
  if (!projectAll && projectedSpecs) {
    rows = rows.map((r) => {
      const proj: Row = {};
      for (const { src, alias } of projectedSpecs) {
        proj[alias] = r[src] ?? null;
      }
      return proj;
    });
  }

  return rows;
}

function execUpdate(sql: string, params: unknown[]): Row[] {
  const tableMatch = sql.match(/^UPDATE\s+(\w+)\s+SET/i);
  if (!tableMatch) return [];
  const table = tableMatch[1].toLowerCase();

  // Extract SET clause (between SET and WHERE)
  const setMatch = sql.match(/SET\s+([\s\S]+?)\s+WHERE/i);
  if (!setMatch) return [];

  const setCols: string[] = [];
  for (const part of setMatch[1].split(",")) {
    const m = part.trim().match(/(\w+)\s*=\s*\?/i);
    if (m) setCols.push(m[1].toLowerCase());
  }

  const conditions = parseWhere(sql, params, setCols.length);
  const rows = tableRows(table);

  rows.forEach((row, i) => {
    if (!rowMatches(row, conditions)) return;
    const updated = { ...row };
    setCols.forEach((col, j) => {
      updated[col] = params[j];
    });
    rows[i] = updated;
  });

  return [];
}

function execDelete(sql: string, params: unknown[]): Row[] {
  const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
  if (!tableMatch) return [];
  const table = tableMatch[1].toLowerCase();

  const conditions = parseWhere(sql, params, 0);
  store[table] = tableRows(table).filter((r) => !rowMatches(r, conditions));
  return [];
}

// ── Main dispatcher ───────────────────────────────────────────────────────────
function execStatement(sql: string, params: unknown[] = []): Row[] {
  // Normalise whitespace to simplify regex matching
  const trimmed = sql.trim().replace(/\s+/g, " ");
  const upper = trimmed.toUpperCase();

  // DDL + PRAGMA — no-op
  if (
    upper.startsWith("CREATE ") ||
    upper.startsWith("PRAGMA ") ||
    upper.startsWith("DROP ")
  ) {
    return [];
  }

  if (upper.startsWith("INSERT ")) return execInsert(trimmed, params);
  if (upper.startsWith("SELECT ")) return execSelect(trimmed, params);
  if (upper.startsWith("UPDATE ")) return execUpdate(trimmed, params);
  if (upper.startsWith("DELETE ")) return execDelete(trimmed, params);

  return [];
}

// ── Database adapter ──────────────────────────────────────────────────────────
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

// ── Public API ────────────────────────────────────────────────────────────────
export function getDatabase() {
  return Promise.resolve(webDb as any);
}

export async function wipeLocalDatabase(): Promise<void> {
  Object.keys(store).forEach((k) => {
    store[k] = [];
  });
  migrationsDone = false;
}

export async function initializeLocalDatabase(): Promise<void> {
  if (migrationsDone) return;
  migrationsDone = true;

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

  console.log(
    "[db] Web mode: in-memory store ready. Data populates from Supabase after login."
  );
}
