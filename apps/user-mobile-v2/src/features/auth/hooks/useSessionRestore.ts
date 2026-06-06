import { useEffect } from "react";
import { AppState } from "react-native";

import { clearAuthSession, loadAuthSession } from "@/features/auth/sessionStorage";
import { refreshSupabaseSession } from "@/features/auth/hooks/useAuthActions";
import { wipeLocalDatabase } from "@/local-db/database";
import { useAuthStore } from "@/state/authStore";

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

function isSessionExpiredOrExpiringSoon(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return Date.now() >= new Date(expiresAt).getTime() - TOKEN_REFRESH_BUFFER_MS;
}

async function loadAndValidateSession() {
  const session = await loadAuthSession();
  if (!session) return null;

  if (isSessionExpiredOrExpiringSoon(session.expiresAt)) {
    try {
      const refreshed = await refreshSupabaseSession();
      if (!refreshed) {
        await wipeLocalDatabase();
        await clearAuthSession();
        return null;
      }
      return refreshed;
    } catch {
      // Invalid/expired refresh token — sign out cleanly
      await wipeLocalDatabase();
      await clearAuthSession();
      return null;
    }
  }

  return session;
}

export function useSessionRestore() {
  const setSession = useAuthStore((state) => state.setSession);
  const status = useAuthStore((state) => state.status);

  // Restore + validate on mount
  useEffect(() => {
    let isMounted = true;

    loadAndValidateSession()
      .then((session) => { if (isMounted) setSession(session); })
      .catch(() => { if (isMounted) setSession(null); });

    return () => { isMounted = false; };
  }, [setSession]);

  // Re-validate on app foreground
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") return;
      loadAndValidateSession()
        .then((session) => setSession(session))
        .catch(() => setSession(null));
    });
    return () => sub.remove();
  }, [setSession]);

  return status;
}
