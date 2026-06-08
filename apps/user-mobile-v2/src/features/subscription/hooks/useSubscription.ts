/**
 * Reads subscription state from the local subscriptions_cache table.
 * Populated by the bootstrap engine on first login and pull engine on sync.
 * Falls back to FREE tier if no cached subscription exists.
 *
 * Tier resolution:
 *   1. effective_tier from profiles_cache (set by bootstrap from get_active_org RPC)
 *      — correctly resolves ORG subscription for TEAM/AGENT members
 *   2. subscriptions_cache USER-level tier (legacy / solo user fallback)
 *   3. FREE
 */
import { useQuery } from "@tanstack/react-query";

import { getDatabase } from "@/local-db/database";
import { useAuthStore } from "@/state/authStore";
import type { SubscriptionTier } from "@/features/subscription/types";

type CachedSubRow = {
  id: string;
  tier: SubscriptionTier;
  status: string;
  current_period_end: string | null;
  seat_count: number | null;
};

type EffectiveTierRow = {
  effective_tier: string | null;
};

async function fetchCachedSubscription(userId: string | undefined): Promise<CachedSubRow | null> {
  if (!userId) return null;
  const db = await getDatabase();
  return db.getFirstAsync<CachedSubRow>(
    `SELECT id, tier, status, current_period_end, seat_count
     FROM subscriptions_cache
     WHERE owner_id = ?
     ORDER BY updated_at DESC
     LIMIT 1;`,
    [userId]
  );
}

async function fetchEffectiveTier(userId: string | undefined): Promise<EffectiveTierRow | null> {
  if (!userId) return null;
  const db = await getDatabase();
  return db.getFirstAsync<EffectiveTierRow>(
    `SELECT effective_tier FROM profiles_cache WHERE id = ? LIMIT 1;`,
    [userId]
  );
}

export function useSubscription() {
  const userId = useAuthStore((s) => s.session?.userId);

  const subQuery = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => fetchCachedSubscription(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const tierQuery = useQuery({
    queryKey: ["effective_tier", userId],
    queryFn: () => fetchEffectiveTier(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  // Prefer org-resolved effective_tier (covers TEAM/AGENT members correctly)
  const effectiveTierFromOrg = tierQuery.data?.effective_tier;

  const statusLower = subQuery.data?.status?.toLowerCase();
  const userTierActive: SubscriptionTier | null =
    statusLower === "active" || statusLower === "trialing"
      ? ((subQuery.data?.tier ?? "FREE") as SubscriptionTier)
      : null;

  const tier: SubscriptionTier =
    (effectiveTierFromOrg as SubscriptionTier | undefined) ??
    userTierActive ??
    "FREE";

  return {
    tier,
    status: subQuery.data?.status ?? null,
    currentPeriodEnd: subQuery.data?.current_period_end ?? null,
    seatCount: subQuery.data?.seat_count ?? null,
    isLoading: subQuery.isLoading || tierQuery.isLoading,
  };
}
