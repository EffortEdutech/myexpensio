import type { ApiClientOptions } from "@/api/client";
import { createApiClient } from "@/api/client";
import type { LoginRequest, LoginResponse } from "@/features/auth/types";

export function createAuthApi(options: ApiClientOptions) {
  const api = createApiClient(options);

  return {
    completeFirstLogin(payload: Record<string, unknown>) {
      return api.request<{ ok: true }>("/auth/complete-first-login", {
        method: "POST",
        body: payload
      });
    },
    login(request: LoginRequest) {
      return api.request<LoginResponse>("/auth/login", {
        method: "POST",
        body: request
      });
    },
    logout() {
      return api.request<{ ok: true }>("/auth/logout", {
        method: "POST"
      });
    },
    validateInvite(token: string) {
      return api.request<{ valid: boolean; email?: string }>(
        `/invite/validate?token=${encodeURIComponent(token)}`
      );
    }
  };
}

