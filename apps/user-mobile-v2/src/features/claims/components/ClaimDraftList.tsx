import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { ClaimDraft } from "@/features/claims/types";
import { colors, spacing, typography } from "@/theme/tokens";

type ClaimDraftListProps = {
  claims: ClaimDraft[];
  isLoading: boolean;
  onAddItem?: (claim: ClaimDraft) => void;
  onDelete?: (claim: ClaimDraft) => void;
  onDeleteLatestItem?: (claim: ClaimDraft) => void;
  onIncreaseLatestItem?: (claim: ClaimDraft) => void;
  onRename?: (claim: ClaimDraft) => void;
};

export function ClaimDraftList({
  claims,
  isLoading,
  onAddItem,
  onDelete,
  onDeleteLatestItem,
  onIncreaseLatestItem,
  onRename
}: ClaimDraftListProps) {
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
          <View style={styles.actions}>
            <ClaimAction label="Rename" onPress={() => onRename?.(claim)} />
            <ClaimAction label="Add item" onPress={() => onAddItem?.(claim)} />
            <ClaimAction
              label="+ RM1"
              onPress={() => onIncreaseLatestItem?.(claim)}
            />
            <ClaimAction
              label="Remove item"
              onPress={() => onDeleteLatestItem?.(claim)}
            />
            <ClaimAction
              danger
              label="Delete"
              onPress={() => onDelete?.(claim)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

function ClaimAction({
  danger,
  label,
  onPress
}: {
  danger?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        danger ? styles.actionButtonDanger : null,
        pressed ? styles.actionButtonPressed : null
      ]}
    >
      <Text style={[styles.actionText, danger ? styles.actionTextDanger : null]}>
        {label}
      </Text>
    </Pressable>
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
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  actionButtonDanger: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca"
  },
  actionButtonPressed: {
    opacity: 0.72
  },
  actionText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  actionTextDanger: {
    color: colors.danger
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

