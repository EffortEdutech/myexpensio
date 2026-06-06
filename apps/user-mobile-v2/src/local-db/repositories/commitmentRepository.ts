import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type {
  Commitment,
  CommitmentPayment,
  CreateCommitmentInput,
  PaymentStatus,
  UpdatePaymentInput,
} from "@/features/personal/types";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

// ── Row types ─────────────────────────────────────────────────────────────────

type CommitmentRow = {
  id: string;
  name: string;
  amount_cents: number;
  currency: string;
  category: string;
  due_day: number;
  start_date: string;
  end_date: string | null;
  is_active: number;
  notes: string | null;
  is_tax_relief: number;
  tax_category: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

type PaymentRow = {
  id: string;
  commitment_id: string;
  year: number;
  month: number;
  due_date: string;
  expected_amount_cents: number;
  status: string;
  paid_date: string | null;
  paid_amount_cents: number | null;
  notes: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
  device_id: string;
};

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToCommitment(row: CommitmentRow): Commitment {
  return {
    id: row.id,
    name: row.name,
    amountCents: row.amount_cents,
    currency: row.currency,
    category: row.category,
    dueDay: row.due_day,
    startDate: row.start_date,
    endDate: row.end_date,
    isActive: row.is_active === 1,
    notes: row.notes,
    isTaxRelief: row.is_tax_relief === 1,
    taxCategory: row.tax_category,
    syncStatus: row.sync_status as Commitment["syncStatus"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id,
  };
}

function rowToPayment(row: PaymentRow): CommitmentPayment {
  return {
    id: row.id,
    commitmentId: row.commitment_id,
    year: row.year,
    month: row.month,
    dueDate: row.due_date,
    expectedAmountCents: row.expected_amount_cents,
    status: row.status as PaymentStatus,
    paidDate: row.paid_date,
    paidAmountCents: row.paid_amount_cents,
    notes: row.notes,
    syncStatus: row.sync_status as CommitmentPayment["syncStatus"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deviceId: row.device_id,
  };
}

// ── Commitments ───────────────────────────────────────────────────────────────

export async function listCommitments(activeOnly = true): Promise<Commitment[]> {
  const db = await getDatabase();
  const rows = activeOnly
    ? await db.getAllAsync<CommitmentRow>(
        `SELECT * FROM commitments WHERE deleted_at IS NULL AND is_active = 1 ORDER BY category, name`
      )
    : await db.getAllAsync<CommitmentRow>(
        `SELECT * FROM commitments WHERE deleted_at IS NULL ORDER BY category, name`
      );
  return rows.map(rowToCommitment);
}

export async function getCommitmentById(id: string): Promise<Commitment | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<CommitmentRow>(
    `SELECT * FROM commitments WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  return row ? rowToCommitment(row) : null;
}

export async function createCommitment(
  input: CreateCommitmentInput,
  deviceId: string
): Promise<Commitment> {
  const db = await getDatabase();
  const id = createId("commitment");
  const now = nowIso();

  await db.runAsync(
    `INSERT INTO commitments
      (id, name, amount_cents, currency, category, due_day, start_date, end_date,
       is_active, notes, is_tax_relief, tax_category, sync_status, created_at, updated_at, deleted_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 'pending', ?, ?, NULL, ?)`,
    [
      id,
      input.name,
      input.amountCents,
      input.currency ?? "MYR",
      input.category,
      input.dueDay,
      input.startDate,
      input.endDate ?? null,
      input.notes ?? null,
      input.isTaxRelief ? 1 : 0,
      input.taxCategory ?? null,
      now,
      now,
      deviceId,
    ]
  );

  await enqueueSyncItem({
    entityType: "commitment",
    entityId: id,
    operation: "create",
    payload: JSON.stringify({ id, ...input }),
  });

  const row = await db.getFirstAsync<CommitmentRow>(
    `SELECT * FROM commitments WHERE id = ?`,
    [id]
  );
  return rowToCommitment(row!);
}

export async function updateCommitment(id: string, fields: { name?: string; amountCents?: number; dueDay?: number; notes?: string | null }): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();
  const parts: string[] = [];
  const vals: (string | number | null)[] = [];
  if (fields.name !== undefined)        { parts.push("title = ?");       vals.push(fields.name); }
  if (fields.amountCents !== undefined) { parts.push("amount_cents = ?"); vals.push(fields.amountCents); }
  if (fields.dueDay !== undefined)      { parts.push("due_day = ?");      vals.push(fields.dueDay); }
  if (fields.notes !== undefined)       { parts.push("notes = ?");        vals.push(fields.notes ?? null); }
  if (parts.length === 0) return;
  parts.push("updated_at = ?", "sync_status = 'pending'");
  vals.push(now, id);
  await db.runAsync(`UPDATE commitments SET ${parts.join(", ")} WHERE id = ?`, vals as (string | number | null)[]);
}

export async function deactivateCommitment(id: string): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();
  await db.runAsync(
    `UPDATE commitments SET is_active = 0, updated_at = ?, sync_status = 'pending' WHERE id = ?`,
    [now, id]
  );
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function listPaymentsForCommitment(
  commitmentId: string
): Promise<CommitmentPayment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PaymentRow>(
    `SELECT * FROM commitment_payments WHERE commitment_id = ? ORDER BY year DESC, month DESC`,
    [commitmentId]
  );
  return rows.map(rowToPayment);
}

export async function listPaymentsForMonth(
  month: number,
  year: number
): Promise<CommitmentPayment[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PaymentRow>(
    `SELECT * FROM commitment_payments WHERE year = ? AND month = ? ORDER BY due_date`,
    [year, month]
  );
  return rows.map(rowToPayment);
}

export async function upsertPayment(
  commitmentId: string,
  year: number,
  month: number,
  expectedAmountCents: number,
  dueDate: string,
  deviceId: string
): Promise<CommitmentPayment> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<PaymentRow>(
    `SELECT * FROM commitment_payments WHERE commitment_id = ? AND year = ? AND month = ?`,
    [commitmentId, year, month]
  );
  if (existing) return rowToPayment(existing);

  const id = createId("payment");
  const now = nowIso();
  await db.runAsync(
    `INSERT INTO commitment_payments
      (id, commitment_id, year, month, due_date, expected_amount_cents, status,
       paid_date, paid_amount_cents, notes, sync_status, created_at, updated_at, device_id)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NULL, NULL, NULL, 'pending', ?, ?, ?)`,
    [id, commitmentId, year, month, dueDate, expectedAmountCents, now, now, deviceId]
  );
  const row = await db.getFirstAsync<PaymentRow>(
    `SELECT * FROM commitment_payments WHERE id = ?`,
    [id]
  );
  return rowToPayment(row!);
}

export async function updatePaymentStatus(
  input: UpdatePaymentInput,
  deviceId: string
): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();
  await db.runAsync(
    `UPDATE commitment_payments
      SET status = ?, paid_date = ?, paid_amount_cents = ?, notes = ?,
          updated_at = ?, sync_status = 'pending'
      WHERE id = ?`,
    [
      input.status,
      input.paidDate ?? null,
      input.paidAmountCents ?? null,
      input.notes ?? null,
      now,
      input.paymentId,
    ]
  );
  await enqueueSyncItem({
    entityType: "commitment_payment",
    entityId: input.paymentId,
    operation: "update",
    payload: JSON.stringify(input),
  });
}
