/**
 * Reads subscription state from the local subscriptions_cache table.
 * Populated by the bootstrap engine on first login and pull engine on sync.
 * Falls back to FREE tier if no cached subscription exists.
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

export function useSubscription() {
  const userId = useAuthStore((s) => s.session?.userId);

  const query = useQuery({
    queryKey: ["subscription", userId],
    queryFn: () => fetchCachedSubscription(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const statusLower = query.data?.status?.toLowerCase();
  const tier: SubscriptionTier =
    statusLower === "active" || statusLower === "trialing"
      ? ((query.data?.tier ?? "FREE") as SubscriptionTier)
      : "FREE";

  return {
    tier,
    status: query.data?.status ?? null,
    currentPeriodEnd: query.data?.current_period_end ?? null,
    seatCount: query.data?.seat_count ?? null,
    isLoading: query.isLoading,
  };
}
