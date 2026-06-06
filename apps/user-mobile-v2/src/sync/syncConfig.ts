import { Platform } from "react-native";

/**
 * Base URL for the sync API (apps/user Next.js backend).
 * On web dev, same origin. On native, point to the deployed or local host.
 */
export function getSyncBaseUrl(): string {
  if (Platform.OS === "web") {
    // Same origin as the Expo web dev server proxying to Next.js
    return "";
  }
  // For native builds, set EXPO_PUBLIC_API_BASE_URL in .env
  return (
    (process.env as Record<string, string | undefined>)["EXPO_PUBLIC_API_BASE_URL"] ??
    "https://myexpensio-jade.vercel.app"
  );
}

export const SYNC_PUSH_LIMIT = 50;
export const SYNC_PULL_SCOPE = "global";
export const SYNC_RETRY_DELAY_MS = 5_000;
export const SYNC_MAX_RETRIES = 3;
export const SYNC_PERIODIC_INTERVAL_MS = 60_000; // 1 min
