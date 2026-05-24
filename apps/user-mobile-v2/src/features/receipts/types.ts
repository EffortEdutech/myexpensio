import type { SyncStatus } from "@/features/expenses/types";
import type { SyncEntityType } from "@/sync/types";

export type ReceiptUploadStatus = "local" | "uploading" | "uploaded" | "failed";

export type ReceiptDraft = {
  id: string;
  ownerEntityType: SyncEntityType;
  ownerEntityId: string;
  localUri: string;
  remotePath: string | null;
  mimeType: string | null;
  fileSize: number | null;
  uploadStatus: ReceiptUploadStatus;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type CreateReceiptDraftInput = {
  ownerEntityType: SyncEntityType;
  ownerEntityId: string;
  localUri: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

export type LocalReceiptFile = {
  fileSize: number | null;
  localUri: string;
  mimeType: string | null;
  name: string;
  source: "camera" | "gallery";
};

