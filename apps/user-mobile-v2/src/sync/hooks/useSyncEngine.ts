import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAuthStore } from "@/state/authStore";
import { useDeviceStore } from "@/state/deviceStore";
import { registerDevice, updateHeartbeat } from "@/features/auth/deviceSessionApi";
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
// rehydrateFromLocalStorage is web-only: Metro resolves syncQueueRepository.web.ts
// on web, which exports it. On native, it's not exported — we guard with Platform.OS.
import { rehydrateFromLocalStorage } from "@/local-db/repositories/syncQueueRepository";

export type SyncStatus = "idle" | "syncing" | "error" | "offline" | "free_tier";

export type SyncSummary = {
  status: SyncStatus;
  lastSyncedAt: string | null;
  pendingCount: number;
  errorMessage: string | null;
  /** True when user is on FREE tier — sync is disabled, cloud backup unavailable */
  syncDisabled: boolean;
  /**
   * True once the first bootstrap+pull cycle has completed on this session.
   * On web: gates content rendering so users never see blank lists before sync.
   * On native: always true immediately (SQLite has persisted data).
   */
  syncReady: boolean;
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
  // On native, data is already in SQLite on launch — no loading gate needed.
  // On web, in-memory DB starts empty and must be filled from Supabase first.
  const [syncReady, setSyncReady] = useState(Platform.OS !== "web");

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
      if (result.rejected > 0) {
        // Server rejected some items (conflict — another device's version won)
        setErrorMessage(
          `${result.rejected} item${result.rejected === 1 ? "" : "s"} not saved — a newer version exists on another device`
        );
        setStatus("error");
      } else if (result.failed > 0) {
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

  // On startup: bootstrap (if no cursor) then pull to populate all entity data.
  // On web this must complete before content is shown (syncReady gate).
  // On native the gate is pre-set to true — SQLite already has data.
  useEffect(() => {
    if (!session?.accessToken || !syncEnabled) {
      // FREE tier on web — nothing to sync; mark ready so gate shows empty state
      if (Platform.OS === "web") setSyncReady(true);
      return;
    }
    (async () => {
      // Register (or refresh) this device in device_sessions so the session
      // guard can see it when the user logs in from another device.
      if (session.userId) {
        void registerDevice(session.userId, deviceId);
      }

      // Web: restore any mutations that survived a page close back into the
      // in-memory DB before we push. No-op on native (SQLite persists).
      await rehydrateFromLocalStorage();

      const state = await getSyncState(SYNC_PULL_SCOPE);
      if (!state?.cursor) {
        // First session or stale cursor — full bootstrap then pull
        await triggerBootstrap();
        await triggerPull();
      } else {
        setLastSyncedAt(state.lastSyncedAt);
        // Existing session — push any local changes then pull delta
        await triggerPush();
        await triggerPull();
      }
      // Data is now in the in-memory DB — allow content to render
      if (Platform.OS === "web") setSyncReady(true);
    })();
  }, [session?.accessToken, syncEnabled]);

  // Sync on app foreground / tab focus (PRO only)
  // Web: Page Visibility API — fires when the tab becomes visible again.
  // Native: AppState — fires when app returns from background.
  useEffect(() => {
    if (!syncEnabled) return;

    if (Platform.OS === "web") {
      const handleVisibility = () => {
        if (document.visibilityState === "visible" && session?.accessToken) {
          void triggerPush();
          void triggerPull();
        }
      };
      document.addEventListener("visibilitychange", handleVisibility);
      return () => document.removeEventListener("visibilitychange", handleVisibility);
    }

    // Native path
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && session?.accessToken) {
        void triggerPush();
        void triggerPull();
      }
    });
    return () => sub.remove();
  }, [session?.accessToken, syncEnabled, triggerPush, triggerPull]);

  // Auto-retry sync when network comes back online (web only)
  useEffect(() => {
    if (Platform.OS !== "web" || !syncEnabled) return;
    const handleOnline = () => {
      if (session?.accessToken) {
        void triggerPull();
        void triggerPush();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [session?.accessToken, syncEnabled, triggerPush, triggerPull]);

  // Periodic sync + heartbeat (PRO only)
  // The heartbeat keeps device_sessions fresh so the session guard on another
  // device can see this device is still active.
  useEffect(() => {
    if (!session?.accessToken || !syncEnabled) return;
    const interval = setInterval(() => {
      void triggerPush();
      void triggerPull();
      if (session.userId) {
        void updateHeartbeat(session.userId, deviceId);
      }
    }, SYNC_PERIODIC_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [session?.accessToken, syncEnabled]);

  return {
    status: syncEnabled ? status : "free_tier",
    lastSyncedAt,
    pendingCount,
    errorMessage,
    syncDisabled: !syncEnabled,
    syncReady,
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
