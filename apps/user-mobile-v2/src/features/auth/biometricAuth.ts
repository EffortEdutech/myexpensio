/**
 * Biometric auth adapter using expo-local-authentication.
 * Supports Face ID, Touch ID, and Android biometrics.
 */
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

export type BiometricAvailability = {
  available: boolean;
  reason?: string;
};

export type BiometricAuthAdapter = {
  authenticate: () => Promise<boolean>;
  getAvailability: () => Promise<BiometricAvailability>;
};

export const nativeBiometricAuthAdapter: BiometricAuthAdapter = {
  async getAvailability(): Promise<BiometricAvailability> {
    if (Platform.OS === "web") {
      return { available: false, reason: "Biometrics not supported on web." };
    }
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { available: false, reason: "No biometric hardware on this device." };
    }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return { available: false, reason: "No biometrics enrolled. Set up Face ID or fingerprint in device settings." };
    }
    return { available: true };
  },

  async authenticate(): Promise<boolean> {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your identity to access myexpensio",
      cancelLabel: "Use Password",
      fallbackLabel: "Use Password",
      disableDeviceFallback: false,
    });
    return result.success;
  },
};

// Stub for web / unsupported platforms
export const unsupportedBiometricAuthAdapter: BiometricAuthAdapter = {
  async authenticate() { return false; },
  async getAvailability() {
    return { available: false, reason: "Biometrics not supported on this platform." };
  },
};
