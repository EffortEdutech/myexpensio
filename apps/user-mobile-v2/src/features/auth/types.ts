export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
  userId: string;
  email: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  session: AuthSession;
};

export type AuthStatus = "unknown" | "signed_out" | "signed_in";

