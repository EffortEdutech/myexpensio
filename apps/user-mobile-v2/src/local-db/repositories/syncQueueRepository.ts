import type * as SQLite from "expo-sqlite";

import { getDatabase } from "@/local-db/database";
import type {
  SyncEntityType,
  SyncOperation,
  SyncQueueItem,
  SyncQueueStatus
} from "@/sync/types";
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

