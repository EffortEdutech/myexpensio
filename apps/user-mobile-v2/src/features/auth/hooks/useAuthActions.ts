/**
 * Real Supabase auth actions.
 *
 * Replaces useDevSignIn / useSignOut from useDevAuthActions.ts.
 * Uses @supabase/supabase-js signInWithPassword + signOut.
 */
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { wipeLocalDatabase } from "@/local-db/database";
import { bootstrapLocalUserShell } from "@/local-db/repositories/userShellBootstrapRepository";
import { saveAuthSession, clearAuthSession } from "@/features/auth/sessionStorage";
import { useAuthStore } from "@/state/authStore";
import { useDeviceStore } from "@/state/deviceStore";
import type { AuthSession } from "@/features/auth/types";

// ── Sign In ──────────────────────────────────────────────────────────────────

export function useSignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  const deviceId = useDeviceStore((s) => s.deviceId);

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      if (!data.session) throw new Error("No session returned.");

      const session: AuthSession = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
          ? new Date(data.session.expires_at * 1000).toISOString()
          : null,
        userId: data.session.user.id,
        email: data.session.user.email ?? null,
      };

      await saveAuthSession(session);
      await bootstrapLocalUserShell(session, deviceId);
      return session;
    },
    onSuccess: (session) => setSession(session),
  });
}

// ── Sign Out ─────────────────────────────────────────────────────────────────

export function useSignOut() {
  const setSession = useAuthStore((s) => s.setSession);

  return useMutation({
    mutationFn: async () => {
      await wipeLocalDatabase();
      await clearAuthSession();
      // Best-effort server-side sign out (invalidates refresh token)
      await supabase.auth.signOut().catch(() => {});
    },
    onSuccess: () => setSession(null),
  });
}

// ── Forgot Password ───────────────────────────────────────────────────────────

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://myexpensio.com/reset-password",
      });
      if (error) throw new Error(error.message);
    },
  });
}

// ── Refresh Session ───────────────────────────────────────────────────────────

export async function refreshSupabaseSession(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) return null;

  const session: AuthSession = {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at
      ? new Date(data.session.expires_at * 1000).toISOString()
      : null,
    userId: data.session.user.id,
    email: data.session.user.email ?? null,
  };

  await saveAuthSession(session);
  return session;
}
