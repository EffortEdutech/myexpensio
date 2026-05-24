import type { ClaimItemDraft } from "@/features/claims/types";
import type { TngSector, TngTransaction } from "@/features/tng/types";

export type TngMatchCandidate = {
  claimItem: ClaimItemDraft;
  reasons: string[];
  score: number;
  transaction: TngTransaction;
};

const compatibleClaimTypes: Record<TngSector, string[]> = {
  PARKING: ["parking"],
  RETAIL: ["grab", "taxi", "train", "bus"],
  TOLL: ["toll"]
};

export function matchTngToClaimItems(
  transactions: TngTransaction[],
  claimItems: ClaimItemDraft[]
) {
  return transactions
    .filter((transaction) => !transaction.claimed)
    .flatMap((transaction) =>
      claimItems
        .filter((item) => !item.tngTransactionId)
        .map((item) => scorePair(transaction, item))
        .filter((candidate): candidate is TngMatchCandidate =>
          Boolean(candidate && candidate.score >= 60)
        )
    )
    .sort((left, right) => right.score - left.score);
}

export function scorePair(
  transaction: TngTransaction,
  claimItem: ClaimItemDraft
): TngMatchCandidate | null {
  if (!isCompatibleSector(transaction.sector, claimItem.type)) {
    return null;
  }

  let score = 35;
  const reasons = [`${sectorLabel(transaction.sector)} matches claim item type`];

  const amountDelta = Math.abs(transaction.amountCents - claimItem.amountCents);
  if (amountDelta === 0) {
    score += 35;
    reasons.push("amount matches exactly");
  } else if (amountDelta <= 100) {
    score += 20;
    reasons.push("amount is within MYR 1.00");
  } else if (amountDelta <= 300) {
    score += 10;
    reasons.push("amount is close");
  }

  const dayDelta = Math.abs(
    daysBetween(transaction.transactionDate, claimItem.itemDate)
  );
  if (dayDelta === 0) {
    score += 20;
    reasons.push("same date");
  } else if (dayDelta <= 1) {
    score += 12;
    reasons.push("within one day");
  } else if (dayDelta <= 3) {
    score += 5;
    reasons.push("within three days");
  }

  const locationText = [
    transaction.entryLocation,
    transaction.exitLocation,
    transaction.location
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const claimText = `${claimItem.title} ${claimItem.notes ?? ""}`.toLowerCase();

  if (locationText && claimText) {
    const tokens = locationText
      .split(/[^a-z0-9]+/i)
      .filter((token) => token.length >= 4);
    if (tokens.some((token) => claimText.includes(token))) {
      score += 10;
      reasons.push("location text looks related");
    }
  }

  return {
    claimItem,
    reasons,
    score: Math.min(score, 100),
    transaction
  };
}

export function isCompatibleSector(sector: TngSector, claimItemType: string) {
  return compatibleClaimTypes[sector].includes(claimItemType.toLowerCase());
}

export function sectorLabel(sector: TngSector) {
  if (sector === "TOLL") {
    return "Toll";
  }

  if (sector === "PARKING") {
    return "Parking";
  }

  return "Retail transport";
}

function daysBetween(left: string, right: string) {
  const leftDate = new Date(`${left.slice(0, 10)}T00:00:00+08:00`);
  const rightDate = new Date(`${right.slice(0, 10)}T00:00:00+08:00`);

  return Math.round(
    (leftDate.getTime() - rightDate.getTime()) / (24 * 60 * 60 * 1000)
  );
}
