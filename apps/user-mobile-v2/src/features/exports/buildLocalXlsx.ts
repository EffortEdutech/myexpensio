/**
 * buildLocalXlsx.ts
 *
 * Delegates XLSX generation to the V1 backend POST /api/exports.
 * Mobile sends its local SQLite data as mobile_payload — backend maps it
 * to ClaimForExport[] and calls buildExport(shaped, 'XLSX').
 *
 * File saved to: documentDirectory/exports/myexpensio_claim_YYYYMMDD.xlsx
 */

import * as FileSystem from "expo-file-system/legacy";

import type { ExportPreviewPayload } from "@/features/exports/types";

const API_BASE_URL = (process.env as Record<string, string | undefined>)["EXPO_PUBLIC_API_BASE_URL"] ?? "";

export type BuildLocalXlsxResult = {
  uri: string;
};

export async function buildLocalXlsx(
  payload: ExportPreviewPayload,
  accessToken?: string,
): Promise<BuildLocalXlsxResult> {
  if (!API_BASE_URL) throw new Error("API_BASE_URL is not configured.");
  if (!accessToken) throw new Error("Not authenticated — cannot generate XLSX.");

  const claimIds = payload.claims.map((c) => c.id);
  if (claimIds.length === 0) throw new Error("No claims selected.");

  console.log("[buildLocalXlsx] calling backend for", claimIds.length, "claim(s)...");

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
    console.error("[buildLocalXlsx] backend error:", response.status, text.slice(0, 300));
    throw new Error(`XLSX generation failed (${response.status}): ${text.slice(0, 200)}`);
  }

  console.log("[buildLocalXlsx] backend returned XLSX, saving...");

  const arrayBuffer = await response.arrayBuffer();
  const base64 = arrayBufferToBase64(new Uint8Array(arrayBuffer));

  const dir = `${FileSystem.documentDirectory}exports/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const dateStamp = payload.generatedAt.slice(0, 10).replaceAll("-", "");
  const fileUri = `${dir}myexpensio_claim_${dateStamp}.xlsx`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  console.log("[buildLocalXlsx] saved to:", fileUri);
  return { uri: fileUri };
}

function arrayBufferToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...Array.from(chunk));
  }
  return btoa(binary);
}
