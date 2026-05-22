import * as FileSystem from "expo-file-system";

import type {
  CompleteUploadResponse,
  PrepareUploadResponse
} from "@/api/fileUploadApi";
import {
  listReceiptsByUploadStatus,
  markReceiptUploaded,
  markReceiptUploadFailed,
  markReceiptUploading
} from "@/local-db/repositories/receiptRepository";

type UploadReceiptBatchOptions = {
  completeUpload: (request: {
    receipt_id: string;
    remote_path: string;
  }) => Promise<CompleteUploadResponse>;
  limit?: number;
  prepareUpload: (request: {
    file_name: string;
    file_size: number | null;
    mime_type: string | null;
    owner_entity_id: string;
    owner_entity_type: string;
    receipt_id: string;
  }) => Promise<PrepareUploadResponse>;
};

export type UploadReceiptBatchResult = {
  failed: number;
  uploaded: number;
};

export async function uploadLocalReceipts({
  completeUpload,
  limit = 10,
  prepareUpload
}: UploadReceiptBatchOptions): Promise<UploadReceiptBatchResult> {
  const localReceipts = await listReceiptsByUploadStatus("local", limit);
  let uploaded = 0;
  let failed = 0;

  for (const receipt of localReceipts) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(receipt.localUri);

      if (!fileInfo.exists) {
        await markReceiptUploadFailed(receipt.id);
        failed += 1;
        continue;
      }

      await markReceiptUploading(receipt.id);

      const preparedUpload = await prepareUpload({
        file_name: receipt.localUri.split("/").pop() ?? `${receipt.id}.jpg`,
        file_size: receipt.fileSize,
        mime_type: receipt.mimeType,
        owner_entity_id: receipt.ownerEntityId,
        owner_entity_type: receipt.ownerEntityType,
        receipt_id: receipt.id
      });

      await FileSystem.uploadAsync(preparedUpload.upload_url, receipt.localUri, {
        headers: preparedUpload.headers,
        httpMethod: "PUT"
      });

      await completeUpload({
        receipt_id: receipt.id,
        remote_path: preparedUpload.remote_path
      });

      await markReceiptUploaded(receipt.id, preparedUpload.remote_path);
      uploaded += 1;
    } catch {
      await markReceiptUploadFailed(receipt.id);
      failed += 1;
    }
  }

  return {
    failed,
    uploaded
  };
}
