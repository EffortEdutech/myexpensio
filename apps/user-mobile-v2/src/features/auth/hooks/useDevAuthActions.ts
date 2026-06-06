import { useMutation } from "@tanstack/react-query";

import type { AuthSession } from "@/features/auth/types";
import {
  clearAuthSession,
  saveAuthSession
} from "@/features/auth/sessionStorage";
import { wipeLocalDatabase } from "@/local-db/database";
import { bootstrapLocalUserShell } from "@/local-db/repositories/userShellBootstrapRepository";
import { useAuthStore } from "@/state/authStore";
import { useDeviceStore } from "@/state/deviceStore";
import { createId } from "@/utils/ids";

export function useDevSignIn() {
  const setSession = useAuthStore((state) => state.setSession);
  const deviceId = useDeviceStore((state) => state.deviceId);

  return useMutation({
    mutationFn: async (email: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const session: AuthSession = {
        accessToken: `dev_access_${createId("token")}`,
        refreshToken: `dev_refresh_${createId("token")}`,
        expiresAt: null,
        userId: `dev_user_${normalizedEmail || "local"}`,
        email: normalizedEmail || "local.user@myexpensio.test"
      };

      await saveAuthSession(session);
      await bootstrapLocalUserShell(session, deviceId);
      return session;
    },
    onSuccess: (session) => {
      setSession(session);
    }
  });
}

export function useSignOut() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: async () => {
      // Wipe local financial data first, then clear the auth token.
      // Order matters: if wipe fails we don't want a logged-out state
      // with stale data that can't be cleaned up on next login.
      await wipeLocalDatabase();
      await clearAuthSession();
    },
    onSuccess: () => {
      setSession(null);
    }
  });
}
