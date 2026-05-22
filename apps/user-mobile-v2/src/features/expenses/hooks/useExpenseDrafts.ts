import { useQuery } from "@tanstack/react-query";

import { listExpenseDrafts } from "@/local-db/repositories/expenseRepository";

export const expenseQueryKeys = {
  drafts: ["expenses", "drafts"] as const
};

export function useExpenseDrafts() {
  return useQuery({
    queryKey: expenseQueryKeys.drafts,
    queryFn: listExpenseDrafts
  });
}

