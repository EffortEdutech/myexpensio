import * as SQLite from "expo-sqlite";

import { localMigrations } from "@/local-db/migrations";
import { nowIso } from "@/utils/time";

const databaseName = "myexpensio-mobile-v2.db";

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDatabase() {
  databasePromise ??= SQLite.openDatabaseAsync(databaseName);

  return databasePromise;
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

