import { useMutation, useQueryClient } from "@tanstack/react-query";

import { exportQueryKeys } from "@/features/exports/hooks/useExports";
import type { CreateExportJobInput } from "@/features/exports/types";
import { createLocalExportJob } from "@/local-db/repositories/exportRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";

function useInvalidateExports() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: ["exports"] });
    void queryClient.invalidateQueries({ queryKey: exportQueryKeys.history });
    void queryClient.invalidateQueries({ queryKey: exportQueryKeys.usage });
    void queryClient.invalidateQueries({ queryKey: syncQueryKeys.pendingItems });
    void queryClient.invalidateQueries({ queryKey: syncSummaryQueryKey });
  };
}

export function useCreateLocalExportJob() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateExports();

  return useMutation({
    mutationFn: (input: CreateExportJobInput) =>
      createLocalExportJob(input, deviceId),
    onSuccess: invalidate
  });
}
