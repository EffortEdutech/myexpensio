import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  canUseFeature,
  getRequiredTier
} from "@/features/subscription/featureGates";
import type {
  FeatureKey,
  SubscriptionTier
} from "@/features/subscription/types";
import { colors, spacing, typography } from "@/theme/tokens";

type FeatureGateProps = PropsWithChildren<{
  feature: FeatureKey;
  tier: SubscriptionTier;
}>;

export function FeatureGate({ children, feature, tier }: FeatureGateProps) {
  if (canUseFeature(tier, feature)) {
    return <>{children}</>;
  }

  return (
    <View style={styles.gate}>
      <Text style={styles.title}>{getRequiredTier(feature)} feature</Text>
      <Text style={styles.copy}>
        This area is already reserved in mobile v2. The server will remain the
        source of truth for subscription access.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22
  }
});

