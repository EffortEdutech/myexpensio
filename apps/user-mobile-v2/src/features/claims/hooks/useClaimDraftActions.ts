import { useMutation, useQueryClient } from "@tanstack/react-query";

import { claimQueryKeys } from "@/features/claims/hooks/useClaimDrafts";
import type {
  ClaimDraft,
  CreateClaimItemDraftInput,
  UpdateClaimDraftInput,
  UpdateClaimItemDraftInput
} from "@/features/claims/types";
import {
  attachReceiptMetadataToClaimItem,
  createClaimItemDraft,
  getLatestClaimItem,
  softDeleteClaimDraft,
  softDeleteClaimItem,
  submitClaimDraft,
  updateClaimDraft,
  updateClaimDraftTitle,
  updateClaimItemAmount,
  updateClaimItemDraft
} from "@/local-db/repositories/claimRepository";
import { receiptUploadSummaryQueryKey } from "@/features/receipts/hooks/useReceiptUploadSummary";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";

function useInvalidateClaimData() {
  const queryClient = useQueryClient();

  return (claimId?: string): void => {
    void queryClient.invalidateQueries({
      queryKey: ["claims"]
    });
    void queryClient.invalidateQueries({
      queryKey: claimQueryKeys.drafts
    });
    if (claimId) {
      void queryClient.invalidateQueries({
        queryKey: claimQueryKeys.detail(claimId)
      });
      void queryClient.invalidateQueries({
        queryKey: claimQueryKeys.items(claimId)
      });
    }
    void queryClient.invalidateQueries({
      queryKey: syncQueryKeys.pendingItems
    });
    void queryClient.invalidateQueries({
      queryKey: syncSummaryQueryKey
    });
    void queryClient.invalidateQueries({
      queryKey: receiptUploadSummaryQueryKey
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
    onSuccess: () => invalidate()
  });
}

export function useUpdateClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (input: UpdateClaimDraftInput) =>
      updateClaimDraft(input, deviceId),
    onSuccess: () => invalidate()
  });
}

export function useSubmitClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (claimId: string) => submitClaimDraft(claimId, deviceId),
    onSuccess: () => invalidate()
  });
}

export function useSoftDeleteClaimDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (claimId: string) => softDeleteClaimDraft(claimId, deviceId),
    onSuccess: () => invalidate()
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
    onSuccess: () => invalidate()
  });
}

export function useCreateClaimItemDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (input: CreateClaimItemDraftInput) =>
      createClaimItemDraft(input, deviceId),
    onSuccess: (_item, input) => invalidate(input.claimId)
  });
}

export function useUpdateClaimItemDraft() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (input: UpdateClaimItemDraftInput) =>
      updateClaimItemDraft(input, deviceId),
    onSuccess: (item) => invalidate(item?.claimId)
  });
}

export function useAttachReceiptMetadataToClaimItem() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (input:
      | string
      | {
          fileSize?: number | null;
          itemId: string;
          localUri?: string | null;
          mimeType?: string | null;
        }) => {
      if (typeof input === "string") {
        return attachReceiptMetadataToClaimItem(input, deviceId);
      }

      return attachReceiptMetadataToClaimItem(input.itemId, deviceId, input);
    },
    onSuccess: () => invalidate()
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
    onSuccess: () => invalidate()
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
    onSuccess: () => invalidate()
  });
}

export function useSoftDeleteClaimItem() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateClaimData();

  return useMutation({
    mutationFn: (itemId: string) => softDeleteClaimItem(itemId, deviceId),
    onSuccess: () => invalidate()
  });
}

