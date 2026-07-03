/**
 * Web-only override for syncQueueRepository.
 * Metro automatically resolves this file on web instead of syncQueueRepository.ts.
 *
 * Identical SQL to the native version (runs against the in-memory DB via getDatabase),
 * with one critical addition: the pending queue is mirrored to localStorage so that
 * items survive a page close before the push cycle runs.
 *
 * On next page load, call `rehydrateFromLocalStorage()` (invoked by useSyncEngine
 * in its startup effect) to drain saved items back into the in-memory DB before push.
 */
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

// ── localStorage helpers ──────────────────────────────────────────────────────

const QUEUE_STORAGE_KEY = "myexpensio:pending_sync_queue";

type StoredQueueItem = {
  id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: string;
  created_at: string;
  updated_at: string;
};

function readStoredQueue(): StoredQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredQueueItem[]) : [];
  } catch {
    return [];
  }
}

function writeStoredQueue(items: StoredQueueItem[]): void {
  try {
    if (items.length === 0) {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } else {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    // Silently fail — sync will retry next session
  }
}

/** Add or update an item in the localStorage mirror */
function upsertStoredItem(item: StoredQueueItem): void {
  const existing = readStoredQueue();
  const idx = existing.findIndex((e) => e.id === item.id);
  if (idx >= 0) {
    existing[idx] = item;
  } else {
    existing.push(item);
  }
  writeStoredQueue(existing);
}

/** Remove an item from the localStorage mirror (it was synced or permanently failed) */
function removeStoredItem(queueId: string): void {
  const existing = readStoredQueue().filter((e) => e.id !== queueId);
  writeStoredQueue(existing);
}

// ── Row type (matches native version) ────────────────────────────────────────

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

// ── Public API (same shape as native syncQueueRepository.ts) ─────────────────

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

  // Mirror to localStorage so this item survives a page close
  upsertStoredItem({
    id: item.id,
    entity_type: item.entityType,
    entity_id: item.entityId,
    operation: item.operation,
    payload: item.payload,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  });

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
  // NOTE: computed in JS rather than "WHERE retry_count >= ?" — the web mock SQL
  // engine (database.web.ts) only supports =, IS [NOT] NULL, IN, LIKE in WHERE
  // clauses, not >=, so we fetch failed rows with the supported `=` filter and
  // filter/count client-side instead of relying on unsupported SQL syntax.
  const failedRows = await database.getAllAsync<{ retry_count: number }>(
    `SELECT retry_count FROM sync_queue WHERE sync_status = 'failed';`
  );
  const deadLetterCount = failedRows.filter(
    (row) => row.retry_count >= SYNC_MAX_RETRIES
  ).length;

  return {
    failed: rows.find((row) => row.sync_status === "failed")?.total ?? 0,
    pending: rows.find((row) => row.sync_status === "pending")?.total ?? 0,
    synced: rows.find((row) => row.sync_status === "synced")?.total ?? 0,
    syncing: rows.find((row) => row.sync_status === "syncing")?.total ?? 0,
    /** Failed items that have exhausted SYNC_MAX_RETRIES — need manual attention,
     *  will not be touched by retryFailedSyncItems(). */
    deadLetter: deadLetterCount
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
  // Items still in localStorage during syncing — will be removed on synced/failed
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

  // Remove from localStorage — safely pushed to server
  removeStoredItem(queueId);
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

  // Keep in localStorage on failure — retry it next session
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

// ── Web-only: rehydrate from localStorage ─────────────────────────────────────

/**
 * Called by useSyncEngine on web BEFORE the first push cycle.
 * Reads any items that survived a page close from localStorage and inserts them
 * into the in-memory DB so they're picked up by the normal push mechanism.
 *
 * Items already present in the DB (same id) are skipped silently.
 */
export async function rehydrateFromLocalStorage(): Promise<number> {
  const stored = readStoredQueue();
  if (stored.length === 0) return 0;

  const database = await getDatabase();
  const now = nowIso();
  let restored = 0;

  for (const item of stored) {
    try {
      // Check if already in the DB (e.g. from a previous rehydration this session)
      const existing = await database.getFirstAsync<{ id: string }>(
        "SELECT id FROM sync_queue WHERE id = ?;",
        [item.id]
      );
      if (existing) continue;

      await database.runAsync(
        `INSERT INTO sync_queue (
          id, entity_type, entity_id, operation, payload,
          sync_status, retry_count, created_at, updated_at, last_error
        ) VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, NULL);`,
        [
          item.id,
          item.entity_type,
          item.entity_id,
          item.operation,
          item.payload,
          item.created_at,
          now
        ]
      );
      restored++;
    } catch {
      // Skip malformed items
    }
  }

  if (restored > 0) {
    console.log(`[sync-web] Rehydrated ${restored} pending item(s) from localStorage.`);
  }

  return restored;
}

// ── Mapper ────────────────────────────────────────────────────────────────────

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
