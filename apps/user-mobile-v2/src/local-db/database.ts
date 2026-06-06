import * as SQLite from "expo-sqlite";
import { Platform } from "react-native";

import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

// On web, use an in-memory database to avoid OPFS locking issues in the browser.
// Real persistence comes from Supabase sync. Web is development-only.
// On native (iOS/Android), use a named file so data survives app restarts.
const databaseName = Platform.OS === "web" ? ":memory:" : "myexpensio-mobile-v2.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(databaseName);
  return databasePromise;
}

/**
 * Wipes all user financial data from the local SQLite database.
 * Called on sign-out to protect data on lost/stolen devices.
 * Preserves the schema_migrations table so re-login does not re-run migrations.
 */
export async function wipeLocalDatabase(): Promise<void> {
  const db = await getDatabase();

  const userDataTables = [
    "claims",
    "claim_items",
    "trips",
    "receipts",
    "tng_transactions",
    "tng_statement_batches",
    "ledger_entries",
    "commitments",
    "commitment_payments",
    "expenses",
    "export_jobs",
    "sync_queue",
    "sync_state",
    "spaces",
    "profiles_cache",
    "subscriptions_cache",
    "rate_versions_cache",
    "usage_counters_cache",
    "routes_cache",
  ];

  await db.withTransactionAsync(async () => {
    for (const table of userDataTables) {
      await db.execAsync(`DELETE FROM ${table};`).catch(() => {
        // Table may not exist in this schema version — safe to skip
      });
    }
  });

  // Reset database promise so the next login reinitialises cleanly
  databasePromise = null;
}

export async function initializeLocalDatabase() {
  const database = await getDatabase();

  await database.execAsync("PRAGMA journal_mode = WAL;");
  await database.execAsync("PRAGMA foreign_keys = ON;");
  await database.execAsync(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    applied_at TEXT NOT NULL
  );`);

  for (const migration of localMigrations) {
    const existing = await database.getFirstAsync<{ id: number }>(
      "SELECT id FROM schema_migrations WHERE id = ?;",
      [migration.id]
    );

    if (existing) {
      continue;
    }

    await database.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await database.execAsync(statement);
      }

      await database.runAsync(
        "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?);",
        [migration.id, migration.name, nowIso()]
      );
    });
  }
}
