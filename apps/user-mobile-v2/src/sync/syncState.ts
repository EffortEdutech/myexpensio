export type SyncState = {
  scope: string;
  cursor: string | null;
  lastSyncedAt: string | null;
  updatedAt: string;
};

