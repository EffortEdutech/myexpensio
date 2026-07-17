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
      // 2026-07-17: these were missing the /api prefix — the actual route
      // handlers live at apps/user/app/api/sync/{bootstrap,pull,push}/route.ts.
      // The old path (e.g. "/sync/pull") doesn't match any route, so
      // apps/user's auth middleware (proxy.ts -> updateSession) treated it as
      // an unauthenticated page request and 307-redirected it to a login
      // page. fetch follows redirects by default, so the sync client got a
      // 200 back with an HTML body instead of JSON — response.changes was
      // then undefined, crashing pullEngine.ts with "Cannot read property
      // 'length' of undefined" on every single app launch once tier >= PRO.
      return api.request<BootstrapSyncResponse>("/api/sync/bootstrap");
    },
    pull(cursor: string | null) {
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";

      return api.request<PullSyncResponse>(`/api/sync/pull${query}`);
    },
    push(request: PushSyncRequest) {
      return api.request<PushSyncResponse>("/api/sync/push", {
        method: "POST",
        body: request
      });
    }
  };
}

