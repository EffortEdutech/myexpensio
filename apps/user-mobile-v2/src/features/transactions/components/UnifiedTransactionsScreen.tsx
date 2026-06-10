/**
 * UnifiedTransactionsScreen
 *
 * Sprint 21 — merges TNG transactions and all claim items into a single
 * chronological, searchable view for the Work space "Txns" tab.
 *
 * Rows are grouped by month, sorted newest-first.
 * TNG import is accessible via the "Import TNG" button which switches
 * the work tab to "tng" (TngScreen).
 */

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAllClaimItems } from "@/features/claims/hooks/useClaimDrafts";
import type { ClaimItemDraft, ClaimItemType } from "@/features/claims/types";
import { useTngTransactions } from "@/features/tng/hooks/useTngLibrary";
import type { TngTransaction } from "@/features/tng/types";
import { colors, spacing, typography } from "@/theme/tokens";

// ── Types ─────────────────────────────────────────────────────────────────────

type DateRange = "month" | "3months" | "all";

type UnifiedEntry =
  | { kind: "tng";   data: TngTransaction;   dateKey: string }
  | { kind: "claim"; data: ClaimItemDraft;   dateKey: string };

type Section = {
  data: UnifiedEntry[];
  key: string;
  title: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCutoff(range: DateRange): string {
  const now = new Date();
  if (range === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  }
  if (range === "3months") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().slice(0, 10);
  }
  return "0000-00-00";
}

function monthLabel(dateKey: string): string {
  try {
    const [year, month] = dateKey.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
  } catch {
    return dateKey.slice(0, 7);
  }
}

function entryDescription(e: UnifiedEntry): string {
  if (e.kind === "tng") {
    const tx = e.data;
    return tx.entryLocation && tx.exitLocation
      ? `${tx.entryLocation} → ${tx.exitLocation}`
      : tx.location ?? tx.entryLocation ?? tx.exitLocation ?? tx.sector;
  }
  return e.data.title;
}

function claimItemTypeLabel(type: ClaimItemType): string {
  const map: Record<ClaimItemType, string> = {
    toll: "Toll", parking: "Parking", taxi: "Taxi", grab: "Grab",
    train: "Train", bus: "Bus", flight: "Flight", mileage: "Mileage",
    meal: "Meal", lodging: "Lodging", per_diem: "Per Diem", other: "Other",
  };
  return map[type] ?? type;
}

function groupByMonth(entries: UnifiedEntry[]): Section[] {
  const map = new Map<string, UnifiedEntry[]>();
  for (const e of entries) {
    const key = e.dateKey.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries()).map(([key, data]) => ({
    key,
    title: monthLabel(key),
    data,
  }));
}

function formatAmount(cents: number): string {
  return `RM ${(Math.abs(cents) / 100).toFixed(2)}`;
}

function formatDate(dateKey: string): string {
  try {
    const d = new Date(dateKey + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return dateKey;
  }
}

// ── Row ───────────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: UnifiedEntry }) {
  const description = entryDescription(entry);
  const isTng = entry.kind === "tng";
  const amountCents = entry.data.amountCents;
  const dateKey = entry.dateKey;

  const badge = isTng
    ? entry.data.sector
    : claimItemTypeLabel((entry.data as ClaimItemDraft).type);

  const linked = isTng
    ? (entry.data as TngTransaction).claimed
    : Boolean((entry.data as ClaimItemDraft).tngTransactionId);

  return (
    <View style={styles.row}>
      <View style={styles.rowDateCol}>
        <Text style={styles.rowDate}>{formatDate(dateKey)}</Text>
        <View style={[styles.sourceBadge, isTng ? styles.sourceTng : styles.sourceClaim]}>
          <Text style={styles.sourceBadgeText}>{isTng ? "TNG" : "CLAIM"}</Text>
        </View>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowDesc} numberOfLines={2}>{description}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowBadge}>{badge}</Text>
          {linked ? <Text style={styles.rowLinked}>✓ linked</Text> : null}
        </View>
      </View>
      <Text style={[styles.rowAmount, isTng ? styles.rowAmountTng : styles.rowAmountClaim]}>
        {formatAmount(amountCents)}
      </Text>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  onOpenTngImport: () => void;
};

export function UnifiedTransactionsScreen({ onOpenTngImport }: Props) {
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<DateRange>("month");

  const tng = useTngTransactions({ claimed: "all", sector: "ALL" });
  const claims = useAllClaimItems();

  const isLoading = tng.isLoading || claims.isLoading;

  const sections = useMemo<Section[]>(() => {
    const all: UnifiedEntry[] = [];

    for (const tx of tng.data ?? []) {
      all.push({ kind: "tng", data: tx, dateKey: tx.transactionDate.slice(0, 10) });
    }

    for (const item of claims.data ?? []) {
      all.push({ kind: "claim", data: item, dateKey: item.itemDate.slice(0, 10) });
    }

    // Date range filter
    const cutoff = getCutoff(range);
    const rangeFiltered = all.filter((e) => e.dateKey >= cutoff);

    // Search filter
    const q = search.trim().toLowerCase();
    const searched = q
      ? rangeFiltered.filter((e) => entryDescription(e).toLowerCase().includes(q))
      : rangeFiltered;

    // Sort newest first
    searched.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    return groupByMonth(searched);
  }, [tng.data, claims.data, range, search]);

  const totalCount = sections.reduce((acc, s) => acc + s.data.length, 0);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Transactions</Text>
          <Text style={styles.headerCount}>{totalCount} entries</Text>
        </View>
        <Pressable onPress={onOpenTngImport} style={styles.importBtn}>
          <Text style={styles.importBtnText}>Import TNG</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search description…"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Date range pills */}
      <View style={styles.rangeRow}>
        {(["month", "3months", "all"] as DateRange[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[styles.rangePill, range === r && styles.rangePillActive]}
          >
            <Text style={[styles.rangePillText, range === r && styles.rangePillTextActive]}>
              {r === "month" ? "This Month" : r === "3months" ? "3 Months" : "All Time"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>Loading transactions…</Text>
        </View>
      ) : sections.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>No transactions found</Text>
          <Text style={styles.emptyBody}>
            {search
              ? "Try a different search term."
              : "Import a TNG statement or add claim items to see them here."}
          </Text>
          {!search ? (
            <Pressable onPress={onOpenTngImport} style={styles.importBtn}>
              <Text style={styles.importBtnText}>Import TNG</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => `${item.kind}-${item.data.id}`}
          renderItem={({ item }) => <EntryRow entry={item} />}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <Text style={styles.sectionHeaderCount}>{section.data.length}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={{ paddingBottom: 32 }}
          stickySectionHeadersEnabled
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800",
  },
  headerCount: {
    color: colors.muted,
    fontSize: typography.caption,
  },
  importBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  importBtnText: {
    color: "#fff",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  searchRow: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  rangeRow: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rangePill: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  rangePillActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a",
  },
  rangePillText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "600",
  },
  rangePillTextActive: {
    color: "#fff",
  },
  sectionHeader: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sectionHeaderText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionHeaderCount: {
    color: colors.muted,
    fontSize: typography.caption,
  },
  row: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDateCol: {
    alignItems: "center",
    gap: 4,
    width: 48,
  },
  rowDate: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  sourceBadge: {
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  sourceTng: {
    backgroundColor: "#fef3c7",
  },
  sourceClaim: {
    backgroundColor: "#dbeafe",
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#374151",
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowDesc: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "600",
  },
  rowMeta: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  rowBadge: {
    color: colors.muted,
    fontSize: typography.caption,
  },
  rowLinked: {
    color: "#16a34a",
    fontSize: typography.caption,
    fontWeight: "700",
  },
  rowAmount: {
    fontSize: typography.body,
    fontWeight: "700",
    minWidth: 72,
    textAlign: "right",
  },
  rowAmountTng: {
    color: "#dc2626",
  },
  rowAmountClaim: {
    color: "#0369a1",
  },
  separator: {
    backgroundColor: colors.border,
    height: 1,
    marginLeft: spacing.md,
  },
  center: {
    alignItems: "center",
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.body,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyBody: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
