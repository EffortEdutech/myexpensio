import type { SyncStatus } from "@/features/expenses/types";

export type TngSector = "TOLL" | "PARKING" | "RETAIL";

export type TngLinkStatus = "unlinked" | "linked" | "ignored";

export type TngStatementBatch = {
  id: string;
  statementId: string | null;
  label: string;
  sourceFileName: string | null;
  sourceFileUri: string | null;
  importedAt: string;
  transactionCount: number;
  totalAmountCents: number;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type TngTransaction = {
  id: string;
  uploadBatchId: string | null;
  statementId: string | null;
  statementLabel: string | null;
  transNo: string | null;
  sector: TngSector;
  amountCents: number;
  currency: string;
  transactionDate: string;
  entryDatetime: string | null;
  exitDatetime: string | null;
  entryLocation: string | null;
  exitLocation: string | null;
  location: string | null;
  rawPayload: string | null;
  dedupeKey: string | null;
  claimed: boolean;
  linkedClaimId: string | null;
  claimItemId: string | null;
  linkStatus: TngLinkStatus;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deviceId: string;
};

export type TngParsedRow = {
  amountCents: number;
  currency?: string;
  entryDatetime?: string | null;
  entryLocation?: string | null;
  exitDatetime?: string | null;
  exitLocation?: string | null;
  location?: string | null;
  rawPayload?: Record<string, unknown> | null;
  sector: TngSector;
  transactionDate: string;
  transNo?: string | null;
};

export type SaveTngPreviewInput = {
  label: string;
  rows: TngParsedRow[];
  sourceFileName?: string | null;
  sourceFileUri?: string | null;
  statementId?: string | null;
};

export type TngTransactionFilters = {
  claimed?: "all" | "claimed" | "unclaimed";
  sector?: "ALL" | TngSector;
};

export type TngLibrarySummary = {
  batches: number;
  claimed: number;
  totalAmountCents: number;
  transactions: number;
  unclaimed: number;
};
