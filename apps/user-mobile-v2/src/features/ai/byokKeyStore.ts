// apps/user-mobile-v2/src/features/ai/byokKeyStore.ts
//
// AI Capture Sprint 5 — Bring-Your-Own-Key (BYOK) storage.
//
// Per docs/02-product-specs/02_AI_ASSISTANT_AUTOMATION_SPEC.md Addendum A and
// docs/03-sprint-plans/ai-capture/01_SPRINT_PLAN_AI_CAPTURE.md Sprint 5:
// the key is stored CLIENT-SIDE ONLY (expo-secure-store on native, browser
// secure storage on web) and is NEVER sent to or stored by myexpensio's
// servers. When present, the client calls Gemini directly (see
// geminiDirectClient.ts), bypassing /api/ai/* and the shared-key quota
// entirely. This is by design — no new DB table, no server changes needed
// for the key itself.

import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "myexpensio-byok-gemini-key";

// expo-secure-store is native-only (iOS Keychain / Android Keystore). On web,
// fall back to localStorage — not as strong as an OS keychain, but the key
// still never leaves the device or touches our servers, which is the actual
// privacy/cost guarantee this feature makes.
export async function saveGeminiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, trimmed);
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, trimmed);
}

export async function getGeminiKey(): Promise<string | null> {
  if (Platform.OS === "web") {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  }
  return SecureStore.getItemAsync(STORAGE_KEY);
}

export async function clearGeminiKey(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

/** Last 4 characters only — for display, never show the full saved key again. */
export function maskGeminiKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 4) return "••••";
  return `••••••••${trimmed.slice(-4)}`;
}
