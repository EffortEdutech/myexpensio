/**
 * Web-only override for syncStateRepository.
 * Metro automatically resolves this file on web instead of syncStateRepository.ts.
 *
 * The native version stores sync state in SQLite (which is in-memory on web and
 * wiped on every page refresh). This version persists the cursor to localStorage
 * so that page reloads trigger a fast delta pull instead of a full bootstrap.
 *
 * Keys written to localStorage:
 *   myexpensio:sync_cursor:<scope>   — the pull cursor string
 *   myexpensio:sync_last_at:<scope>  — ISO timestamp of last successful sync
 *
 * Stale cursor policy: if last_synced_at is older than 30 days, the cursor is
 * wiped so that a full bootstrap re-runs. This prevents an unbounded delta pull
 * accumulating months of changes on rarely-used PWA sessions.
 */
import type { SyncState } from "@/sync/syncState";
import { nowIso } from "@/utils/time";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function cursorKey(scope: string) {
  return `myexpensio:sync_cursor:${scope}`;
}

function lastAtKey(scope: string) {
  return `myexpensio:sync_last_at:${scope}`;
}

export async function getSyncState(scope: string): Promise<SyncState | null> {
  try {
    const cursor = localStorage.getItem(cursorKey(scope));
    const lastSyncedAt = localStorage.getItem(lastAtKey(scope));

    if (!cursor) return null;

    // Wipe cursor if older than 30 days — forces fresh bootstrap
    if (lastSyncedAt) {
      const ageMs = Date.now() - new Date(lastSyncedAt).getTime();
      if (ageMs > THIRTY_DAYS_MS) {
        localStorage.removeItem(cursorKey(scope));
        localStorage.removeItem(lastAtKey(scope));
        console.log("[sync-web] Cursor expired (>30 days) — will re-bootstrap.");
        return null;
      }
    }

    return {
      scope,
      cursor,
      lastSyncedAt,
      updatedAt: lastSyncedAt ?? nowIso(),
    };
  } catch {
    // localStorage may be unavailable in private browsing on some browsers
    return null;
  }
}

export async function upsertSyncState(
  scope: string,
  cursor: string | null,
  lastSyncedAt: string | null
): Promise<SyncState> {
  const now = nowIso();
  const at = lastSyncedAt ?? now;

  try {
    if (cursor) {
      localStorage.setItem(cursorKey(scope), cursor);
      localStorage.setItem(lastAtKey(scope), at);
    } else {
      // Null cursor means reset — clear persistence
      localStorage.removeItem(cursorKey(scope));
      localStorage.removeItem(lastAtKey(scope));
    }
  } catch {
    // Silently fail — sync will re-run next session
  }

  return { scope, cursor, lastSyncedAt: at, updatedAt: now };
}
