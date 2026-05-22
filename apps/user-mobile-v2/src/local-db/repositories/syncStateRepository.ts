import { getDatabase } from "@/local-db/database";
import type { SyncState } from "@/sync/syncState";
import { nowIso } from "@/utils/time";

type SyncStateRow = {
  scope: string;
  cursor: string | null;
  last_synced_at: string | null;
  updated_at: string;
};

export async function getSyncState(scope: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SyncStateRow>(
    "SELECT * FROM sync_state WHERE scope = ?;",
    [scope]
  );

  return row ? mapSyncStateRow(row) : null;
}

export async function upsertSyncState(
  scope: string,
  cursor: string | null,
  lastSyncedAt: string | null
) {
  const database = await getDatabase();
  const updatedAt = nowIso();

  await database.runAsync(
    `INSERT INTO sync_state (scope, cursor, last_synced_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(scope) DO UPDATE SET
        cursor = excluded.cursor,
        last_synced_at = excluded.last_synced_at,
        updated_at = excluded.updated_at;`,
    [scope, cursor, lastSyncedAt, updatedAt]
  );

  return {
    scope,
    cursor,
    lastSyncedAt,
    updatedAt
  };
}

function mapSyncStateRow(row: SyncStateRow): SyncState {
  return {
    scope: row.scope,
    cursor: row.cursor,
    lastSyncedAt: row.last_synced_at,
    updatedAt: row.updated_at
  };
}

