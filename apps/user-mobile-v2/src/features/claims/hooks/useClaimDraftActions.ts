import { useMutation, useQueryClient } from "@tanstack/react-query";

import { claimQueryKeys } from "@/features/claims/hooks/useClaimDrafts";
import type { ClaimDraft } from "@/features/claims/types";
import {
  createClaimItemDraft,
  getLatestClaimItem,
  softDeleteClaimDraft,
  softDeleteClaimItem,
  updateClaimDraftTitle,
  updateClaimItemAmount
} from "@/local-db/repositories/claimRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";

function useInvalidateClaimData() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: claimQueryKeys.drafts
    });
    void queryClient.invalidateQueries({
      queryKey: syncQueryKeys.pendingItems
    });
  };
}

export function useRenameClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (claim: ClaimDraft) =>
      updateClaimDraftTitle(
        claim.id,
        `${claim.title ?? "Draft claim"} updated`,
        deviceId
      ),
    onSuccess: invalidate
  });
}

export function useSoftDeleteClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (claimId: string) => softDeleteClaimDraft(claimId, deviceId),
    onSuccess: invalidate
  });
}

export function useAddItemToClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (claim: ClaimDraft) =>
      createClaimItemDraft(
        {
          amountCents: 450,
          claimId: claim.id,
          currency: claim.currency,
          itemDate: new Date().toISOString().slice(0, 10),
          notes: "Added locally from claim card action.",
          title: "Parking top-up",
          type: "parking"
        },
        deviceId
      ),
    onSuccess: invalidate
  });
}

export function useIncreaseLatestClaimItem() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const latestItem = await getLatestClaimItem(claimId);

      if (!latestItem) {
        return null;
      }

      return updateClaimItemAmount(
        latestItem.id,
        latestItem.amountCents + 100,
        deviceId
      );
    },
    onSuccess: invalidate
  });
}

export function useDeleteLatestClaimItem() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: async (claimId: string) => {
      const latestItem = await getLatestClaimItem(claimId);

      if (!latestItem) {
        return null;
      }

      return softDeleteClaimItem(latestItem.id, deviceId);
    },
    onSuccess: invalidate
  });
}

