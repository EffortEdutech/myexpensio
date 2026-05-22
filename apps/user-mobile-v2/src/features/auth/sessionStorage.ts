import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/features/auth/types";

const sessionStorageKey = "myexpensio.mobile.v2.auth-session";

export async function saveAuthSession(session: AuthSession) {
  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session));
}

export async function loadAuthSession() {
  const storedSession = await SecureStore.getItemAsync(sessionStorageKey);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession) as AuthSession;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function clearAuthSession() {
  await SecureStore.deleteItemAsync(sessionStorageKey);
}

