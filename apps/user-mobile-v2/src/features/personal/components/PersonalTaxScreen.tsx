import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLedgerEntriesForYear } from "@/features/personal/hooks/useLedger";
import { useCommitments } from "@/features/personal/hooks/useCommitments";
import {
  LHDN_CATEGORY_ICONS,
  LHDN_PERSONAL_CATEGORIES,
} from "@/features/personal/types";
import { colors, spacing, typography } from "@/theme/tokens";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 4;

type Props = { onBack: () => void };

export function PersonalTaxScreen({ onBack }: Props) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const entries = useLedgerEntriesForYear("PERSONAL", year);
  const commitments = useCommitments(false);

  const summary = useMemo(() => {
    const list = (entries.data ?? []).filter((e) => e.isTaxDeductible && e.taxCategory);
    const billList = (commitments.data ?? []).filter((c) => c.isTaxRelief && c.taxCategory);

    const cats = new Map<string, { label: string; total: number; count: number }>();

    // From ledger entries
    for (const e of list) {
      const key = e.taxCategory!;
      const existing = cats.get(key);
      const label = LHDN_PERSONAL_CATEGORIES.find((c) => c.value === key)?.label ?? key;
      cats.set(key, {
        label,
        total: (existing?.total ?? 0) + e.amountCents,
        count: (existing?.count ?? 0) + 1,
      });
    }

    // From commitments (tax relief bills)
    for (const b of billList) {
      const key = b.taxCategory!;
      const existing = cats.get(key);
      const label = LHDN_PERSONAL_CATEGORIES.find((c) => c.value === key)?.label ?? key;
      cats.set(key, {
        label,
        total: (existing?.total ?? 0) + b.amountCents * 12, // annual
        count: (existing?.count ?? 0) + 1,
      });
    }

    const categories = Array.from(cats.entries()).map(([key, val]) => ({ key, ...val }));
    const grandTotal = categories.reduce((s, c) => s + c.total, 0);
    return { categories, grandTotal };
  }, [entries.data, commitments.data]);

  const isLoading = entries.isLoading || commitments.isLoading;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Tax Summary</Text>
      </View>

      {/* Year picker */}
      <View style={styles.yearRow}>
        <Pressable onPress={() => { if (year > MIN_YEAR) setYear((y) => y - 1); }} style={styles.arrow}>
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable onPress={() => { if (year < CURRENT_YEAR) setYear((y) => y + 1); }} style={styles.arrow}>
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {/* Grand total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Deductible ({year})</Text>
            <Text style={styles.totalValue}>RM {(summary.grandTotal / 100).toFixed(2)}</Text>
          </View>

          {summary.categories.length === 0 && (
            <Text style={styles.empty}>
              No tax-deductible entries found for {year}.{"\n"}
              Mark expenses or bills as tax deductible to see them here.
            </Text>
          )}

          {summary.categories.map((cat) => (
            <View key={cat.key} style={styles.catCard}>
              <Text style={styles.catIcon}>{LHDN_CATEGORY_ICONS[cat.key] ?? "📌"}</Text>
              <View style={styles.catBody}>
                <Text style={styles.catLabel}>{cat.label}</Text>
                <Text style={styles.catCount}>{cat.count} item{cat.count !== 1 ? "s" : ""}</Text>
              </View>
              <Text style={styles.catAmount}>RM {(cat.total / 100).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ This summary is for personal reference only. Actual LHDN relief eligibility depends on
              official guidelines and documentation. Consult a tax professional for filing.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: { flexDirection: "row", alignItems: "center", padding: spacing.md, gap: spacing.sm, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: "#475569" },
  title: { fontSize: typography.title, fontWeight: "800" as const, flex: 1, color: colors.text },
  yearRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xl, padding: spacing.sm, backgroundColor: "#fff" },
  arrow: { padding: spacing.sm },
  arrowText: { fontSize: 22, color: "#475569" },
  yearLabel: { fontSize: 22, fontWeight: "800", color: colors.text, minWidth: 60, textAlign: "center" },
  list: { flex: 1 },
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 80 },
  totalCard: { backgroundColor: colors.primary, borderRadius: 14, padding: spacing.lg, alignItems: "center", gap: 4 },
  totalLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 28, fontWeight: "800", color: "#fff" },
  empty: { textAlign: "center", color: "#94a3b8", fontSize: 13, paddingVertical: spacing.xl, lineHeight: 22 },
  catCard: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  catIcon: { fontSize: 28 },
  catBody: { flex: 1, gap: 2 },
  catLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  catCount: { fontSize: 11, color: "#94a3b8" },
  catAmount: { fontSize: 16, fontWeight: "700", color: colors.text },
  disclaimer: { backgroundColor: "#fefce8", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fde68a" },
  disclaimerText: { fontSize: 11, color: "#92400e", lineHeight: 18 },
});
