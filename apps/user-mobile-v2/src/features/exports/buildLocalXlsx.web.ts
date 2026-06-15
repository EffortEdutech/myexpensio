/**
 * buildLocalXlsx.web.ts
 *
 * Web replacement for buildLocalXlsx.ts.
 * Metro resolves this file on web instead of the native version.
 *
 * Instead of saving to expo-file-system, triggers a browser download via blob URL.
 */

import type { ExportPreviewPayload } from "@/features/exports/types";
import type { BuildLocalXlsxResult } from "./buildLocalXlsx";

export type { BuildLocalXlsxResult };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export async function buildLocalXlsx(
  payload: ExportPreviewPayload,
  accessToken?: string
): Promise<BuildLocalXlsxResult> {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured.");
  if (!accessToken) throw new Error("Not authenticated — cannot generate XLSX.");

  const claimIds = payload.claims.map((c) => c.id);
  if (claimIds.length === 0) throw new Error("No claims selected.");

  const response = await fetch(`${API_BASE_URL}/api/exports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      claim_ids:      claimIds,
      format:         "XLSX",
      mobile_payload: payload,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`XLSX generation failed (${response.status}): ${text.slice(0, 200)}`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const dateStamp = payload.generatedAt.slice(0, 10).replaceAll("-", "");
  const filename = `myexpensio_claim_${dateStamp}.xlsx`;

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return { uri: "web-download" };
}
