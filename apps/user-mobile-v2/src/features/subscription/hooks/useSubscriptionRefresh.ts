/**
 * useSubscriptionRefresh
 *
 * Queries Supabase DIRECTLY for the user's subscription row and writes it
 * to the local subscriptions_cache on every app launch — regardless of tier.
 *
 * Why direct Supabase (not the sync API):
 *   - No backend deploy required
 *   - RLS policy "sub_select_own" already allows authenticated users to read
 *     their own USER subscription row
 *   - Bypasses the useSyncEngine tier-gate deadlock entirely
 *
 * Schema: subscriptions table uses entity_type / entity_id (not owner_type/owner_id).
 * Status values are uppercase in Supabase: 'ACTIVE', 'TRIALING', etc.
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/state/authStore";
import { upsertCachedSubscription } from "@/local-db/repositories/subscriptionRepository";
import { supabase } from "@/lib/supabase";

export function useSubscriptionRefresh() {
  const session = useAuthStore((s) => s.session);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!session?.userId) return;

    void (async () => {
      try {
        console.log("[SubscriptionRefresh] fetching for userId:", session.userId);

        const { data, error } = await supabase
          .from("subscriptions")
          .select("id, entity_type, entity_id, tier, status, current_period_end, seat_count")
          .eq("entity_type", "USER")
          .eq("entity_id", session.userId)
          .maybeSingle();

        console.log("[SubscriptionRefresh] result:", JSON.stringify({ data, error }));

        if (error || !data) return;

        await upsertCachedSubscription({
          id: data.id,
          ownerType: "user",
          ownerId: data.entity_id,
          // tier is uppercase in DB: 'FREE' | 'PRO' | 'PREMIUM'
          tier: (data.tier as "FREE" | "PRO" | "PREMIUM") ?? "FREE",
          // status is uppercase in DB: 'ACTIVE' | 'TRIALING' etc — store lowercase
          status: (data.status?.toLowerCase() as "active" | "trialing" | "past_due" | "canceled" | "unknown") ?? "active",
          currentPeriodEnd: data.current_period_end ?? null,
          seatCount: data.seat_count ?? null,
          syncStatus: "synced",
        });

        await queryClient.invalidateQueries({ queryKey: ["subscription"] });
      } catch {
        // Silently ignore — stale cache remains, no crash
      }
    })();
  }, [session?.userId]);
}
