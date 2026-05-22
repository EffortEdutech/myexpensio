import type { FeatureKey, SubscriptionTier } from "@/features/subscription/types";

const featureMinimumTier: Record<FeatureKey, SubscriptionTier> = {
  business_space: "PREMIUM",
  exports: "PRO",
  personal_tax: "PRO",
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

