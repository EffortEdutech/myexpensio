import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type { LedgerEntry, CreateLedgerEntryInput, SpaceType, LedgerEntryType } from "@/features/personal/types";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type LedgerRow = {
  id: string;
  space_type: string;
  entry_type: string;
  amount_cents: number;
  currency: string;
  entry_date: string;
  category: string;
  description: string | null;
  is_tax_deductible: number;
  tax_category: string | null;
  payment_method: string | null;
  income_source: string | null;
  receipt_path: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

function rowToEntry(row: LedgerRow): LedgerEntry {
  return {
    id: row.id,
    spaceType: row.space_type as SpaceType,
    entryType: row.entry_type as LedgerEntryType,
    amountCents: row.amount_cents,
    currency: row.currency,
    entryDate: row.entry_date,
    category: row.category,
    description: row.description,
    isTaxDeductible: row.is_tax_deductible === 1,
    taxCategory: row.tax_category,
    paymentMethod: row.payment_method,
    incomeSource: row.income_source,
    receiptPath: row.receipt_path,
    syncStatus: row.sync_status as LedgerEntry["syncStatus"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id,
  };
}

export async function listLedgerEntries(
  spaceType: SpaceType,
  month: number,
  year: number,
  entryType?: LedgerEntryType
): Promise<LedgerEntry[]> {
  const db = await getDatabase();
  const monthStr = String(month).padStart(2, "0");
  const prefix = `${year}-${monthStr}`;

  if (entryType) {
    const rows = await db.getAllAsync<LedgerRow>(
      `SELECT * FROM ledger_entries
        WHERE space_type = ? AND entry_type = ? AND entry_date LIKE ? AND deleted_at IS NULL
        ORDER BY entry_date DESC, created_at DESC`,
      [spaceType, entryType, `${prefix}%`]
    );
    return rows.map(rowToEntry);
  }

  const rows = await db.getAllAsync<LedgerRow>(
    `SELECT * FROM ledger_entries
      WHERE space_type = ? AND entry_date LIKE ? AND deleted_at IS NULL
      ORDER BY entry_date DESC, created_at DESC`,
    [spaceType, `${prefix}%`]
  );
  return rows.map(rowToEntry);
}

export async function listLedgerEntriesForYear(
  spaceType: SpaceType,
  year: number
): Promise<LedgerEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<LedgerRow>(
    `SELECT * FROM ledger_entries
      WHERE space_type = ? AND entry_date LIKE ? AND deleted_at IS NULL
      ORDER BY entry_date DESC`,
    [spaceType, `${year}%`]
  );
  return rows.map(rowToEntry);
}

export async function createLedgerEntry(
  input: CreateLedgerEntryInput,
  deviceId: string
): Promise<LedgerEntry> {
  const db = await getDatabase();
  const id = createId("ledger");
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO ledger_entries
      (id, space_type, entry_type, amount_cents, currency, entry_date, category,
       description, is_tax_deductible, tax_category, payment_method, income_source,
       receipt_path, sync_status, created_at, updated_at, deleted_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, ?)`,
    [
      id,
      input.spaceType,
      input.entryType,
      input.amountCents,
      input.currency ?? "MYR",
      input.entryDate,
      input.category,
      input.description ?? null,
      input.isTaxDeductible ? 1 : 0,
      input.taxCategory ?? null,
      input.paymentMethod ?? null,
      input.incomeSource ?? null,
      input.receiptPath ?? null,
      now,
      now,
      deviceId,
    ]
  );

  await enqueueSyncItem({
    entityType: "ledger_entry",
    entityId: id,
    operation: "create",
    payload: JSON.stringify({ id, ...input }),
  });

  const row = await db.getFirstAsync<LedgerRow>(
    `SELECT * FROM ledger_entries WHERE id = ?`,
    [id]
  );
  return rowToEntry(row!);
}

export type UpdateLedgerEntryInput = Partial<Omit<CreateLedgerEntryInput, "spaceType" | "entryType">> & { id: string };

export async function updateLedgerEntry(input: UpdateLedgerEntryInput): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (input.amountCents !== undefined) { fields.push("amount_cents = ?"); values.push(input.amountCents); }
  if (input.entryDate !== undefined)   { fields.push("entry_date = ?");   values.push(input.entryDate); }
  if (input.category !== undefined)    { fields.push("category = ?");     values.push(input.category); }
  if (input.description !== undefined) { fields.push("description = ?");  values.push(input.description ?? null); }
  if (input.isTaxDeductible !== undefined) { fields.push("is_tax_deductible = ?"); values.push(input.isTaxDeductible ? 1 : 0); }
  if (input.taxCategory !== undefined) { fields.push("tax_category = ?");  values.push(input.taxCategory ?? null); }
  if (input.paymentMethod !== undefined) { fields.push("payment_method = ?"); values.push(input.paymentMethod ?? null); }
  if (input.incomeSource !== undefined)  { fields.push("income_source = ?");  values.push(input.incomeSource ?? null); }
  if (input.receiptPath !== undefined)   { fields.push("receipt_path = ?");   values.push(input.receiptPath ?? null); }

  if (fields.length === 0) return;
  fields.push("updated_at = ?", "sync_status = 'pending'");
  values.push(now, input.id);

  await db.runAsync(
    `UPDATE ledger_entries SET ${fields.join(", ")} WHERE id = ?`,
    values as (string | number | null)[]
  );
  await enqueueSyncItem({
    entityType: "ledger_entry",
    entityId: input.id,
    operation: "update",
    payload: JSON.stringify(input),
  });
}

export async function deleteLedgerEntry(id: string): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();
  await db.runAsync(
    `UPDATE ledger_entries SET deleted_at = ?, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
    [now, now, id]
  );
  await enqueueSyncItem({
    entityType: "ledger_entry",
    entityId: id,
    operation: "delete",
    payload: JSON.stringify({ id }),
  });
}
