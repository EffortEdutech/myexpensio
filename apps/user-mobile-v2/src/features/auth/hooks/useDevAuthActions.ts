import { useMutation } from "@tanstack/react-query";

import type { AuthSession } from "@/features/auth/types";
import {
  clearAuthSession,
  saveAuthSession
} from "@/features/auth/sessionStorage";
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
    mutationFn: clearAuthSession,
    onSuccess: () => {
      setSession(null);
    }
  });
}
