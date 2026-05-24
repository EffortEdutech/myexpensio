import { useQuery } from "@tanstack/react-query";

import {
  buildExportPreview,
  getExportUsageSummary,
  listExportJobs
} from "@/local-db/repositories/exportRepository";

export const exportQueryKeys = {
  history: ["exports", "history"] as const,
  preview: (claimIds: string[]) => ["exports", "preview", claimIds] as const,
  usage: ["exports", "usage"] as const
};

export function useExportJobs() {
  return useQuery({
    queryFn: listExportJobs,
    queryKey: exportQueryKeys.history
  });
}

export function useExportUsageSummary() {
  return useQuery({
    queryFn: getExportUsageSummary,
    queryKey: exportQueryKeys.usage
  });
}

export function useExportPreview(claimIds: string[]) {
  return useQuery({
    enabled: claimIds.length > 0,
    queryFn: () => buildExportPreview(claimIds),
    queryKey: exportQueryKeys.preview(claimIds)
  });
}
