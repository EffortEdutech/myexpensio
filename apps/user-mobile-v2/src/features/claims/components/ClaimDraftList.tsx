import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ClaimDraft } from "@/features/claims/types";
import { colors, spacing, typography } from "@/theme/tokens";

type ClaimDraftListProps = {
  claims: ClaimDraft[];
  isLoading: boolean;
};

export function ClaimDraftList({ claims, isLoading }: ClaimDraftListProps) {
  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (claims.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No local claims yet</Text>
        <Text style={styles.emptyCopy}>
          Create a claim to test local persistence and queued sync mutations.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {claims.map((claim) => (
        <View key={claim.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{claim.title ?? "Draft claim"}</Text>
            <Text style={styles.amount}>
              {(claim.totalAmountCents / 100).toFixed(2)} {claim.currency}
            </Text>
          </View>
          <Text style={styles.meta}>
            {claim.periodStart ?? "No period"} · {claim.status}
          </Text>
          <View style={styles.syncBadge}>
            <Text style={styles.syncText}>{claim.syncStatus}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  cardHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700"
  },
  amount: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted,
    fontSize: typography.caption
  },
  syncBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#e0f2fe",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  syncText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 120,
    justifyContent: "center",
    padding: spacing.lg
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center"
  }
});

