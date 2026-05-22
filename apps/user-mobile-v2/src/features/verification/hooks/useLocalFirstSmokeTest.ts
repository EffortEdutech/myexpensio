import { useMutation, useQueryClient } from "@tanstack/react-query";

import { claimQueryKeys } from "@/features/claims/hooks/useClaimDrafts";
import { runLocalFirstSmokeTest } from "@/local-db/repositories/localVerificationRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";

export function useLocalFirstSmokeTest() {
  const queryClient = useQueryClient();
  const deviceId = useDeviceStore((state) => state.deviceId);

  return useMutation({
    mutationFn: () => runLocalFirstSmokeTest(deviceId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: claimQueryKeys.drafts
      });
      void queryClient.invalidateQueries({
        queryKey: syncQueryKeys.pendingItems
      });
      void queryClient.invalidateQueries({
        queryKey: syncSummaryQueryKey
      });
    }
  });
}
