import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBusinessEntriesForYear } from "@/features/business/hooks/useBusinessLedger";
import { BUSINESS_EXPENSE_CATEGORY_GROUPS } from "@/features/business/types";
import { colors, spacing, typography } from "@/theme/tokens";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 4;

type Props = { onBack: () => void };

export function BusinessReportsScreen({ onBack }: Props) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const entries = useBusinessEntriesForYear(year);

  const summary = useMemo(() => {
    const list = entries.data ?? [];
    const incomeList = list.filter((e) => e.entryType === "INCOME");
    const expenseList = list.filter((e) => e.entryType === "EXPENSE");
    const totalIncome = incomeList.reduce((s, e) => s + e.amountCents, 0);
    const totalExpense = expenseList.reduce((s, e) => s + e.amountCents, 0);
    const totalDeductible = expenseList.filter((e) => e.isTaxDeductible).reduce((s, e) => s + e.amountCents, 0);
    const net = totalIncome - totalExpense;

    // Group expenses by category group
    const allGroups = BUSINESS_EXPENSE_CATEGORY_GROUPS.map((g) => {
      const items = expenseList.filter((e) => (g.items as readonly string[]).includes(e.category));
      const total = items.reduce((s, e) => s + e.amountCents, 0);
      return { group: g.group, total };
    }).filter((g) => g.total > 0);

    return { totalIncome, totalExpense, totalDeductible, net, incomeCount: incomeList.length, expenseCount: expenseList.length, expenseGroups: allGroups };
  }, [entries.data]);

  const isLoading = entries.isLoading;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>Business Reports</Text>
      </View>

      <View style={styles.yearRow}>
        <Pressable onPress={() => { if (year > MIN_YEAR) setYear((y) => y - 1); }} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.yearLabel}>{year}</Text>
        <Pressable onPress={() => { if (year < CURRENT_YEAR) setYear((y) => y + 1); }} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {/* P&L summary */}
          <View style={styles.plCard}>
            <Text style={styles.plTitle}>Profit & Loss — {year}</Text>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Income</Text>
              <Text style={[styles.plValue, { color: "#16a34a" }]}>RM {(summary.totalIncome / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Expenses</Text>
              <Text style={[styles.plValue, { color: "#dc2626" }]}>RM {(summary.totalExpense / 100).toFixed(2)}</Text>
            </View>
            <View style={[styles.plRow, styles.plNetRow]}>
              <Text style={styles.plNetLabel}>Net {summary.net >= 0 ? "Profit" : "Loss"}</Text>
              <Text style={[styles.plNetValue, { color: summary.net >= 0 ? "#2563eb" : "#f97316" }]}>
                {summary.net < 0 ? "-" : ""}RM {(Math.abs(summary.net) / 100).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Tax estimation */}
          <View style={styles.taxCard}>
            <Text style={styles.taxTitle}>LHDN Tax Estimation</Text>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Total Income</Text>
              <Text style={styles.plValue}>RM {(summary.totalIncome / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.plRow}>
              <Text style={styles.plLabel}>Deductible Expenses</Text>
              <Text style={[styles.plValue, { color: "#16a34a" }]}>- RM {(summary.totalDeductible / 100).toFixed(2)}</Text>
            </View>
            <View style={[styles.plRow, styles.plNetRow]}>
              <Text style={styles.plNetLabel}>Est. Taxable Income</Text>
              <Text style={styles.plNetValue}>
                RM {(Math.max(0, summary.totalIncome - summary.totalDeductible) / 100).toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Expense breakdown */}
          {summary.expenseGroups.length > 0 && (
            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>Expense Breakdown</Text>
              {summary.expenseGroups.map((g) => (
                <View key={g.group} style={styles.groupRow}>
                  <Text style={styles.groupLabel}>{g.group}</Text>
                  <Text style={styles.groupAmount}>RM {(g.total / 100).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ Tax estimations are for reference only. Actual LHDN assessment may differ.
              Consult a tax agent or accountant for filing.
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
  plCard: { backgroundColor: "#fff", borderRadius: 14, padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  plTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  plRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plLabel: { fontSize: 13, color: "#64748b" },
  plValue: { fontSize: 14, fontWeight: "600", color: colors.text },
  plNetRow: { borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: spacing.sm, marginTop: spacing.sm },
  plNetLabel: { fontSize: 14, fontWeight: "700", color: colors.text },
  plNetValue: { fontSize: 16, fontWeight: "800", color: colors.text },
  taxCard: { backgroundColor: "#eff6ff", borderRadius: 14, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: "#bfdbfe" },
  taxTitle: { fontSize: 14, fontWeight: "700", color: "#1d4ed8", marginBottom: 4 },
  groupCard: { backgroundColor: "#fff", borderRadius: 14, padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  groupTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: 4 },
  groupRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  groupLabel: { fontSize: 13, color: "#64748b" },
  groupAmount: { fontSize: 13, fontWeight: "600", color: colors.text },
  disclaimer: { backgroundColor: "#fefce8", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#fde68a" },
  disclaimerText: { fontSize: 11, color: "#92400e", lineHeight: 18 },
});
