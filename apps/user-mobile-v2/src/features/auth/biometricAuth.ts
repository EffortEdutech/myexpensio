export type BiometricAvailability = {
  available: boolean;
  reason?: string;
};

export type BiometricAuthAdapter = {
  authenticate: () => Promise<boolean>;
  getAvailability: () => Promise<BiometricAvailability>;
};

export const unsupportedBiometricAuthAdapter: BiometricAuthAdapter = {
  async authenticate() {
    return false;
  },
  async getAvailability() {
    return {
      available: false,
      reason: "Native biometric adapter is not wired yet."
    };
  }
};

