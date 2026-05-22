import { create } from "zustand";

import type { AuthSession, AuthStatus } from "@/features/auth/types";

type AuthState = {
  session: AuthSession | null;
  status: AuthStatus;
  setSession: (session: AuthSession | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  status: "unknown",
  setSession: (session) =>
    set({
      session,
      status: session ? "signed_in" : "signed_out"
    })
}));

