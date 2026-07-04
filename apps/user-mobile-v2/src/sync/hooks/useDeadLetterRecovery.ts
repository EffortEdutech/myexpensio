import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  discardSyncItem,
  listDeadLetterItems,
  retryDeadLetterItem
} from "@/local-db/repositories/syncQueueRepository";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";

export const deadLetterItemsQueryKey = ["sync", "deadLetter"] as const;

/**
 * Lists items that have permanently stopped retrying (retry_count exhausted
 * SYNC_MAX_RETRIES). Backs the Dead Letter Recovery UI — today the "N need
 * attention" badge is informational only; this hook is what lets the user
 * actually see and act on the stuck items behind that count.
 */
export function useDeadLetterItems(enabled = true) {
  return useQuery({
    queryKey: deadLetterItemsQueryKey,
    queryFn: () => listDeadLetterItems(100),
    enabled
  });
}

function useInvalidateDeadLetterQueries() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: deadLetterItemsQueryKey });
    void queryClient.invalidateQueries({ queryKey: syncSummaryQueryKey });
    void queryClient.invalidateQueries({ queryKey: syncQueryKeys.pendingItems });
  };
}

/** Forces one specific dead-letter item back to pending — an explicit retry the user asked for. */
export function useRetryDeadLetterItem() {
  const invalidate = useInvalidateDeadLetterQueries();

  return useMutation({
    mutationFn: (queueId: string) => retryDeadLetterItem(queueId),
    onSuccess: invalidate
  });
}

/** Permanently discards one specific dead-letter item — the user has given up on this edit reaching the server. */
export function useDiscardSyncItem() {
  const invalidate = useInvalidateDeadLetterQueries();

  return useMutation({
    mutationFn: (queueId: string) => discardSyncItem(queueId),
    onSuccess: invalidate
  });
}
