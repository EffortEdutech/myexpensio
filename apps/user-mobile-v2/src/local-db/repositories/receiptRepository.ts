import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import type {
  CreateReceiptDraftInput,
  ReceiptDraft,
  ReceiptUploadStatus
} from "@/features/receipts/types";
import type { SyncStatus } from "@/features/expenses/types";
import type { SyncEntityType } from "@/sync/types";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type ReceiptRow = {
  id: string;
  owner_entity_type: SyncEntityType;
  owner_entity_id: string;
  local_uri: string;
  remote_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  upload_status: ReceiptUploadStatus;
  sync_status: SyncStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  device_id: string;
};

export async function listReceiptsForEntity(
  ownerEntityType: SyncEntityType,
  ownerEntityId: string
) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReceiptRow>(
    `SELECT *
      FROM receipts
      WHERE owner_entity_type = ?
        AND owner_entity_id = ?
        AND deleted_at IS NULL
      ORDER BY created_at DESC;`,
    [ownerEntityType, ownerEntityId]
  );

  return rows.map(mapReceiptRow);
}

export async function listReceiptsByUploadStatus(
  uploadStatus: ReceiptUploadStatus,
  limit = 25
) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ReceiptRow>(
    `SELECT *
      FROM receipts
      WHERE upload_status = ?
        AND deleted_at IS NULL
      ORDER BY updated_at ASC
      LIMIT ?;`,
    [uploadStatus, limit]
  );

  return rows.map(mapReceiptRow);
}

export async function getReceiptDraft(receiptId: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ReceiptRow>(
    `SELECT *
      FROM receipts
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [receiptId]
  );

  return row ? mapReceiptRow(row) : null;
}

export async function createReceiptDraft(
  input: CreateReceiptDraftInput,
  deviceId: string
) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const receipt: ReceiptDraft = {
    id: createId("receipt"),
    ownerEntityType: input.ownerEntityType,
    ownerEntityId: input.ownerEntityId,
    localUri: input.localUri,
    remotePath: null,
    mimeType: input.mimeType ?? null,
    fileSize: input.fileSize ?? null,
    uploadStatus: "local",
    syncStatus: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    deviceId
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO receipts (
        id,
        owner_entity_type,
        owner_entity_id,
        local_uri,
        remote_path,
        mime_type,
        file_size,
        upload_status,
        sync_status,
        created_at,
        updated_at,
        deleted_at,
        device_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        receipt.id,
        receipt.ownerEntityType,
        receipt.ownerEntityId,
        receipt.localUri,
        receipt.remotePath,
        receipt.mimeType,
        receipt.fileSize,
        receipt.uploadStatus,
        receipt.syncStatus,
        receipt.createdAt,
        receipt.updatedAt,
        receipt.deletedAt,
        receipt.deviceId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "receipt",
        entityId: receipt.id,
        operation: "create",
        payload: JSON.stringify(receipt)
      },
      database
    );
  });

  return receipt;
}

export async function markReceiptUploading(receiptId: string) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE receipts
      SET upload_status = 'uploading',
          updated_at = ?
      WHERE id = ?;`,
    [nowIso(), receiptId]
  );
}

export async function markReceiptUploaded(
  receiptId: string,
  remotePath: string
) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE receipts
      SET upload_status = 'uploaded',
          remote_path = ?,
          sync_status = 'pending',
          updated_at = ?
      WHERE id = ?;`,
    [remotePath, nowIso(), receiptId]
  );
}

export async function markReceiptUploadFailed(receiptId: string) {
  const database = await getDatabase();

  await database.runAsync(
    `UPDATE receipts
      SET upload_status = 'failed',
          updated_at = ?
      WHERE id = ?;`,
    [nowIso(), receiptId]
  );
}

export async function retryFailedReceiptUploads(limit = 25) {
  const failedReceipts = await listReceiptsByUploadStatus("failed", limit);
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    for (const receipt of failedReceipts) {
      await database.runAsync(
        `UPDATE receipts
          SET upload_status = 'local',
              updated_at = ?
          WHERE id = ?;`,
        [timestamp, receipt.id]
      );
    }
  });

  return failedReceipts.length;
}

export async function softDeleteReceipt(receiptId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE receipts
        SET upload_status = 'failed',
            sync_status = 'deleted',
            deleted_at = ?,
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      [timestamp, timestamp, receiptId]
    );

    await enqueueSyncItem(
      {
        entityType: "receipt",
        entityId: receiptId,
        operation: "delete",
        payload: JSON.stringify({
          id: receiptId,
          deletedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return { deletedAt: timestamp, id: receiptId };
}

export async function getReceiptUploadSummary() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{
    total: number;
    upload_status: ReceiptUploadStatus;
  }>(
    `SELECT upload_status, COUNT(*) AS total
      FROM receipts
      WHERE deleted_at IS NULL
      GROUP BY upload_status;`
  );

  return {
    failed: rows.find((row) => row.upload_status === "failed")?.total ?? 0,
    local: rows.find((row) => row.upload_status === "local")?.total ?? 0,
    uploaded: rows.find((row) => row.upload_status === "uploaded")?.total ?? 0,
    uploading: rows.find((row) => row.upload_status === "uploading")?.total ?? 0
  };
}

function mapReceiptRow(row: ReceiptRow): ReceiptDraft {
  return {
    id: row.id,
    ownerEntityType: row.owner_entity_type,
    ownerEntityId: row.owner_entity_id,
    localUri: row.local_uri,
    remotePath: row.remote_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadStatus: row.upload_status,
    syncStatus: row.sync_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
    deviceId: row.device_id
  };
}

