export type SyncEntityType =
  | "claim"
  | "claim_item"
  | "expense"
  | "receipt"
  | "sync_state";

export type SyncOperation = "create" | "update" | "delete";

export type SyncQueueStatus = "pending" | "syncing" | "synced" | "failed";

export type SyncQueueItem = {
  id: string;
  entityType: SyncEntityType;
  entityId: string;
  operation: SyncOperation;
  payload: string;
  syncStatus: SyncQueueStatus;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
};

