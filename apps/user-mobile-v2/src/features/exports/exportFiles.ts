import { Platform } from "react-native";

import type { ExportFormat, ExportPreviewPayload } from "@/features/exports/types";

type DownloadFileInput = {
  content: string;
  filename: string;
  mimeType: string;
};

const csvColumns = [
  { key: "claimId", label: "Claim ID" },
  { key: "claimTitle", label: "Claim Title" },
  { key: "itemId", label: "Item ID" },
  { key: "itemType", label: "Item Type" },
  { key: "itemDate", label: "Item Date" },
  { key: "title", label: "Description" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "receiptPresent", label: "Receipt" },
  { key: "paidViaTng", label: "Paid via TNG" },
  { key: "tngTransNo", label: "TNG Transaction No" },
  { key: "notes", label: "Notes" }
] as const;

export function buildCsvExport(payload: ExportPreviewPayload) {
  const header = csvColumns.map((column) => escapeCsvCell(column.label));
  const rows = payload.rows.map((row) =>
    [
      row.claimId,
      row.claimTitle,
      row.itemId,
      row.itemType,
      row.itemDate,
      row.title,
      row.currency,
      (row.amountCents / 100).toFixed(2),
      row.receiptPresent ? "Yes" : "No",
      row.paidViaTng ? "Yes" : "No",
      row.tngTransNo ?? "",
      row.notes ?? ""
    ].map(escapeCsvCell)
  );

  return [header, ...rows].map((cells) => cells.join(",")).join("\r\n");
}

export function exportFilename(format: ExportFormat, generatedAt: string) {
  const dateStamp = generatedAt.slice(0, 10).replaceAll("-", "");
  const extension = format.toLowerCase();

  return `myexpensio_claim_${dateStamp}.${extension}`;
}

export function downloadCsvExport(payload: ExportPreviewPayload) {
  const content = buildCsvExport(payload);

  downloadTextFile({
    content: `\uFEFF${content}`,
    filename: exportFilename("CSV", payload.generatedAt),
    mimeType: "text/csv;charset=utf-8"
  });
}

function downloadTextFile({ content, filename, mimeType }: DownloadFileInput) {
  if (Platform.OS !== "web") {
    throw new Error("CSV file download is currently available in the web build only.");
  }

  const webWindow = globalThis as typeof globalThis & {
    Blob?: typeof Blob;
    URL?: typeof URL;
    document?: Document;
  };

  if (!webWindow.Blob || !webWindow.URL || !webWindow.document) {
    throw new Error("This browser cannot create the export file.");
  }

  const blob = new webWindow.Blob([content], { type: mimeType });
  const url = webWindow.URL.createObjectURL(blob);
  const anchor = webWindow.document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  webWindow.document.body.appendChild(anchor);
  anchor.click();
  webWindow.document.body.removeChild(anchor);
  webWindow.URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }

  return value;
}
