import {
  listPendingSyncItems,
  listPendingSyncItemsForEntityIds,
  markSyncItemFailed,
  markSyncItemSynced,
  markSyncItemsSyncing
} from "@/local-db/repositories/syncQueueRepository";
import type { PushSyncRequest, PushSyncResponse } from "@/sync/syncApi";
import { nowIso } from "@/utils/time";

type PushPendingSyncOptions = {
  deviceId: string;
  entityIds?: string[];
  limit?: number;
  push: (request: PushSyncRequest) => Promise<PushSyncResponse>;
};

export type PushPendingSyncResult = {
  accepted: number;
  failed: number;
  pushed: number;
  rejected: number;
};

export async function pushPendingSyncItems({
  deviceId,
  entityIds,
  limit = 25,
  push
}: PushPendingSyncOptions): Promise<PushPendingSyncResult> {
  const pendingItems = entityIds
    ? await listPendingSyncItemsForEntityIds(entityIds, limit)
    : await listPendingSyncItems(limit);

  if (pendingItems.length === 0) {
    return {
      accepted: 0,
      failed: 0,
      pushed: 0,
      rejected: 0
    };
  }

  await markSyncItemsSyncing(pendingItems.map((item) => item.id));

  try {
    const response = await push({
      client_time: nowIso(),
      device_id: deviceId,
      items: pendingItems.map((item) => ({
        client_updated_at: item.updatedAt,
        entity_id: item.entityId,
        entity_type: item.entityType,
        operation: item.operation,
        payload: parsePayload(item.payload),
        queue_id: item.id
      }))
    });

    for (const acceptedItem of response.accepted) {
      await markSyncItemSynced(acceptedItem.queue_id);
    }

    for (const rejectedItem of response.rejected) {
      await markSyncItemFailed(
        rejectedItem.queue_id,
        `${rejectedItem.code}: ${rejectedItem.message}`
      );
    }

    const handledIds = new Set([
      ...response.accepted.map((item) => item.queue_id),
      ...response.rejected.map((item) => item.queue_id)
    ]);
    const unhandledItems = pendingItems.filter((item) => !handledIds.has(item.id));

    for (const item of unhandledItems) {
      await markSyncItemFailed(item.id, "Sync response did not include item.");
    }

    return {
      accepted: response.accepted.length,
      failed: unhandledItems.length,
      pushed: pendingItems.length,
      rejected: response.rejected.length
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Sync push failed.";

    for (const item of pendingItems) {
      await markSyncItemFailed(item.id, errorMessage);
    }

    return {
      accepted: 0,
      failed: pendingItems.length,
      pushed: pendingItems.length,
      rejected: 0
    };
  }
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return payload;
  }
}

