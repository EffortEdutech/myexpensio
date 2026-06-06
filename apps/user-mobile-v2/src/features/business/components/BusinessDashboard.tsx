import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBusinessEntries, useBusinessEntriesForYear } from "@/features/business/hooks/useBusinessLedger";
import { MONTHS } from "@/features/business/types";
import { colors, spacing, typography } from "@/theme/tokens";

type BusinessTab = "dashboard" | "income" | "expenses" | "reports";

type Props = { onNavigate: (tab: BusinessTab) => void };

export function BusinessDashboard({ onNavigate }: Props) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const monthEntries = useBusinessEntries(month, year);
  const yearEntries = useBusinessEntriesForYear(year);

  const monthly = useMemo(() => {
    const list = monthEntries.data ?? [];
    const income = list.filter((e) => e.entryType === "INCOME").reduce((s, e) => s + e.amountCents, 0);
    const expense = list.filter((e) => e.entryType === "EXPENSE").reduce((s, e) => s + e.amountCents, 0);
    return { income, expense, net: income - expense };
  }, [monthEntries.data]);

  // Build 12-month chart data
  const monthlyBars = useMemo(() => {
    const all = yearEntries.data ?? [];
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const items = all.filter((e) => {
        const d = new Date(e.entryDate);
        return d.getMonth() + 1 === m;
      });
      const income = items.filter((e) => e.entryType === "INCOME").reduce((s, e) => s + e.amountCents, 0);
      const expense = items.filter((e) => e.entryType === "EXPENSE").reduce((s, e) => s + e.amountCents, 0);
      return { month: m, income, expense, net: income - expense };
    });
  }, [yearEntries.data]);

  const maxVal = Math.max(...monthlyBars.map((b) => Math.max(b.income, b.expense)), 1);

  function prevMonth() {
    const d = new Date(year, month - 2);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }
  function nextMonth() {
    const d = new Date(year, month);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  }

  const isLoading = monthEntries.isLoading;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Business Space</Text>

      <View style={styles.monthRow}>
        <Pressable onPress={prevMonth} style={styles.arrow}><Text style={styles.arrowText}>‹</Text></Pressable>
        <Text style={styles.monthLabel}>{MONTHS[month - 1]} {year}</Text>
        <Pressable onPress={nextMonth} style={styles.arrow}><Text style={styles.arrowText}>›</Text></Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: "#16a34a" }]}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>RM {(monthly.income / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: "#dc2626" }]}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: "#dc2626" }]}>RM {(monthly.expense / 100).toFixed(2)}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: monthly.net >= 0 ? "#2563eb" : "#f97316" }]}>
            <Text style={styles.statLabel}>Net</Text>
            <Text style={[styles.statValue, { color: monthly.net >= 0 ? "#2563eb" : "#f97316" }]}>
              {monthly.net < 0 ? "-" : ""}RM {(Math.abs(monthly.net) / 100).toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* 12-month bar chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>{year} — Income vs Expenses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chart}>
            {monthlyBars.map((bar) => (
              <View key={bar.month} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View style={[styles.bar, { height: Math.max((bar.income / maxVal) * 80, 2), backgroundColor: "#86efac" }]} />
                  <View style={[styles.bar, { height: Math.max((bar.expense / maxVal) * 80, 2), backgroundColor: "#fca5a5" }]} />
                </View>
                <Text style={styles.barLabel}>{MONTHS[bar.month - 1].slice(0, 1)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#86efac" }]} /><Text style={styles.legendText}>Income</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#fca5a5" }]} /><Text style={styles.legendText}>Expenses</Text></View>
        </View>
      </View>

      <View style={styles.navGrid}>
        <NavCard icon="💰" title="Income" subtitle="Log & review income" onPress={() => onNavigate("income")} />
        <NavCard icon="💸" title="Expenses" subtitle="Track business costs" onPress={() => onNavigate("expenses")} />
        <NavCard icon="📊" title="Reports" subtitle="Tax & P&L summary" onPress={() => onNavigate("reports")} />
      </View>
    </ScrollView>
  );
}

function NavCard({ icon, title, subtitle, onPress }: { icon: string; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={styles.navCard} onPress={onPress}>
      <Text style={styles.navIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.navSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.navChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: spacing.md, paddingBottom: 80, gap: spacing.md },
  heading: { fontSize: typography.title, fontWeight: "800" as const, color: colors.text },
  monthRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
  arrow: { padding: spacing.sm },
  arrowText: { fontSize: 22, color: "#475569" },
  monthLabel: { fontSize: 15, fontWeight: "700", color: colors.text, minWidth: 100, textAlign: "center" },
  statsRow: { gap: spacing.sm },
  statCard: { backgroundColor: "#fff", borderRadius: 12, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 4 },
  statLabel: { fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  chartCard: { backgroundColor: "#fff", borderRadius: 14, padding: spacing.md, gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  chartTitle: { fontSize: 13, fontWeight: "600", color: "#64748b" },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 100, paddingTop: spacing.sm },
  barGroup: { alignItems: "center", gap: 4, width: 24 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 10, borderRadius: 2 },
  barLabel: { fontSize: 9, color: "#94a3b8" },
  legend: { flexDirection: "row", gap: spacing.md },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: "#64748b" },
  navGrid: { gap: spacing.sm },
  navCard: { backgroundColor: "#fff", borderRadius: 14, padding: spacing.md, flexDirection: "row", alignItems: "center", gap: spacing.sm, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  navIcon: { fontSize: 28 },
  navTitle: { fontSize: 15, fontWeight: "700", color: colors.text },
  navSubtitle: { fontSize: 12, color: "#94a3b8" },
  navChevron: { fontSize: 18, color: "#94a3b8" },
});
