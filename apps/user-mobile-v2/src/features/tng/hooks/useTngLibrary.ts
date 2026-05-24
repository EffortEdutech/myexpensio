import { useQuery } from "@tanstack/react-query";

import type { TngTransactionFilters } from "@/features/tng/types";
import {
  getTngLibrarySummary,
  listTngStatementBatches,
  listTngTransactions
} from "@/local-db/repositories/tngRepository";

export const tngQueryKeys = {
  batches: ["tng", "batches"] as const,
  summary: ["tng", "summary"] as const,
  transactions: (filters: TngTransactionFilters) =>
    ["tng", "transactions", filters] as const
};

export function useTngStatementBatches() {
  return useQuery({
    queryFn: listTngStatementBatches,
    queryKey: tngQueryKeys.batches
  });
}

export function useTngTransactions(filters: TngTransactionFilters) {
  return useQuery({
    queryFn: () => listTngTransactions(filters),
    queryKey: tngQueryKeys.transactions(filters)
  });
}

export function useTngLibrarySummary() {
  return useQuery({
    queryFn: getTngLibrarySummary,
    queryKey: tngQueryKeys.summary
  });
}
