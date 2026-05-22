export type SyncStatus = "pending" | "syncing" | "synced" | "failed" | "deleted";

export type ExpenseDraft = {
  id: string;
  merchantName: string;
  amountCents: number;
  currency: string;
  expenseDate: string;
  notes: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type CreateExpenseDraftInput = {
  merchantName: string;
  amountCents: number;
  currency: string;
  expenseDate: string;
  notes?: string | null;
};

