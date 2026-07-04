import type * as SQLite from "expo-sqlite";

import { getDatabase } from "@/local-db/database";
import type {
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
  SyncQueueStatus
} from "@/sync/types";
import { SYNC_MAX_RETRIES } from "@/sync/syncConfig";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type SyncQueueRow = {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: string;
  sync_status: SyncQueueStatus;
  retry_count: number;
  created_at: string;
  updated_at: string;
  last_error: string | null;
};

type EnqueueSyncItemInput = {
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string;
};

export async function enqueueSyncItem(
  input: EnqueueSyncItemInput,
  existingDatabase?: SQLite.SQLiteDatabase
) {
  const database = existingDatabase ?? (await getDatabase());
  const timestamp = nowIso();
  const item: SyncQueueItem = {
    id: createId("sync"),
    entityType: input.entityType,
    entityId: input.entityId,
    operation: input.operation,
    payload: input.payload,
    syncStatus: "pending",
    retryCount: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastError: null
  };

  await database.runAsync(
    `INSERT INTO sync_queue (
      id,
      entity_type,
      entity_id,
      operation,
      payload,
      sync_status,
      retry_count,
      created_at,
      updated_at,
      last_error
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      item.id,
      item.entityType,
      item.entityId,
      item.operation,
      item.payload,
      item.syncStatus,
      item.retryCount,
      item.createdAt,
      item.updatedAt,
      item.lastError
    ]
  );

  return item;
}

export async function listPendingSyncItems(limit = 25) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SyncQueueRow>(
    `SELECT *
      FROM sync_queue
      WHERE sync_status = 'pending'
      ORDER BY created_at ASC
      LIMIT ?;`,
    [limit]
  );

  return rows.map(mapSyncQueueRow);
}

export async function listPendingSyncItemsForEntityIds(
  entityIds: string[],
  limit = 25
) {
  if (entityIds.length === 0) {
    return [];
  }

  const database = await getDatabase();
  const placeholders = entityIds.map(() => "?").join(", ");
  const rows = await database.getAllAsync<SyncQueueRow>(
    `SELECT *
      FROM sync_queue
      WHERE sync_status = 'pending'
        AND entity_id IN (${placeholders})
      ORDER BY created_at ASC
      LIMIT ?;`,
    [...entityIds, limit]
  );

  return rows.map(mapSyncQueueRow);
}

export async function listFailedSyncItems(limit = 25) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SyncQueueRow>(
    `SELECT *
      FROM sync_queue
      WHERE sync_status = 'failed'
      ORDER BY updated_at ASC
      LIMIT ?;`,
    [limit]
  );

  return rows.map(mapSyncQueueRow);
}

export async function getSyncQueueSummary() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    sync_status: SyncQueueStatus;
    total: number;
  }>(
    `SELECT sync_status, COUNT(*) AS total
      FROM sync_queue
      GROUP BY sync_status;`
  );

  // Dead-lettered items are a subset of "failed" — permanently stuck (retry_count
  // has hit SYNC_MAX_RETRIES) and excluded from retryFailedSyncItems() below.
  const deadLetterRow = await database.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) AS total
      FROM sync_queue
      WHERE sync_status = 'failed' AND retry_count >= ?;`,
    [SYNC_MAX_RETRIES]
  );

  return {
    failed: rows.find((row) => row.sync_status === "failed")?.total ?? 0,
    pending: rows.find((row) => row.sync_status === "pending")?.total ?? 0,
    synced: rows.find((row) => row.sync_status === "synced")?.total ?? 0,
    syncing: rows.find((row) => row.sync_status === "syncing")?.total ?? 0,
    /** Failed items that have exhausted SYNC_MAX_RETRIES — need manual attention,
     *  will not be touched by retryFailedSyncItems(). */
    deadLetter: deadLetterRow?.total ?? 0
  };
}

export async function markSyncItemsSyncing(queueIds: string[]) {
  if (queueIds.length === 0) {
    return;
  }

  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    for (const queueId of queueIds) {
      await database.runAsync(
        `UPDATE sync_queue
          SET sync_status = 'syncing',
              updated_at = ?,
              last_error = NULL
          WHERE id = ?;`,
        [timestamp, queueId]
      );
    }
  });
}

export async function markSyncItemSynced(queueId: string) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE sync_queue
      SET sync_status = 'synced',
          updated_at = ?,
          last_error = NULL
      WHERE id = ?;`,
    [nowIso(), queueId]
  );
}

export async function markSyncItemFailed(queueId: string, errorMessage: string) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE sync_queue
      SET sync_status = 'failed',
          retry_count = retry_count + 1,
          updated_at = ?,
          last_error = ?
      WHERE id = ?;`,
    [nowIso(), errorMessage, queueId]
  );
}

/**
 * Resets FAILED items back to PENDING so the next push cycle retries them.
 *
 * Items that have already hit SYNC_MAX_RETRIES are intentionally skipped —
 * they stay in `failed` as a dead letter (surfaced separately via
 * getSyncQueueSummary().deadLetter) instead of retrying forever. Without this
 * guard a permanently-malformed item (e.g. a bad payload) would resurrect on
 * every retry attempt indefinitely.
 */
export async function retryFailedSyncItems(limit = 25) {
  const failedItems = (await listFailedSyncItems(limit)).filter(
    (item) => item.retryCount < SYNC_MAX_RETRIES
  );
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    for (const item of failedItems) {
      await database.runAsync(
        `UPDATE sync_queue
          SET sync_status = 'pending',
              updated_at = ?,
              last_error = NULL
          WHERE id = ?;`,
        [timestamp, item.id]
      );
    }
  });

  return failedItems.length;
}

/**
 * Lists dead-lettered items only — failed items that have exhausted
 * SYNC_MAX_RETRIES and will never be picked up by retryFailedSyncItems().
 * Used by the Dead Letter Recovery UI so the user can see exactly what's stuck.
 */
export async function listDeadLetterItems(limit = 50) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<SyncQueueRow>(
    `SELECT *
      FROM sync_queue
      WHERE sync_status = 'failed' AND retry_count >= ?
      ORDER BY updated_at DESC
      LIMIT ?;`,
    [SYNC_MAX_RETRIES, limit]
  );

  return rows.map(mapSyncQueueRow);
}

/**
 * Forces a single dead-letter item back to 'pending' with retry_count reset to 0,
 * bypassing the SYNC_MAX_RETRIES guard that retryFailedSyncItems() respects. This
 * is only called from an explicit user action in the Dead Letter Recovery UI — the
 * user has seen the error and chosen to try again, so resetting the counter here
 * does not reintroduce the "retries forever automatically" problem the cap exists
 * to prevent.
 */
export async function retryDeadLetterItem(queueId: string) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE sync_queue
      SET sync_status = 'pending',
          retry_count = 0,
          updated_at = ?,
          last_error = NULL
      WHERE id = ?;`,
    [nowIso(), queueId]
  );
}

/**
 * Permanently removes a queued mutation the user has chosen to give up on.
 * Only deletes the sync_queue row — the underlying entity (claim/item/etc.) in
 * local SQLite is untouched, so the user's local data still reflects their last
 * edit, it just will never be pushed to the server.
 */
export async function discardSyncItem(queueId: string) {
  const database = await getDatabase();

  await database.runAsync(`DELETE FROM sync_queue WHERE id = ?;`, [queueId]);
}

function mapSyncQueueRow(row: SyncQueueRow): SyncQueueItem {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    operation: row.operation,
    payload: row.payload,
    syncStatus: row.sync_status,
    retryCount: row.retry_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastError: row.last_error
  };
}

/**
 * No-op on native — data lives in SQLite and survives app restarts.
 * Web override in syncQueueRepository.web.ts provides the real implementation.
 */
export async function rehydrateFromLocalStorage(): Promise<number> {
  return 0;
}

