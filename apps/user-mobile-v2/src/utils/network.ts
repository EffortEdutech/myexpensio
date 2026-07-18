// apps/user-mobile-v2/src/utils/network.ts
//
// Shared "does this error look like the device has no network connectivity"
// classifier. Reactive-detection only, mirroring useSyncEngine.ts's
// isNetworkError() — no NetInfo/connectivity-polling dependency, consistent
// with this codebase's zero-new-dependency convention (AGENTS.md). Not
// merged with useSyncEngine's private copy to avoid touching working sync
// code for an unrelated feature; if a third caller needs this, promote both
// to share one implementation then.
//
// AI Capture S2 gap (2026-07-18) — the sprint plan called for AI receipt/
// odometer scanning to defer + auto-retry when the device is offline,
// rather than surfacing a generic "AI extraction failed" error. This
// classifier is what tells the retry hook (useDeferredAiExtraction) whether
// a given failure is "no connectivity — defer and retry later" or a real
// error to show now (bad key, server 500, low-confidence read, etc).
export function isLikelyOfflineError(message: string): boolean {
  const msg = message.toLowerCase();
  return (
    msg.includes("network request failed") || // React Native's fetch polyfill
    msg.includes("failed to fetch") || // Web fetch (Chrome/Safari wording)
    msg.includes("networkerror") || // Web fetch (Firefox wording)
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  );
}
