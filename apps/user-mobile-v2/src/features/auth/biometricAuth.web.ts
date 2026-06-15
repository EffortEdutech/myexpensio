/**
 * biometricAuth.web.ts
 *
 * Web stub — biometrics are not available in the browser.
 * Metro automatically resolves this file on web builds instead of biometricAuth.ts,
 * which avoids bundling expo-local-authentication (native-only).
 */

import type { BiometricAuthAdapter, BiometricAvailability } from "./biometricAuth";

export type { BiometricAuthAdapter, BiometricAvailability };

export const nativeBiometricAuthAdapter: BiometricAuthAdapter = {
  async getAvailability(): Promise<BiometricAvailability> {
    return { available: false, reason: "Biometrics not supported on web." };
  },
  async authenticate(): Promise<boolean> {
    return false;
  },
};

export const unsupportedBiometricAuthAdapter: BiometricAuthAdapter =
  nativeBiometricAuthAdapter;
