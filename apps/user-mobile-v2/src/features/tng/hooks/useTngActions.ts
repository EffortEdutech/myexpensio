import { useMutation, useQueryClient } from "@tanstack/react-query";

import { tngQueryKeys } from "@/features/tng/hooks/useTngLibrary";
import type { SaveTngPreviewInput } from "@/features/tng/types";
import {
  saveTngPreview,
  softDeleteTngStatementBatch
} from "@/local-db/repositories/tngRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";

function useInvalidateTng() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ["tng"] });
    void queryClient.invalidateQueries({ queryKey: tngQueryKeys.batches });
    void queryClient.invalidateQueries({ queryKey: tngQueryKeys.summary });
    void queryClient.invalidateQueries({ queryKey: syncQueryKeys.pendingItems });
    void queryClient.invalidateQueries({ queryKey: syncSummaryQueryKey });
  };
}

export function useSaveTngPreview() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTng();

  return useMutation({
    mutationFn: (input: SaveTngPreviewInput) => saveTngPreview(input, deviceId),
    onSuccess: invalidate
  });
}

export function useSoftDeleteTngStatementBatch() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTng();

  return useMutation({
    mutationFn: (batchId: string) => softDeleteTngStatementBatch(batchId, deviceId),
    onSuccess: invalidate
  });
}
