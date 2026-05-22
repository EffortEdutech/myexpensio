import { useQuery } from "@tanstack/react-query";

import {
  getClaimDraft,
  listClaimDrafts,
  listClaimItems
} from "@/local-db/repositories/claimRepository";

export const claimQueryKeys = {
  detail: (claimId: string | null) => ["claims", "detail", claimId] as const,
  drafts: ["claims", "drafts"] as const,
  items: (claimId: string | null) => ["claims", "items", claimId] as const
};

export function useClaimDrafts() {
  return useQuery({
    queryKey: claimQueryKeys.drafts,
    queryFn: listClaimDrafts
  });
}

export function useClaimDraft(claimId: string | null) {
  return useQuery({
    enabled: Boolean(claimId),
    queryKey: claimQueryKeys.detail(claimId),
    queryFn: () => getClaimDraft(claimId ?? "")
  });
}

export function useClaimItems(claimId: string | null) {
  return useQuery({
    enabled: Boolean(claimId),
    queryKey: claimQueryKeys.items(claimId),
    queryFn: () => listClaimItems(claimId ?? "")
  });
}

