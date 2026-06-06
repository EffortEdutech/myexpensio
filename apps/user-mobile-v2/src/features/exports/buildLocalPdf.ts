/**
 * buildLocalPdf.ts
 *
 * Delegates PDF generation to the V1 backend endpoint POST /api/exports.
 *
 * Why server-side, not on-device:
 *   - expo-print base64:true only works on iOS (Android returns undefined)
 *   - expo-file-system cannot access /cache/Print/ inside Expo Go sandbox
 *   - The backend already runs PDFKit + TNG highlight + pdf-lib merge (V1 code)
 *   - Mobile just saves the returned PDF bytes to documentDirectory and shares
 *
 * TNG attachment:
 *   V1 backend fetches TNG statement PDFs from Supabase Storage (source_file_url)
 *   and calls the Render.com scan service to highlight claimed rows.
 *   PRO/PREMIUM users who sync have their TNG PDFs in Supabase Storage automatically.
 *
 * File location on device:
 *   documentDirectory/exports/myexpensio_claim_YYYYMMDD.pdf
 *   This is inside the app's permanent storage — survives app restarts.
 *   Shared via expo-sharing (Android share sheet / iOS share sheet).
 */

import * as FileSystem from "expo-file-system/legacy";

import type { ExportPreviewPayload, TngAppendixPreview } from "@/features/exports/types";

const API_BASE_URL = (process.env as Record<string, string | undefined>)["EXPO_PUBLIC_API_BASE_URL"] ?? "";

export type BuildLocalPdfOptions = {
  claimerName?: string;
  orgName?: string;
};

export type BuildLocalPdfResult = {
  uri: string;
  pageCount: number;
  tngPagesAdded: number;
  highlightsAdded: number;
};

// ── Public entry ──────────────────────────────────────────────────────────────

export async function buildLocalPdf(
  payload: ExportPreviewPayload,
  _appendices: TngAppendixPreview[],
  _options: BuildLocalPdfOptions = {},
  accessToken?: string
): Promise<BuildLocalPdfResult> {

  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured.");
  if (!accessToken)  throw new Error("Not authenticated — cannot generate PDF.");

  const claimIds = payload.claims.map((c) => c.id);
  if (claimIds.length === 0) throw new Error("No claims selected.");

  // ── Read local TNG statement PDFs ────────────────────────────────────────
  // Send bytes to backend so it can highlight + merge them server-side.
  const mobileTngStatements: Array<{
    statementLabel: string;
    pdfBase64: string;
    items: Array<{ transNo: string; amountCents: number }>;
  }> = [];

  for (const appendix of _appendices.filter((a) => a.hasSourcePdf && a.sourceFileUri)) {
    try {
      const pdfBase64 = await readTngPdfBase64(appendix.sourceFileUri!);
      if (pdfBase64) {
        mobileTngStatements.push({
          statementLabel: appendix.statementLabel,
          pdfBase64,
          items: appendix.items,
        });
        console.log("[buildLocalPdf] TNG statement loaded:", appendix.statementLabel);
      }
    } catch (e) {
      console.warn("[buildLocalPdf] could not read TNG PDF:", appendix.sourceFileUri, e);
    }
  }

  console.log("[buildLocalPdf] calling backend for", claimIds.length, "claim(s),", mobileTngStatements.length, "TNG statement(s)...");

  // ── Step 1: Call backend PDF endpoint ────────────────────────────────────
  // mobile_payload — local SQLite data (no Supabase query needed)
  // mobile_tng_statements — TNG PDF bytes for highlight + merge server-side
  const response = await fetch(`${API_BASE_URL}/api/exports`, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      claim_ids:             claimIds,
      format:                "PDF",
      mobile_payload:        payload,
      mobile_tng_statements: mobileTngStatements,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("[buildLocalPdf] backend error:", response.status, text.slice(0, 300));
    throw new Error(`PDF generation failed (${response.status}): ${text.slice(0, 200)}`);
  }

  console.log("[buildLocalPdf] backend returned PDF, saving...");

  // ── Step 2: Get PDF bytes from response ──────────────────────────────────
  const arrayBuffer = await response.arrayBuffer();
  const base64      = arrayBufferToBase64(new Uint8Array(arrayBuffer));

  // ── Step 3: Save to documentDirectory/exports/ ───────────────────────────
  // documentDirectory is always accessible in Expo Go and standalone builds.
  const dir = `${FileSystem.documentDirectory}exports/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const dateStamp = payload.generatedAt.slice(0, 10).replaceAll("-", "");
  const fileUri   = `${dir}myexpensio_claim_${dateStamp}.pdf`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log("[buildLocalPdf] saved to:", fileUri);

  return {
    uri:             fileUri,
    pageCount:       0,   // not available from HTTP response
    tngPagesAdded:   0,   // backend handles this transparently
    highlightsAdded: 0,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Read a local TNG statement PDF and return its base64 content.
 * Resolves local://tng/{filename} → documentDirectory/tng-statements/{filename}
 */
async function readTngPdfBase64(sourceFileUri: string): Promise<string | null> {
  let fileUri = sourceFileUri;
  if (sourceFileUri.startsWith("local://tng/")) {
    const filename = sourceFileUri.replace("local://tng/", "");
    fileUri = `${FileSystem.documentDirectory}tng-statements/${filename}`;
  }
  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists) {
    console.warn("[buildLocalPdf] TNG PDF not found at:", fileUri);
    return null;
  }
  return FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

/**
 * Convert Uint8Array to base64 string.
 * Processes in 8 KB chunks to avoid stack overflow on large PDFs.
 */
function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}
