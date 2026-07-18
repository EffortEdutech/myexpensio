// apps/user-mobile-v2/src/features/ai/hooks/useDeferredAiExtraction.ts
//
// AI Capture S2 gap (2026-07-18) — offline-deferred auto-retry.
//
// The sprint plan's original S2 called for: if a receipt/odometer photo is
// scanned while offline, the photo still attaches as normal (unchanged sync
// queue behavior), but the AI auto-fill attempt should defer and surface
// "Auto-fill available" once connectivity returns — not fail immediately
// with a generic error. That was never built; S1/S3 both just attempted
// extraction immediately and showed a generic error on any failure,
// including plain offline.
//
// This hook wraps an extraction call so that when the failure looks like
// "no network connectivity" (the extraction function's `offline: true`
// flag — see isLikelyOfflineError in @/utils/network), it holds the attempt
// as "deferred" instead of surfacing an error, and retries automatically
// the next time the app is foregrounded (native, via AppState) or the
// browser fires 'online' (web) — the same reactive-detection pattern
// useSyncEngine.ts already uses for sync retries. No new dependency
// (no NetInfo / connectivity polling), consistent with AGENTS.md.
//
// Caller contract: pass an extraction function returning
// { fields?: T; error?: string; offline?: boolean }.
//
// Note: "deferred" is transient, in-memory state scoped to whichever
// component owns this hook instance (ReceiptCaptureField / EvidenceCapture).
// It does not persist across the capture form closing or an app restart —
// that's intentional and matches the sprint's actual ask: only the AI
// auto-fill nicety is deferred, and only for as long as the form stays
// open; the photo itself already attaches via the normal sync queue
// regardless of connectivity.

import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

export type DeferredAiStatus = "idle" | "analyzing" | "deferred";

type ExtractResult<T> = { fields?: T; error?: string; offline?: boolean };

export function useDeferredAiExtraction<T>() {
  const [status, setStatus] = useState<DeferredAiStatus>("idle");
  const retryRef = useRef<(() => void) | null>(null);

  async function run(
    extract: () => Promise<ExtractResult<T>>,
    onSuccess: (fields: T) => void,
    onError: (message: string) => void
  ) {
    setStatus("analyzing");
    const result = await extract();

    if (result.fields) {
      retryRef.current = null;
      setStatus("idle");
      onSuccess(result.fields);
      return;
    }

    if (result.offline) {
      // Stash this exact attempt (same extract/onSuccess/onError closure) so
      // reconnecting can retry it verbatim without the caller re-picking a photo.
      retryRef.current = () => void run(extract, onSuccess, onError);
      setStatus("deferred");
      return;
    }

    retryRef.current = null;
    setStatus("idle");
    onError(result.error ?? "AI extraction failed.");
  }

  useEffect(() => {
    function retryIfDeferred() {
      if (retryRef.current) retryRef.current();
    }

    if (Platform.OS === "web") {
      window.addEventListener("online", retryIfDeferred);
      return () => window.removeEventListener("online", retryIfDeferred);
    }

    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") retryIfDeferred();
    });
    return () => sub.remove();
  }, []);

  return { status, run };
}
