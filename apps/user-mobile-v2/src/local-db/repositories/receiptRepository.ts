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

