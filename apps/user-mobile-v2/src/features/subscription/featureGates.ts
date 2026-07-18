import type { FeatureKey, SubscriptionTier } from "@/features/subscription/types";

const featureMinimumTier: Record<FeatureKey, SubscriptionTier> = {
  ai_odometer_scan: "PRO",  // AI Capture S3 — 2026-07-18. Reading proposal only;
                             // the camera button itself is still gated by
                             // receipt_scan (attach evidence at all), same
                             // split pattern as receipt_scan vs. this key.
  ai_voice_claim: "PRO",    // AI Capture S4 — 2026-07-18. Voice-to-claim
                             // parsing. Recording itself isn't gated (no cost
                             // until it's sent to Gemini) — this key only
                             // gates whether a recording actually gets parsed.
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
