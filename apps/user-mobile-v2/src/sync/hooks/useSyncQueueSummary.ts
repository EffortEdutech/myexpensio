import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getSyncQueueSummary,
  retryFailedSyncItems
} from "@/local-db/repositories/syncQueueRepository";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";

export const syncSummaryQueryKey = ["sync", "summary"] as const;

export function useSyncQueueSummary() {
  return useQuery({
    queryKey: syncSummaryQueryKey,
    queryFn: getSyncQueueSummary
  });
}

export function useRetryFailedSyncItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => retryFailedSyncItems(100),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: syncSummaryQueryKey
      });
      void queryClient.invalidateQueries({
        queryKey: syncQueryKeys.pendingItems
      });
    }
  });
}

