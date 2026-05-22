import { useQuery } from "@tanstack/react-query";

import { listPendingSyncItems } from "@/local-db/repositories/syncQueueRepository";

export const syncQueryKeys = {
  pendingItems: ["sync", "pending-items"] as const
};

export function usePendingSyncItems() {
  return useQuery({
    queryKey: syncQueryKeys.pendingItems,
    queryFn: () => listPendingSyncItems(100)
  });
}

