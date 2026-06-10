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

  const required = getRequiredTier(feature);

  return (
    <View style={styles.gate}>
      <Text style={styles.lock}>🔒</Text>
      <Text style={styles.title}>{required} Feature</Text>
      <Text style={styles.copy}>
        This feature requires a <Text style={styles.bold}>{required}</Text>{" "}
        subscription. To upgrade, go to{" "}
        <Text style={styles.bold}>Settings → Billing</Text>.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gate: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  lock: {
    fontSize: 28
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center"
  },
  copy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center"
  },
  bold: {
    color: colors.text,
    fontWeight: "700"
  }
});

