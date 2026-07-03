/**
 * ⚠️ UNUSED / ORPHANED — confirmed 2026-07-02 (Sprint 25): nothing in the
 * codebase imports saveQueueToStorage / loadQueueFromStorage / clearQueueStorage
 * from this file. The localStorage-mirroring behavior described below was
 * independently reimplemented directly inside
 * @/local-db/repositories/syncQueueRepository.web.ts (upsertStoredItem /
 * readStoredQueue / writeStoredQueue, same "myexpensio:pending_sync_queue" key),
 * and that is the version actually wired into useSyncEngine.ts. Keeping both
 * around risks someone editing this file and wondering why nothing changes.
 * Safe to delete this whole file — kept only because file deletion in this
 * session requires manual confirmation. See docs/SHIP_READINESS_ACTION_PLAN.md §3.2.
 *
 * Web-only: mirrors the pending sync queue to localStorage so that mutations
 * made on the PWA are not lost if the user closes the tab before the push
 * cycle runs.
 *
 * Usage:
 *   - After every local mutation on web, call `saveQueueToStorage(items)`.
 *   - On page load (startup effect in useSyncEngine), call `loadQueueFromStorage()`
 *     to drain any items that survived the page close.
 *   - After a successful push, call `clearQueueStorage()`.
 *
 * On native this file is never imported — Platform guard is in the callers.
 * On web with localStorage unavailable (strict private mode), all functions
 * fail silently so the app remains functional.
 */
import { Platform } from "react-native";

const QUEUE_KEY = "myexpensio:pending_sync_queue";

export type PersistedQueueItem = {
  id: string;
  entityType: string;
  entityId: string;
  operation: "upsert" | "delete";
  payload: string;
  updatedAt: string;
};

export function saveQueueToStorage(items: PersistedQueueItem[]): void {
  if (Platform.OS !== "web") return;
  try {
    if (items.length === 0) {
      localStorage.removeItem(QUEUE_KEY);
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
    }
  } catch {
    // Silently fail — sync will retry next session
  }
}

export function loadQueueFromStorage(): PersistedQueueItem[] {
  if (Platform.OS !== "web") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PersistedQueueItem[]) : [];
  } catch {
    return [];
  }
}

export function clearQueueStorage(): void {
  if (Platform.OS !== "web") return;
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // Silently fail
  }
}
