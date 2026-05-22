import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/features/auth/types";

const sessionStorageKey = "myexpensio.mobile.v2.auth-session";

export async function saveAuthSession(session: AuthSession) {
  if (Platform.OS === "web") {
    window.localStorage.setItem(sessionStorageKey, JSON.stringify(session));
    return;
  }

  await SecureStore.setItemAsync(sessionStorageKey, JSON.stringify(session));
}

export async function loadAuthSession() {
  if (Platform.OS === "web") {
    const storedWebSession = window.localStorage.getItem(sessionStorageKey);

    if (!storedWebSession) {
      return null;
    }

    try {
      return JSON.parse(storedWebSession) as AuthSession;
    } catch {
      await clearAuthSession();
      return null;
    }
  }

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
  if (Platform.OS === "web") {
    window.localStorage.removeItem(sessionStorageKey);
    return;
  }

  await SecureStore.deleteItemAsync(sessionStorageKey);
}

