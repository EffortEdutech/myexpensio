import type { ApiClientOptions } from "@/api/client";
import { createApiClient } from "@/api/client";
import type { SyncEntityType, SyncOperation } from "@/sync/types";

export type PushSyncRequest = {
  device_id: string;
  client_time: string;
  items: PushSyncItem[];
};

export type PushSyncItem = {
  queue_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  operation: SyncOperation;
  client_updated_at: string;
  payload: unknown;
};

export type PushSyncResponse = {
  accepted: AcceptedSyncItem[];
  rejected: RejectedSyncItem[];
};

export type AcceptedSyncItem = {
  queue_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  server_updated_at: string;
};

export type RejectedSyncItem = {
  queue_id: string;
  entity_type: SyncEntityType;
  entity_id: string;
  code: string;
  message: string;
};

export type PullSyncResponse = {
  cursor: string;
  changes: PullSyncChange[];
};

export type PullSyncChange = {
  entity_type: SyncEntityType;
  entity_id: string;
  operation: "upsert" | "delete";
  server_updated_at: string;
  payload: unknown;
};

export type BootstrapSyncResponse = {
  cursor: string;
  server_time: string;
  payload: Record<string, unknown>;
};

export function createSyncApi(options: ApiClientOptions) {
  const api = createApiClient(options);

  return {
    bootstrap() {
      return api.request<BootstrapSyncResponse>("/sync/bootstrap");
    },
    pull(cursor: string | null) {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";

      return api.request<PullSyncResponse>(`/sync/pull${query}`);
    },
    push(request: PushSyncRequest) {
      return api.request<PushSyncResponse>("/sync/push", {
        method: "POST",
        body: request
      });
    }
  };
}

