import type { ApiClientOptions } from "@/api/client";
import { createApiClient } from "@/api/client";
import type { SyncEntityType } from "@/sync/types";

export type PrepareUploadRequest = {
  receipt_id: string;
  owner_entity_type: SyncEntityType;
  owner_entity_id: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
};

export type PrepareUploadResponse = {
  upload_url: string;
  remote_path: string;
  headers?: Record<string, string>;
};

export type CompleteUploadRequest = {
  receipt_id: string;
  remote_path: string;
};

export type CompleteUploadResponse = {
  receipt_id: string;
  remote_path: string;
  view_url: string | null;
};

export function createFileUploadApi(options: ApiClientOptions) {
  const api = createApiClient(options);

  return {
    completeUpload(request: CompleteUploadRequest) {
      return api.request<CompleteUploadResponse>("/files/complete-upload", {
        method: "POST",
        body: request
      });
    },
    prepareUpload(request: PrepareUploadRequest) {
      return api.request<PrepareUploadResponse>("/files/prepare-upload", {
        method: "POST",
        body: request
      });
    }
  };
}

