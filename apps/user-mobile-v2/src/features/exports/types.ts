import type { SyncStatus } from "@/features/expenses/types";

export type ExportFormat = "CSV" | "PDF" | "XLSX";

export type ExportJobStatus =
  | "local_preview"
  | "queued"
  | "running"
  | "completed"
  | "failed";

export type ExportJob = {
  claimIds: string[];
  createdAt: string;
  currency: string;
  deletedAt: string | null;
  deviceId: string;
  filterStatus: string | null;
  format: ExportFormat;
  id: string;
  localUri: string | null;
  previewPayload: ExportPreviewPayload | null;
  rowCount: number;
  status: ExportJobStatus;
  syncStatus: SyncStatus;
  templateName: string | null;
  tngAppendixPayload: TngAppendixPreview[];
  totalAmountCents: number;
  updatedAt: string;
};

export type ExportPreviewClaim = {
  currency: string;
  id: string;
  itemCount: number;
  periodEnd: string | null;
  periodStart: string | null;
  status: string;
  title: string | null;
  totalAmountCents: number;
};

export type ExportPreviewRow = {
  amountCents: number;
  claimId: string;
  claimTitle: string;
  currency: string;
  itemDate: string;
  itemId: string;
  itemType: string;
  notes: string | null;
  paidViaTng: boolean;
  receiptPresent: boolean;
  title: string;
  tngTransNo: string | null;
};

export type ExportPreviewPayload = {
  claims: ExportPreviewClaim[];
  generatedAt: string;
  rows: ExportPreviewRow[];
};

export type TngAppendixPreview = {
  hasSourcePdf: boolean;
  statementLabel: string;
  totalAmountCents: number;
  transactionCount: number;
  uploadBatchId: string | null;
};

export type ExportUsageSummary = {
  exportsCreated: number;
  limit: number | null;
  periodEnd: string;
  periodStart: string;
  tier: "FREE" | "PREMIUM" | "PRO";
};

export type CreateExportJobInput = {
  claimIds: string[];
  format: ExportFormat;
  templateName?: string | null;
};
