// apps/user-mobile-v2/src/features/ai/hooks/useByokGeminiKey.ts
//
// Reactive read of the locally-stored BYOK Gemini key (see byokKeyStore.ts).
// Shared between ReceiptCaptureField (to decide whether to bypass the tier
// gate + call Gemini directly) and the Settings screen (to show save/remove
// state). React Query just gives us cross-component cache + invalidation
// for what is otherwise a plain expo-secure-store read.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getGeminiKey } from "@/features/ai/byokKeyStore";

export const BYOK_GEMINI_KEY_QUERY_KEY = ["byok-gemini-key"] as const;

export function useByokGeminiKey() {
  return useQuery({
    queryKey: BYOK_GEMINI_KEY_QUERY_KEY,
    queryFn: getGeminiKey,
    staleTime: Infinity,
  });
}

/** Call after save/remove so every screen using the key re-reads immediately. */
export function useInvalidateByokGeminiKey() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: BYOK_GEMINI_KEY_QUERY_KEY });
}
