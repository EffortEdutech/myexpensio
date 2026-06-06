import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createId } from "@/utils/ids";

const DEVICE_ID_KEY = "myexpensio-device-id";

type DeviceState = {
  deviceId: string;
};

/**
 * Persists the device ID across app launches via AsyncStorage.
 * A stable device ID is required for the sync engine to correctly
 * attribute local mutations and avoid duplicate push conflicts.
 */
export const useDeviceStore = create<DeviceState>()(
  persist(
    () => ({
      deviceId: createId("device"),
    }),
    {
      name: DEVICE_ID_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
