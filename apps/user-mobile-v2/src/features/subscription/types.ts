import type { SyncStatus } from "@/features/expenses/types";

export type SubscriptionTier = "FREE" | "PRO" | "PREMIUM";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unknown";

export type CachedSubscription = {
  id: string;
  ownerType: "user" | "org";
  ownerId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  seatCount: number | null;
  syncStatus: SyncStatus;
  updatedAt: string;
};

export type FeatureKey =
  | "ai_odometer_scan"
  | "business_space"
  | "exports"
  | "exports_pdf"
  | "personal_tax"
  | "receipt_scan";

