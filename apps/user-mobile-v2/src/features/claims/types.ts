import type { SyncStatus } from "@/features/expenses/types";

export type ClaimStatus = "draft" | "submitted" | "approved" | "rejected" | "paid";

export type ClaimItemType =
  | "toll"
  | "parking"
  | "taxi"
  | "grab"
  | "train"
  | "bus"
  | "flight"
  | "mileage"
  | "meal"
  | "lodging"
  | "per_diem"
  | "other";

export type ClaimDraft = {
  id: string;
  spaceId: string | null;
  title: string | null;
  status: ClaimStatus;
  periodStart: string | null;
  periodEnd: string | null;
  totalAmountCents: number;
  currency: string;
  submittedAt: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type ClaimItemDraft = {
  id: string;
  claimId: string;
  type: ClaimItemType;
  mode: string | null;
  title: string;
  amountCents: number;
  currency: string;
  itemDate: string;
  notes: string | null;
  receiptId: string | null;
  tripId: string | null;
  tngTransactionId: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type CreateClaimDraftInput = {
  title?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  currency?: string;
  spaceId?: string | null;
};

export type CreateClaimItemDraftInput = {
  claimId: string;
  type: ClaimItemType;
  title: string;
  amountCents: number;
  currency?: string;
  itemDate: string;
  mode?: string | null;
  notes?: string | null;
  receiptId?: string | null;
  tripId?: string | null;
  tngTransactionId?: string | null;
};

export type UpdateClaimDraftInput = {
  claimId: string;
  periodEnd?: string | null;
  periodStart?: string | null;
  title?: string | null;
};

export type UpdateClaimItemDraftInput = {
  amountCents?: number;
  itemDate?: string;
  mode?: string | null;
  itemId: string;
  notes?: string | null;
  receiptId?: string | null;
  tngTransactionId?: string | null;
  title?: string;
  type?: ClaimItemType;
};

