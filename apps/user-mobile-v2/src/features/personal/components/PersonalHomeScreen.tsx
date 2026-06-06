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
import { colors, spacing, typography } from "@/theme/tokens";

type PersonalTab = "expenses" | "bills" | "tax";

type Props = {
  onNavigate: (tab: PersonalTab) => void;
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function PersonalHomeScreen({ onNavigate }: Props) {
  const year = new Date().getFullYear();
  const entries = useLedgerEntriesForYear("PERSONAL", year);
  const commitments = useCommitments(true);

  const stats = useMemo(() => {
    const list = entries.data ?? [];
    const totalExpenses = list
      .filter((e) => e.entryType === "EXPENSE")
      .reduce((s, e) => s + e.amountCents, 0);
    const taxDeductible = list
      .filter((e) => e.isTaxDeductible)
      .reduce((s, e) => s + e.amountCents, 0);
    return { totalExpenses, taxDeductible, entryCount: list.length };
  }, [entries.data]);

  const commitmentCount = (commitments.data ?? []).length;
  const isLoading = entries.isLoading;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Personal Expenses</Text>
      <Text style={styles.subheading}>{year} overview</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              RM {(stats.totalExpenses / 100).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Total Expenses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#16a34a" }]}>
              RM {(stats.taxDeductible / 100).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Tax Deductible</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.entryCount}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
        </View>
      )}

      <View style={styles.navGrid}>
        <NavCard
          icon="💳"
          title="Expenses"
          subtitle="Track daily spending"
          onPress={() => onNavigate("expenses")}
        />
        <NavCard
          icon="📋"
          title="Bills"
          subtitle={`${commitmentCount} active commitment${commitmentCount !== 1 ? "s" : ""}`}
          onPress={() => onNavigate("bills")}
        />
        <NavCard
          icon="🧾"
          title="Tax Summary"
          subtitle="LHDN deduction reference"
          onPress={() => onNavigate("tax")}
        />
      </View>
    </ScrollView>
  );
}

function NavCard({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.navCard} onPress={onPress}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={styles.navTitle}>{title}</Text>
      <Text style={styles.navSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f8fafc" },
  container: { padding: spacing.md, paddingBottom: 80, gap: spacing.md },
  heading: { fontSize: typography.title, fontWeight: "800" as const, color: colors.text },
  subheading: { fontSize: 13, color: "#94a3b8", marginTop: -spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: spacing.md,
    alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 15, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4 },
  navGrid: { gap: spacing.sm },
  navCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: spacing.md,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    flexDirection: "row", alignItems: "center", gap: spacing.md,
  },
  navIcon: { fontSize: 28 },
  navTitle: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  navSubtitle: { fontSize: 12, color: "#94a3b8" },
});
