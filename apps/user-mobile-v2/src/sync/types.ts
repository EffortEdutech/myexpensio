export type SyncEntityType =
  | "claim"
  | "claim_item"
  | "commitment"
  | "commitment_payment"
  | "expense"
  | "export_job"
  | "ledger_entry"
  | "receipt"
  | "sync_state"
  | "tng_statement_batch"
  | "tng_transaction"
  | "trip";

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

export type PushSyncItem = {
  queue_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  payload: unknown;
  client_updated_at: string;
};
