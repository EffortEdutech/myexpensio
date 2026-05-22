import { create } from "zustand";

import { createId } from "@/utils/ids";

type DeviceState = {
  deviceId: string;
};

export const useDeviceStore = create<DeviceState>(() => ({
  deviceId: createId("device")
}));

