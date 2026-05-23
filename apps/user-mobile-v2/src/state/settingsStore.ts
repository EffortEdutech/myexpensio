import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ClaimantProfile = {
  companyName: string;
  department: string;
  displayName: string;
  email: string;
  location: string;
};

export type ClaimRates = {
  effectiveFrom: string | null;
  fullDayMealRate: string;
  lodgingRate: string;
  mealEveningRate: string;
  mealMorningRate: string;
  mealNoonRate: string;
  mileageCarRate: string;
  mileageMotorcycleRate: string;
  notes: string;
  perDiemRate: string;
  rateLabel: string;
  templateName: string;
};

type UserSettingsState = {
  profile: ClaimantProfile;
  rates: ClaimRates;
  updateProfile: (input: Partial<ClaimantProfile>) => void;
  updateRates: (input: Partial<ClaimRates>) => void;
};

export const defaultProfile: ClaimantProfile = {
  companyName: "",
  department: "",
  displayName: "",
  email: "",
  location: ""
};

export const defaultRates: ClaimRates = {
  effectiveFrom: null,
  fullDayMealRate: "60.00",
  lodgingRate: "120.00",
  mealEveningRate: "30.00",
  mealMorningRate: "20.00",
  mealNoonRate: "30.00",
  mileageCarRate: "0.60",
  mileageMotorcycleRate: "0.30",
  notes: "",
  perDiemRate: "0.00",
  rateLabel: "Personal Rate",
  templateName: "Use my current personal rates"
};

export const useUserSettingsStore = create<UserSettingsState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      rates: defaultRates,
      updateProfile: (input) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...input
          }
        })),
      updateRates: (input) =>
        set((state) => ({
          rates: {
            ...state.rates,
            ...input
          }
        }))
    }),
    {
      name: "myexpensio-user-mobile-v2-settings",
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
