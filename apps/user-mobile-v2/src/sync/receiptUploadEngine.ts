/**
 * Receipt upload engine.
 *
 * Finds receipts with upload_status = 'local', requests a signed upload URL
 * from the server, uploads the file binary to Supabase Storage, then marks
 * the receipt as 'uploaded' locally and enqueues a sync push so the server
 * registers the storage_path.
 *
 * Called by useSyncEngine after each push/pull cycle.
 */
import * as FileSystem from "expo-file-system/legacy";

import {
  listReceiptsByUploadStatus,
  markReceiptUploaded,
  markReceiptUploadFailed,
} from "@/local-db/repositories/receiptRepository";
import { getSyncBaseUrl } from "@/sync/syncConfig";

export type ReceiptUploadResult = {
  uploaded: number;
  failed: number;
};

type GetTokenFn = () => Promise<string | null>;

export async function uploadPendingReceipts(
  getToken: GetTokenFn,
  limit = 10
): Promise<ReceiptUploadResult> {
  const pending = await listReceiptsByUploadStatus("local", limit);
  if (pending.length === 0) return { uploaded: 0, failed: 0 };

  const token = await getToken();
  if (!token) return { uploaded: 0, failed: pending.length };

  const baseUrl = getSyncBaseUrl();
  let uploaded = 0;
  let failed = 0;

  for (const receipt of pending) {
    try {
      // 1. Request signed upload URL from server
      const urlRes = await fetch(`${baseUrl}/api/sync/upload-url`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receipt_id: receipt.id,
          mime_type: receipt.mimeType ?? "image/jpeg",
          file_size: receipt.fileSize ?? 0,
        }),
      });

      if (!urlRes.ok) {
        throw new Error(`upload-url failed: ${urlRes.status}`);
      }

      const { upload_url, storage_path } = (await urlRes.json()) as {
        upload_url: string;
        storage_path: string;
      };

      // 2. Upload binary to Supabase Storage via signed URL
      const uploadResult = await FileSystem.uploadAsync(upload_url, receipt.localUri, {
        httpMethod: "PUT",
        headers: {
          "Content-Type": receipt.mimeType ?? "image/jpeg",
        },
      });

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Storage upload failed: ${uploadResult.status}`);
      }

      // 3. Mark uploaded locally with the storage path
      await markReceiptUploaded(receipt.id, storage_path);
      uploaded++;
    } catch {
      await markReceiptUploadFailed(receipt.id);
      failed++;
    }
  }

  return { uploaded, failed };
}
