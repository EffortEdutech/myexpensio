import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type {
  CreateExpenseDraftInput,
  ExpenseDraft,
  SyncStatus
} from "@/features/expenses/types";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type ExpenseRow = {
  id: string;
  merchant_name: string;
  amount_cents: number;
  currency: string;
  expense_date: string;
  notes: string | null;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

export async function listExpenseDrafts() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ExpenseRow>(
    `SELECT *
      FROM expenses
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC;`
  );

  return rows.map(mapExpenseRow);
}

export async function createExpenseDraft(
  input: CreateExpenseDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const draft: ExpenseDraft = {
    id: createId("expense"),
    merchantName: input.merchantName,
    amountCents: input.amountCents,
    currency: input.currency,
    expenseDate: input.expenseDate,
    notes: input.notes ?? null,
    syncStatus: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    deviceId
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO expenses (
        id,
        merchant_name,
        amount_cents,
        currency,
        expense_date,
        notes,
        sync_status,
        created_at,
        updated_at,
        deleted_at,
        device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        draft.id,
        draft.merchantName,
        draft.amountCents,
        draft.currency,
        draft.expenseDate,
        draft.notes,
        draft.syncStatus,
        draft.createdAt,
        draft.updatedAt,
        draft.deletedAt,
        draft.deviceId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "expense",
        entityId: draft.id,
        operation: "create",
        payload: JSON.stringify(draft)
      },
      database
    );
  });

  return draft;
}

function mapExpenseRow(row: ExpenseRow): ExpenseDraft {
  return {
    id: row.id,
    merchantName: row.merchant_name,
    amountCents: row.amount_cents,
    currency: row.currency,
    expenseDate: row.expense_date,
    notes: row.notes,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id
  };
}

