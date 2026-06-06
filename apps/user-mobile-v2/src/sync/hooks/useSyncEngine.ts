import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "@/state/authStore";
import { useDeviceStore } from "@/state/deviceStore";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { useSubscriptionRefresh } from "@/features/subscription/hooks/useSubscriptionRefresh";
import { createSyncApi } from "@/sync/syncApi";
import { pushPendingSyncItems } from "@/sync/syncEngine";
import { pullAndApplyChanges } from "@/sync/pullEngine";
import { runBootstrap } from "@/sync/bootstrapEngine";
import { uploadPendingReceipts } from "@/sync/receiptUploadEngine";
import {
  getSyncBaseUrl,
  SYNC_PERIODIC_INTERVAL_MS,
  SYNC_PUSH_LIMIT,
} from "@/sync/syncConfig";
import { getSyncState } from "@/local-db/repositories/syncStateRepository";
import { SYNC_PULL_SCOPE } from "@/sync/syncConfig";

export type SyncStatus = "idle" | "syncing" | "error" | "offline" | "free_tier";

export type SyncSummary = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
  /** True when user is on FREE tier — sync is disabled, cloud backup unavailable */
  syncDisabled: boolean;
  triggerPush: () => void;
  triggerPull: () => void;
  triggerBootstrap: () => void;
};

export function useSyncEngine(): SyncSummary {
  const session = useAuthStore((s) => s.session);
  const deviceId = useDeviceStore((s) => s.deviceId);
  const { tier } = useSubscription();
  // Always refresh subscription from server on launch — tier-agnostic.
  // Breaks the deadlock where stale FREE cache blocks the PRO sync engine.
  useSubscriptionRefresh();
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSyncing = useRef(false);

  // Sync is only available on PRO tier and above
  const syncEnabled = tier === "PRO" || tier === "PREMIUM";

  function getSyncApi() {
    if (!session?.accessToken || !syncEnabled) return null;
    return createSyncApi({
      baseUrl: getSyncBaseUrl(),
      getAccessToken: async () => session.accessToken,
    });
  }

  const triggerBootstrap = useCallback(async () => {
    if (!syncEnabled) return;
    const api = getSyncApi();
    if (!api || isSyncing.current) return;
    isSyncing.current = true;
    setStatus("syncing");
    setErrorMessage(null);
    try {
      const result = await runBootstrap(() => api.bootstrap());
      if (!result.ok) {
        setErrorMessage(result.error ?? "Bootstrap failed");
        setStatus("error");
      } else {
        setStatus("idle");
        const state = await getSyncState(SYNC_PULL_SCOPE);
        setLastSyncedAt(state?.lastSyncedAt ?? null);
      }
    } finally {
      isSyncing.current = false;
    }
  }, [session, syncEnabled]);

  const triggerPush = useCallback(async () => {
    if (!syncEnabled) return;
    const api = getSyncApi();
    if (!api || isSyncing.current) return;
    isSyncing.current = true;
    setStatus("syncing");
    setErrorMessage(null);
    try {
      // Upload pending receipt files (PRO only — free tier skips)
      await uploadPendingReceipts(async () => session?.accessToken ?? null);

      const result = await pushPendingSyncItems({
        deviceId,
        limit: SYNC_PUSH_LIMIT,
        push: (req) => api.push(req),
      });
      setPendingCount((prev) => Math.max(0, prev - result.accepted));
      if (result.failed > 0) {
        setErrorMessage(`${result.failed} item(s) failed to sync`);
        setStatus("error");
      } else {
        setStatus("idle");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Push failed";
      setErrorMessage(msg);
      setStatus(isNetworkError(err) ? "offline" : "error");
    } finally {
      isSyncing.current = false;
    }
  }, [session, deviceId, syncEnabled]);

  const triggerPull = useCallback(async () => {
    if (!syncEnabled) return;
    const api = getSyncApi();
    if (!api || isSyncing.current) return;
    isSyncing.current = true;
    setStatus("syncing");
    setErrorMessage(null);
    try {
      const result = await pullAndApplyChanges((cursor) => api.pull(cursor));
      if (result.error) {
        setErrorMessage(result.error);
        setStatus(isNetworkError(new Error(result.error)) ? "offline" : "error");
      } else {
        setStatus("idle");
        setLastSyncedAt(result.cursor ?? null);
      }
    } finally {
      isSyncing.current = false;
    }
  }, [session, syncEnabled]);

  // Bootstrap once when PRO session first available and no cursor exists
  useEffect(() => {
    if (!session?.accessToken || !syncEnabled) return;
    (async () => {
      const state = await getSyncState(SYNC_PULL_SCOPE);
      if (!state?.cursor) {
        await triggerBootstrap();
      } else {
        setLastSyncedAt(state.lastSyncedAt);
        await triggerPush();
      }
    })();
  }, [session?.accessToken, syncEnabled]);

  // Sync on app foreground (PRO only)
  useEffect(() => {
    if (!syncEnabled) return;
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && session?.accessToken) {
        void triggerPush();
        void triggerPull();
      }
    });
    return () => sub.remove();
  }, [session?.accessToken, syncEnabled]);

  // Periodic sync (PRO only)
  useEffect(() => {
    if (!session?.accessToken || !syncEnabled) return;
    const interval = setInterval(() => {
      void triggerPush();
      void triggerPull();
    }, SYNC_PERIODIC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.accessToken, syncEnabled]);

  return {
    status: syncEnabled ? status : "free_tier",
    lastSyncedAt,
    pendingCount,
    errorMessage,
    syncDisabled: !syncEnabled,
    triggerPush,
    triggerPull,
    triggerBootstrap,
  };
}

/** True when the error message indicates a network/connectivity failure. */
function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("network request failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("timeout") ||
    msg.includes("offline") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  );
}
