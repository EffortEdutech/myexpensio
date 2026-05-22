import type { ClaimDraft, ClaimStatus } from "@/features/claims/types";
import type { SyncEntityType } from "@/sync/types";

export type MergeDecision = "local_wins" | "server_wins" | "merge";

export type ServerChangeEnvelope<TPayload> = {
  entityId: string;
  entityType: SyncEntityType;
  payload: TPayload;
  serverUpdatedAt: string;
};

export function decideClaimMerge(localClaim: ClaimDraft | null): MergeDecision {
  if (!localClaim) {
    return "server_wins";
  }

  if (isServerControlledClaimStatus(localClaim.status)) {
    return "server_wins";
  }

  if (localClaim.syncStatus === "pending" || localClaim.syncStatus === "failed") {
    return "local_wins";
  }

  return "server_wins";
}

export function decideReferenceDataMerge(): MergeDecision {
  return "server_wins";
}

export function decideReceiptMerge(): MergeDecision {
  return "merge";
}

export function isServerControlledClaimStatus(status: ClaimStatus) {
  return status === "submitted" || status === "approved" || status === "rejected" || status === "paid";
}

export function shouldBlockLocalClaimEdit(status: ClaimStatus) {
  return isServerControlledClaimStatus(status);
}

