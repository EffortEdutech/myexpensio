import { useMutation, useQueryClient } from "@tanstack/react-query";

import { claimQueryKeys } from "@/features/claims/hooks/useClaimDrafts";
import {
  createClaimDraft,
  createClaimItemDraft
} from "@/local-db/repositories/claimRepository";
import { listPendingSyncItems } from "@/local-db/repositories/syncQueueRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { nowIso } from "@/utils/time";

const sampleItems = [
  { title: "Client parking", type: "parking", amountCents: 800 },
  { title: "Toll charge", type: "toll", amountCents: 350 },
  { title: "Grab to meeting", type: "grab", amountCents: 1850 }
] as const;

export function useCreateClaimWithItem() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceStore((state) => state.deviceId);

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const claim = await createClaimDraft(
        {
          title: `Mobile draft ${nowIso().slice(11, 16)}`,
          periodStart: today,
          periodEnd: today,
          currency: "MYR"
        },
        deviceId
      );
      const sample = sampleItems[Math.floor(Math.random() * sampleItems.length)];
      const item = await createClaimItemDraft(
        {
          claimId: claim.id,
          title: sample.title,
          type: sample.type,
          amountCents: sample.amountCents,
          currency: claim.currency,
          itemDate: today,
          notes: "Created locally from Sprint 1 claim slice."
        },
        deviceId
      );
      const pendingSyncItems = await listPendingSyncItems();

      return {
        claim,
        item,
        pendingSyncItems
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: claimQueryKeys.drafts
      });
      void queryClient.invalidateQueries({
        queryKey: syncQueryKeys.pendingItems
      });
    }
  });
}

export function useCreateBlankClaimDraft() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceStore((state) => state.deviceId);

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const claim = await createClaimDraft(
        {
          title: `Blank claim ${nowIso().slice(11, 16)}`,
          periodStart: today,
          periodEnd: today,
          currency: "MYR"
        },
        deviceId
      );
      const pendingSyncItems = await listPendingSyncItems();

      return {
        claim,
        pendingSyncItems
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: claimQueryKeys.drafts
      });
      void queryClient.invalidateQueries({
        queryKey: syncQueryKeys.pendingItems
      });
    }
  });
}

