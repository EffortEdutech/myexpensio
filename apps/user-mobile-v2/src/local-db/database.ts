import * as SQLite from "expo-sqlite";

import { schemaStatements } from "@/local-db/schema";

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

  for (const statement of schemaStatements) {
    await database.execAsync(statement);
  }
}

