import {
  createClaimDraft,
  createClaimItemDraft,
  listClaimDrafts
} from "@/local-db/repositories/claimRepository";
import { listPendingSyncItems } from "@/local-db/repositories/syncQueueRepository";
import type { LocalVerificationResult } from "@/features/verification/types";
import { pushPendingSyncItems } from "@/sync/syncEngine";
import { nowIso } from "@/utils/time";

export async function runLocalFirstSmokeTest(
  deviceId: string
): Promise<LocalVerificationResult> {
  const today = new Date().toISOString().slice(0, 10);
  const pendingBefore = await listPendingSyncItems();
  const timestamp = nowIso();

  const claim = await createClaimDraft(
    {
      title: `Smoke test ${timestamp.slice(11, 19)}`,
      periodStart: today,
      periodEnd: today,
      currency: "MYR"
    },
    deviceId
  );

  const item = await createClaimItemDraft(
    {
      claimId: claim.id,
      title: "Offline persistence smoke item",
      type: "parking",
      amountCents: 100,
      currency: claim.currency,
      itemDate: today,
      notes: "Created by Sprint 1 local verification."
    },
    deviceId
  );

  const pendingAfterCreate = await listPendingSyncItems();
  const claimsAfterCreate = await listClaimDrafts();
  const claimReadBack = claimsAfterCreate.some(
    (draftClaim) => draftClaim.id === claim.id
  );

  const failedNetworkResult = await pushPendingSyncItems({
    deviceId,
    entityIds: [claim.id, item.id],
    limit: 2,
    push: async () => {
      throw new Error("Simulated offline sync failure.");
    }
  });

  const claimsAfterFailedNetwork = await listClaimDrafts();
  const failedNetworkKeptClaim = claimsAfterFailedNetwork.some(
    (draftClaim) => draftClaim.id === claim.id
  );

  return {
    claimId: claim.id,
    itemId: item.id,
    claimReadBack,
    failedNetworkKeptClaim,
    failedNetworkResult,
    pendingBefore: pendingBefore.length,
    pendingAfterCreate: pendingAfterCreate.length
  };
}
