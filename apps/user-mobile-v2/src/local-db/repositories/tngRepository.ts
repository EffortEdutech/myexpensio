import type { SyncStatus } from "@/features/expenses/types";
import type {
  SaveTngPreviewInput,
  TngLibrarySummary,
  TngLinkStatus,
  TngParsedRow,
  TngSector,
  TngStatementBatch,
  TngTransaction,
  TngTransactionFilters
} from "@/features/tng/types";
import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type TngStatementBatchRow = {
  created_at: string;
  deleted_at: string | null;
  device_id: string;
  id: string;
  imported_at: string;
  label: string;
  source_file_name: string | null;
  source_file_uri: string | null;
  statement_id: string | null;
  sync_status: SyncStatus;
  total_amount_cents: number;
  transaction_count: number;
  updated_at: string;
};

type TngTransactionRow = {
  amount_cents: number;
  claim_item_id: string | null;
  claimed: number;
  created_at: string;
  currency: string;
  dedupe_key: string | null;
  deleted_at: string | null;
  device_id: string;
  entry_datetime: string | null;
  entry_location: string | null;
  exit_datetime: string | null;
  exit_location: string | null;
  id: string;
  link_status: TngLinkStatus | null;
  linked_claim_id: string | null;
  location: string | null;
  raw_payload: string | null;
  sector: TngSector;
  statement_id: string | null;
  statement_label: string | null;
  sync_status: SyncStatus;
  transaction_date: string;
  trans_no: string | null;
  updated_at: string;
  upload_batch_id: string | null;
};

export async function listTngStatementBatches() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TngStatementBatchRow>(
    `SELECT *
      FROM tng_statement_batches
      WHERE deleted_at IS NULL
      ORDER BY imported_at DESC;`
  );

  return rows.map(mapBatchRow);
}

export async function listTngTransactions(filters: TngTransactionFilters = {}) {
  const database = await getDatabase();
  const clauses = ["deleted_at IS NULL"];
  const args: Array<number | string> = [];

  if (filters.sector && filters.sector !== "ALL") {
    clauses.push("sector = ?");
    args.push(filters.sector);
  }

  if (filters.claimed === "claimed") {
    clauses.push("claimed = 1");
  } else if (filters.claimed === "unclaimed") {
    clauses.push("claimed = 0");
  }

  const rows = await database.getAllAsync<TngTransactionRow>(
    `SELECT *
      FROM tng_transactions
      WHERE ${clauses.join(" AND ")}
      ORDER BY transaction_date DESC, created_at DESC;`,
    args
  );

  return rows.map(mapTransactionRow);
}

export async function getTngLibrarySummary(): Promise<TngLibrarySummary> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{
    batches: number;
    claimed: number;
    total_amount_cents: number | null;
    transactions: number;
    unclaimed: number;
  }>(
    `SELECT
        (SELECT COUNT(*) FROM tng_statement_batches WHERE deleted_at IS NULL) AS batches,
        COUNT(*) AS transactions,
        COALESCE(SUM(amount_cents), 0) AS total_amount_cents,
        SUM(CASE WHEN claimed = 1 THEN 1 ELSE 0 END) AS claimed,
        SUM(CASE WHEN claimed = 0 THEN 1 ELSE 0 END) AS unclaimed
      FROM tng_transactions
      WHERE deleted_at IS NULL;`
  );

  return {
    batches: row?.batches ?? 0,
    claimed: row?.claimed ?? 0,
    totalAmountCents: row?.total_amount_cents ?? 0,
    transactions: row?.transactions ?? 0,
    unclaimed: row?.unclaimed ?? 0
  };
}

export async function saveTngPreview(input: SaveTngPreviewInput, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const batch: TngStatementBatch = {
    createdAt: timestamp,
    deletedAt: null,
    deviceId,
    id: createId("tng_batch"),
    importedAt: timestamp,
    label: input.label.trim() || "TNG statement",
    sourceFileName: input.sourceFileName ?? null,
    sourceFileUri: input.sourceFileUri ?? null,
    statementId: input.statementId ?? null,
    syncStatus: "pending",
    totalAmountCents: 0,
    transactionCount: 0,
    updatedAt: timestamp
  };
  let savedCount = 0;
  let skippedDuplicateCount = 0;
  let totalAmountCents = 0;
  const insertedTransactions: TngTransaction[] = [];

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO tng_statement_batches (
        id, statement_id, label, source_file_name, source_file_uri,
        imported_at, transaction_count, total_amount_cents, sync_status,
        created_at, updated_at, deleted_at, device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        batch.id,
        batch.statementId,
        batch.label,
        batch.sourceFileName,
        batch.sourceFileUri,
        batch.importedAt,
        0,
        0,
        batch.syncStatus,
        batch.createdAt,
        batch.updatedAt,
        batch.deletedAt,
        batch.deviceId
      ]
    );

    for (const row of input.rows) {
      const dedupeKey = buildDedupeKey(row, batch.statementId, batch.label);

      // Check ALL records with this dedupe_key — including soft-deleted ones.
      // The previous check (AND deleted_at IS NULL) missed soft-deleted rows,
      // causing INSERT to hit the UNIQUE constraint silently via OR IGNORE.
      const existing = await database.getFirstAsync<{
        id: string;
        deleted_at: string | null;
        amount_cents: number;
      }>(
        `SELECT id, deleted_at, amount_cents FROM tng_transactions
          WHERE dedupe_key = ?
          LIMIT 1;`,
        [dedupeKey]
      );

      if (existing) {
        if (!existing.deleted_at) {
          // Active duplicate — genuinely skip
          skippedDuplicateCount += 1;
          continue;
        }

        // Soft-deleted — restore it with the new batch association
        await database.runAsync(
          `UPDATE tng_transactions
            SET deleted_at    = NULL,
                upload_batch_id = ?,
                statement_label = ?,
                source_file_uri = ?,
                sync_status     = 'pending',
                updated_at      = ?
            WHERE id = ?;`,
          [batch.id, batch.label, batch.sourceFileUri, timestamp, existing.id]
        );
        savedCount += 1;
        totalAmountCents += existing.amount_cents;
        continue;
      }

      const transaction = createTransactionFromRow(
        row,
        batch,
        dedupeKey,
        timestamp
      );
      insertedTransactions.push(transaction);
      savedCount += 1;
      totalAmountCents += transaction.amountCents;

      await database.runAsync(
        `INSERT INTO tng_transactions (
          id, statement_id, trans_no, sector, amount_cents, currency,
          transaction_date, entry_location, exit_location, claimed,
          claim_item_id, link_status, sync_status, created_at, updated_at,
          deleted_at, device_id, upload_batch_id, source_file_uri,
          source_file_path, statement_label, entry_datetime, exit_datetime,
          location, raw_payload, dedupe_key, linked_claim_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          transaction.id,
          transaction.statementId,
          transaction.transNo,
          transaction.sector,
          transaction.amountCents,
          transaction.currency,
          transaction.transactionDate,
          transaction.entryLocation,
          transaction.exitLocation,
          transaction.claimed ? 1 : 0,
          transaction.claimItemId,
          transaction.linkStatus,
          transaction.syncStatus,
          transaction.createdAt,
          transaction.updatedAt,
          transaction.deletedAt,
          transaction.deviceId,
          transaction.uploadBatchId,
          batch.sourceFileUri,
          null,
          transaction.statementLabel,
          transaction.entryDatetime,
          transaction.exitDatetime,
          transaction.location,
          transaction.rawPayload,
          transaction.dedupeKey,
          transaction.linkedClaimId
        ]
      );

      await enqueueSyncItem(
        {
          entityId: transaction.id,
          entityType: "tng_transaction",
          operation: "create",
          payload: JSON.stringify(transaction)
        },
        database
      );
    }

    await database.runAsync(
      `UPDATE tng_statement_batches
        SET transaction_count = ?,
            total_amount_cents = ?,
            updated_at = ?
        WHERE id = ?;`,
      [savedCount, totalAmountCents, timestamp, batch.id]
    );

    await enqueueSyncItem(
      {
        entityId: batch.id,
        entityType: "tng_statement_batch",
        operation: "create",
        payload: JSON.stringify({
          ...batch,
          totalAmountCents,
          transactionCount: savedCount
        })
      },
      database
    );
  });

  return {
    batch: {
      ...batch,
      totalAmountCents,
      transactionCount: savedCount
    },
    savedCount,
    skippedDuplicateCount,
    transactions: insertedTransactions
  };
}

export async function softDeleteTngStatementBatch(batchId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const claimed = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
      FROM tng_transactions
      WHERE upload_batch_id = ?
        AND claimed = 1
        AND deleted_at IS NULL;`,
    [batchId]
  );

  if ((claimed?.count ?? 0) > 0) {
    throw new Error("This statement has claimed transactions and cannot be deleted.");
  }

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE tng_statement_batches
        SET sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, batchId]
    );
    await database.runAsync(
      `UPDATE tng_transactions
        SET sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE upload_batch_id = ?
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, batchId]
    );
    await enqueueSyncItem(
      {
        entityId: batchId,
        entityType: "tng_statement_batch",
        operation: "delete",
        payload: JSON.stringify({ deletedAt: timestamp, deviceId, id: batchId })
      },
      database
    );
  });
}

function createTransactionFromRow(
  row: TngParsedRow,
  batch: TngStatementBatch,
  dedupeKey: string,
  timestamp: string
): TngTransaction {
  return {
    amountCents: row.amountCents,
    claimed: false,
    claimItemId: null,
    createdAt: timestamp,
    currency: row.currency ?? "MYR",
    dedupeKey,
    deletedAt: null,
    deviceId: batch.deviceId,
    entryDatetime: row.entryDatetime ?? null,
    entryLocation: row.entryLocation ?? null,
    exitDatetime: row.exitDatetime ?? null,
    exitLocation: row.exitLocation ?? null,
    id: createId("tng_txn"),
    linkedClaimId: null,
    linkStatus: "unlinked",
    location:
      row.location ??
      [row.entryLocation, row.exitLocation].filter(Boolean).join(" -> ") ??
      null,
    rawPayload: row.rawPayload ? JSON.stringify(row.rawPayload) : null,
    sector: row.sector,
    statementId: batch.statementId,
    statementLabel: batch.label,
    syncStatus: "pending",
    transactionDate: row.transactionDate,
    transNo: row.transNo ?? null,
    updatedAt: timestamp,
    uploadBatchId: batch.id
  };
}

function buildDedupeKey(
  row: TngParsedRow,
  statementId: string | null,
  statementLabel: string
) {
  return [
    statementId ?? statementLabel,
    row.transNo ?? "no-trans-no",
    row.sector,
    row.transactionDate,
    row.amountCents,
    row.entryLocation ?? "",
    row.exitLocation ?? "",
    row.location ?? ""
  ].join("|");
}

function mapBatchRow(row: TngStatementBatchRow): TngStatementBatch {
  return {
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id,
    id: row.id,
    importedAt: row.imported_at,
    label: row.label,
    sourceFileName: row.source_file_name,
    sourceFileUri: row.source_file_uri,
    statementId: row.statement_id,
    syncStatus: row.sync_status,
    totalAmountCents: row.total_amount_cents,
    transactionCount: row.transaction_count,
    updatedAt: row.updated_at
  };
}

function mapTransactionRow(row: TngTransactionRow): TngTransaction {
  return {
    amountCents: row.amount_cents,
    claimed: row.claimed === 1,
    claimItemId: row.claim_item_id,
    createdAt: row.created_at,
    currency: row.currency,
    dedupeKey: row.dedupe_key,
    deletedAt: row.deleted_at,
    deviceId: row.device_id,
    entryDatetime: row.entry_datetime,
    entryLocation: row.entry_location,
    exitDatetime: row.exit_datetime,
    exitLocation: row.exit_location,
    id: row.id,
    linkedClaimId: row.linked_claim_id,
    linkStatus: row.link_status ?? "unlinked",
    location: row.location,
    rawPayload: row.raw_payload,
    sector: row.sector,
    statementId: row.statement_id,
    statementLabel: row.statement_label,
    syncStatus: row.sync_status,
    transactionDate: row.transaction_date,
    transNo: row.trans_no,
    updatedAt: row.updated_at,
    uploadBatchId: row.upload_batch_id
  };
}
