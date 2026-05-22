import { getDatabase } from "@/local-db/database";
import type {
  CachedSubscription,
  SubscriptionStatus,
  SubscriptionTier
} from "@/features/subscription/types";
import type { SyncStatus } from "@/features/expenses/types";
import { nowIso } from "@/utils/time";

type SubscriptionRow = {
  id: string;
  owner_type: "user" | "org";
  owner_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
  seat_count: number | null;
  sync_status: SyncStatus;
  updated_at: string;
};

export async function getCachedSubscription(id: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<SubscriptionRow>(
    "SELECT * FROM subscriptions_cache WHERE id = ?;",
    [id]
  );

  return row ? mapSubscriptionRow(row) : null;
}

export async function upsertCachedSubscription(
  subscription: Omit<CachedSubscription, "updatedAt" | "syncStatus"> & {
    syncStatus?: SyncStatus;
    updatedAt?: string;
  }
) {
  const database = await getDatabase();
  const updatedAt = subscription.updatedAt ?? nowIso();
  const syncStatus = subscription.syncStatus ?? "synced";

  await database.runAsync(
    `INSERT INTO subscriptions_cache (
      id,
      owner_type,
      owner_id,
      tier,
      status,
      current_period_end,
      seat_count,
      sync_status,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      owner_type = excluded.owner_type,
      owner_id = excluded.owner_id,
      tier = excluded.tier,
      status = excluded.status,
      current_period_end = excluded.current_period_end,
      seat_count = excluded.seat_count,
      sync_status = excluded.sync_status,
      updated_at = excluded.updated_at;`,
    [
      subscription.id,
      subscription.ownerType,
      subscription.ownerId,
      subscription.tier,
      subscription.status,
      subscription.currentPeriodEnd,
      subscription.seatCount,
      syncStatus,
      updatedAt
    ]
  );
}

function mapSubscriptionRow(row: SubscriptionRow): CachedSubscription {
  return {
    id: row.id,
    ownerType: row.owner_type,
    ownerId: row.owner_id,
    tier: row.tier,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    seatCount: row.seat_count,
    syncStatus: row.sync_status,
    updatedAt: row.updated_at
  };
}

