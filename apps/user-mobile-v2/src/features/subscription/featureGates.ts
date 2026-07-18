import type { FeatureKey, SubscriptionTier } from "@/features/subscription/types";

const featureMinimumTier: Record<FeatureKey, SubscriptionTier> = {
  ai_odometer_scan: "PRO",  // AI Capture S3 — 2026-07-18. Reading proposal only;
                             // the camera button itself is still gated by
                             // receipt_scan (attach evidence at all), same
                             // split pattern as receipt_scan vs. this key.
  business_space: "PREMIUM",
  exports: "FREE",          // CSV export — all tiers
  exports_pdf: "PRO",       // on-device PDF + TNG highlight — PRO and above
  personal_tax: "FREE",
  receipt_scan: "PRO"
};

const tierRank: Record<SubscriptionTier, number> = {
  FREE: 0,
  PRO: 1,
  PREMIUM: 2
};

export function canUseFeature(tier: SubscriptionTier, feature: FeatureKey) {
  return tierRank[tier] >= tierRank[featureMinimumTier[feature]];
}

export function getRequiredTier(feature: FeatureKey) {
  return featureMinimumTier[feature];
}
