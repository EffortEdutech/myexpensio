// apps/user-mobile-v2/src/features/claims/voiceClaimApi.ts
//
// AI Capture Sprint 4 (mobile) — 2026-07-18. Calls the same
// /api/ai/parse-voice-claim endpoint apps/user's route.ts exposes. Mirrors
// ClaimDetail.tsx's extractReceiptFields() (shared-key path) for a local
// audio file URI instead of an image. Kept out of ClaimDetail.tsx (already
// a very large file) since voice entry has its own dedicated component tree
// under features/voice + features/claims/components/VoiceClaimEntry.tsx.

import * as FileSystem from "expo-file-system/legacy";

import type { AiExtractedFields } from "@/features/claims/components/ClaimDetail";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { isLikelyOfflineError } from "@/utils/network";

export async function parseVoiceClaimFields(
  localUri: string,
  mimeType: string,
  accessToken: string
): Promise<{ fields?: AiExtractedFields; error?: string; offline?: boolean }> {
  try {
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    let response: Response;
    try {
      response = await fetch(`${getSyncBaseUrl()}/api/ai/parse-voice-claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ audio: base64, mimeType }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const rawText = await response.text();
    let json: Record<string, unknown>;
    try {
      json = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : {};
    } catch {
      json = {};
    }

    if (!response.ok) {
      const message =
        (json?.error as { message?: string } | undefined)?.message ??
        `AI extraction failed (HTTP ${response.status}).`;
      console.warn("[VoiceClaimEntry] AI extraction declined:", response.status, json);
      return { error: message };
    }

    return { fields: json as unknown as AiExtractedFields };
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      return { error: "AI extraction timed out. Please try again or enter this claim manually." };
    }
    const rawMessage = (e as Error)?.message ?? "";
    console.warn("[VoiceClaimEntry] AI extraction error:", rawMessage);
    if (isLikelyOfflineError(rawMessage)) {
      return { error: "You're offline — this will parse once you're back online.", offline: true };
    }
    return { error: rawMessage || "AI extraction failed." };
  }
}
