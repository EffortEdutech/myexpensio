import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { ErrorState } from "@/components/ErrorState";
import { SkeletonList } from "@/components/SkeletonRow";
import type { ClaimDraft } from "@/features/claims/types";
import { colors, spacing, typography } from "@/theme/tokens";

type ClaimDraftListProps = {
  claims: ClaimDraft[];
  isError?: boolean;
  isLoading: boolean;
  onOpen?: (claim: ClaimDraft) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function ClaimDraftList({
  claims,
  isError = false,
  isLoading,
  onOpen,
  onRefresh,
  isRefreshing = false,
}: ClaimDraftListProps) {
  if (isLoading && claims.length === 0) {
    return <SkeletonList count={5} />;
  }

  if (isError && claims.length === 0) {
    return (
      <ErrorState
        message="Couldn't load claims"
        onRetry={onRefresh}
      />
    );
  }

  return (
    <FlatList
      data={claims}
      keyExtractor={(item) => item.id}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No claims yet</Text>
          <Text style={styles.emptyCopy}>
            Create a claim to group your trips and expenses for submission.
          </Text>
        </View>
      }
      renderItem={({ item: claim }) => {
        const isDraft = claim.status === "draft";
        const dateLabel = formatClaimPeriod(claim);
        return (
          <Pressable
            accessibilityLabel={`${claim.title ?? dateLabel}, ${isDraft ? "Draft" : "Submitted"}, ${formatMoney(claim)}`}
            accessibilityRole="button"
            onPress={() => onOpen?.(claim)}
            style={({ pressed }) => [
              styles.card,
              pressed ? styles.cardPressed : null,
            ]}
          >
            <View style={styles.dateCol}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              <View
                style={[
                  styles.statusBadge,
                  isDraft ? styles.statusBadgeDraft : styles.statusBadgeSubmitted,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isDraft ? styles.statusTextDraft : styles.statusTextSubmitted,
                  ]}
                >
                  {isDraft ? "Draft" : "Submitted"}
                </Text>
              </View>
            </View>
            <View style={styles.descCol}>
              <Text numberOfLines={1} style={styles.title}>
                {claim.title ?? dateLabel}
              </Text>
              <Text numberOfLines={1} style={styles.subtitle}>
                {isDraft
                  ? `edited ${formatRelative(claim.updatedAt)}`
                  : `submitted ${formatDate(claim.submittedAt)}`}
              </Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.amount}>{formatMoney(claim)}</Text>
              <Text style={styles.arrow}>{">"}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

function formatMoney(claim: ClaimDraft) {
  return `${claim.currency} ${(claim.totalAmountCents / 100).toFixed(2)}`;
}

function formatClaimPeriod(claim: ClaimDraft) {
  if (!claim.periodStart && !claim.periodEnd) {
    return "-";
  }

  if (claim.periodStart && claim.periodEnd) {
    if (claim.periodStart === claim.periodEnd) {
      return formatDate(claim.periodStart);
    }

    const start = new Date(claim.periodStart);
    const end = new Date(claim.periodEnd);

    if (
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear()
    ) {
      return start.toLocaleDateString("en-MY", {
        month: "long",
        year: "numeric"
      });
    }

    return `${formatDate(claim.periodStart)} - ${formatDate(claim.periodEnd)}`;
  }

  return formatDate(claim.periodStart ?? claim.periodEnd);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return value;
  }
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor(diff / 60_000);

  if (days > 0) {
    return `${days}d ago`;
  }

  if (hours > 0) {
    return `${hours}h ago`;
  }

  if (minutes > 0) {
    return `${minutes}m ago`;
  }

  return "just now";
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 90
  },
  list: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    overflow: "hidden"
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  cardPressed: {
    backgroundColor: "#f8fafc"
  },
  dateCol: {
    flexShrink: 0,
    gap: 5,
    width: 96
  },
  dateText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    lineHeight: 16
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  statusBadgeDraft: {
    backgroundColor: "#fef9c3"
  },
  statusBadgeSubmitted: {
    backgroundColor: "#dcfce7"
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800"
  },
  statusTextDraft: {
    color: "#854d0e"
  },
  statusTextSubmitted: {
    color: "#15803d"
  },
  descCol: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  title: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  amountCol: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 2
  },
  amount: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  arrow: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20
  },
  emptyState: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    minHeight: 220,
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
    maxWidth: 280,
    textAlign: "center"
  }
});
