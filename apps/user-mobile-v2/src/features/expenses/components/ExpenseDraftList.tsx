import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { ExpenseDraft } from "@/features/expenses/types";
import { colors, spacing, typography } from "@/theme/tokens";

type ExpenseDraftListProps = {
  drafts: ExpenseDraft[];
  isLoading: boolean;
};

export function ExpenseDraftList({ drafts, isLoading }: ExpenseDraftListProps) {
  if (isLoading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (drafts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No local drafts yet</Text>
        <Text style={styles.emptyCopy}>
          Create one to test the SQLite runtime and sync queue path.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {drafts.map((draft) => (
        <View key={draft.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.merchant}>{draft.merchantName}</Text>
            <Text style={styles.amount}>
              {(draft.amountCents / 100).toFixed(2)} {draft.currency}
            </Text>
          </View>
          <Text style={styles.meta}>{draft.expenseDate}</Text>
          <View style={styles.syncBadge}>
            <Text style={styles.syncText}>{draft.syncStatus}</Text>
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
  merchant: {
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
    backgroundColor: "#ccfbf1",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  syncText: {
    color: colors.primary,
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

