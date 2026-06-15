/**
 * buildLocalPdf.web.ts
 *
 * Web replacement for buildLocalPdf.ts.
 * Metro resolves this file on web instead of the native version.
 *
 * Instead of saving to expo-file-system (unavailable on web),
 * we fetch the PDF from the backend and trigger a browser download via a blob URL.
 */

import type { ExportPreviewPayload, TngAppendixPreview } from "@/features/exports/types";
import type { BuildLocalPdfOptions, BuildLocalPdfResult } from "./buildLocalPdf";

export type { BuildLocalPdfOptions, BuildLocalPdfResult };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export async function buildLocalPdf(
  payload: ExportPreviewPayload,
  _appendices: TngAppendixPreview[],
  _options: BuildLocalPdfOptions = {},
  accessToken?: string
): Promise<BuildLocalPdfResult> {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured.");
  if (!accessToken) throw new Error("Not authenticated — cannot generate PDF.");

  const claimIds = payload.claims.map((c) => c.id);
  if (claimIds.length === 0) throw new Error("No claims selected.");

  const response = await fetch(`${API_BASE_URL}/api/exports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      claim_ids:          claimIds,
      format:             "PDF",
      pdf_layout:         _options.pdfLayout ?? "BY_DATE",
      signature_data_url: _options.signatureDataUrl ?? null,
      mobile_payload:     payload,
      // Web cannot read local TNG PDFs — backend fetches from Supabase Storage instead
      mobile_tng_statements: [],
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`PDF generation failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const dateStamp = payload.generatedAt.slice(0, 10).replaceAll("-", "");
  const filename = `myexpensio_claim_${dateStamp}.pdf`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return {
    uri: "web-download",
    pageCount: 0,
    tngPagesAdded: 0,
    highlightsAdded: 0,
  };
}
