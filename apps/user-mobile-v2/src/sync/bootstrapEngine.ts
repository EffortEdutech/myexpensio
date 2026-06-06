/**
 * Bootstrap engine — called once after login or when local DB is empty.
 * Fetches the user's server-side profile, spaces, subscription, and rates,
 * then writes them into the local cache tables.
 */
import { getDatabase } from "@/local-db/database";
import {
  upsertSyncState,
} from "@/local-db/repositories/syncStateRepository";
import type { BootstrapSyncResponse } from "@/sync/syncApi";
import { SYNC_PULL_SCOPE } from "@/sync/syncConfig";
import { nowIso } from "@/utils/time";

export type BootstrapResult = {
  ok: boolean;
  error?: string;
};

type BootstrapFn = () => Promise<BootstrapSyncResponse>;

export async function runBootstrap(bootstrap: BootstrapFn): Promise<BootstrapResult> {
  let response: BootstrapSyncResponse;
  try {
    response = await bootstrap();
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bootstrap failed" };
  }

  try {
    await applyBootstrapPayload(response.payload);
    await upsertSyncState(SYNC_PULL_SCOPE, response.cursor, nowIso());
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Bootstrap apply failed" };
  }
}

type BindRow = (string | number | null)[];

async function applyBootstrapPayload(payload: Record<string, unknown>): Promise<void> {
  const db = await getDatabase();
  const now = nowIso();

  // Apply profile
  const profile = payload.profile as Record<string, unknown> | null;
  if (profile?.id) {
    await db.runAsync(
      `INSERT INTO profiles_cache (id, email, display_name, department, location, company_name, sync_status, updated_at)
       VALUES (?,?,?,?,?,?,'synced',?)
       ON CONFLICT(id) DO UPDATE SET
         email=excluded.email, display_name=excluded.display_name,
         department=excluded.department, location=excluded.location,
         company_name=excluded.company_name, sync_status='synced', updated_at=excluded.updated_at`,
      [
        profile.id, profile.email ?? null, profile.display_name ?? null,
        profile.department ?? null, profile.location ?? null,
        profile.company_name ?? null, now,
      ] as BindRow
    );
  }

  // Apply subscription
  const sub = payload.subscription as Record<string, unknown> | null;
  if (sub?.id) {
    await db.runAsync(
      `INSERT INTO subscriptions_cache (id, owner_type, owner_id, tier, status, current_period_end, seat_count, sync_status, updated_at)
       VALUES (?,?,?,?,?,?,?,'synced',?)
       ON CONFLICT(id) DO UPDATE SET
         tier=excluded.tier, status=excluded.status,
         current_period_end=excluded.current_period_end, sync_status='synced', updated_at=excluded.updated_at`,
      [
        sub.id, sub.owner_type ?? "user", sub.owner_id ?? profile?.id ?? "",
        sub.tier ?? "FREE", sub.status ?? "active",
        sub.current_period_end ?? null, sub.seat_count ?? null, now,
      ] as BindRow
    );
  }

  // Apply spaces
  const spaces = (payload.spaces as Record<string, unknown>[] | null) ?? [];
  for (const space of spaces) {
    if (!space.id) continue;
    await db.runAsync(
      `INSERT INTO spaces (id, type, name, currency, is_default, sync_status, created_at, updated_at, deleted_at, device_id)
       VALUES (?,?,?,?,?,'synced',?,?,NULL,'server')
       ON CONFLICT(id) DO UPDATE SET
         type=excluded.type, name=excluded.name, sync_status='synced', updated_at=excluded.updated_at`,
      [
        space.id, space.type ?? "PERSONAL", space.name ?? "",
        space.currency ?? "MYR", space.is_default ? 1 : 0,
        space.created_at ?? now, space.updated_at ?? now,
      ] as BindRow
    );
  }
}
