import { useQuery } from "@tanstack/react-query";

import { listClaimDrafts } from "@/local-db/repositories/claimRepository";

export const claimQueryKeys = {
  drafts: ["claims", "drafts"] as const
};

export function useClaimDrafts() {
  return useQuery({
    queryKey: claimQueryKeys.drafts,
    queryFn: listClaimDrafts
  });
}

