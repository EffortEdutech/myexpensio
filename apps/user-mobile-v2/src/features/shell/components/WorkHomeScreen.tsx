/**
 * WorkHomeScreen
 * Mobile equivalent of the PWA v1 /home page.
 * Shows greeting, quick actions, this-month stats, recent trips + claims.
 */
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import type { ClaimDraft } from "@/features/claims/types";
import type { TripDraft } from "@/features/trips/types";
import type { WorkTab } from "@/features/shell/components/AppShell";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  claims: ClaimDraft[];
  displayName: string;
  onWorkTabChange: (tab: WorkTab) => void;
  trips: TripDraft[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function isThisMonth(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function fmtKm(m: number | null): string {
  if (m == null) return "—";
  return (m / 1000).toFixed(2) + " km";
}

function fmtMyr(cents: number): string {
  return "MYR " + (cents / 100).toFixed(2);
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function tripTitle(trip: TripDraft): string {
  if (trip.originText && trip.destinationText) {
    return `${trip.originText} → ${trip.destinationText}`;
  }
  if (trip.calculationMode === "gps_tracking") return "GPS Trip";
  if (trip.calculationMode === "odometer") return "Odometer Trip";
  return "Planned Trip";
}

function sourceBadge(trip: TripDraft) {
  if (trip.distanceSource === "gps")
    return { label: "GPS", bg: "#f0fdf4", color: "#16a34a" };
  if (trip.distanceSource === "odometer_override")
    return { label: "Odometer", bg: "#fefce8", color: "#ca8a04" };
  return { label: "Route", bg: "#eff6ff", color: "#2563eb" };
}

// ── Component ──────────────────────────────────────────────────────────────

export function WorkHomeScreen({ claims, displayName, onWorkTabChange, trips }: Props) {
  const firstName = displayName.split(" ")[0] || displayName;
  const monthLabel = new Date().toLocaleString("en-MY", { month: "long", year: "numeric" });

  const stats = useMemo(() => {
    const tripsThisMonth   = trips.filter(t => isThisMonth(t.startedAt) && t.status === "final").length;
    const draftClaims      = claims.filter(c => c.status === "draft").length;
    const submittedClaims  = claims.filter(c => c.status === "submitted").length;
    const totalKmThisMonth = trips
      .filter(t => isThisMonth(t.startedAt) && t.status === "final")
      .reduce((sum, t) => sum + (t.finalDistanceM ?? 0), 0);
    return { tripsThisMonth, draftClaims, submittedClaims, totalKmThisMonth };
  }, [claims, trips]);

  const recentTrips  = useMemo(
    () => [...trips].filter(t => t.status === "final")
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, 4),
    [trips]
  );
  const recentClaims = useMemo(
    () => [...claims]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4),
    [claims]
  );

  const isNewUser = trips.length === 0 && claims.length === 0;

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greetingBlock}>
        <Text style={styles.greetingText}>
          {greeting()}, {firstName} 👋
        </Text>
        <Text style={styles.greetingSub}>{monthLabel}</Text>
      </View>

      {/* Onboarding card */}
      {isNewUser ? (
        <View style={styles.onboardCard}>
          <Text style={styles.onboardIcon}>🚀</Text>
          <View style={styles.onboardBody}>
            <Text style={styles.onboardTitle}>Welcome to myexpensio!</Text>
            <Text style={styles.onboardSub}>
              Start by recording your first trip, then attach it to a claim.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => onWorkTabChange("trips")}
            style={styles.onboardBtn}
          >
            <Text style={styles.onboardBtnText}>Start a trip →</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Quick actions 2×2 */}
      <View style={styles.quickGrid}>
        <QuickAction
          icon="▶"
          label="GPS Trip"
          color="#16a34a"
          onPress={() => onWorkTabChange("trips")}
        />
        <QuickAction
          icon="📏"
          label="Odometer"
          color="#ca8a04"
          onPress={() => onWorkTabChange("trips")}
        />
        <QuickAction
          icon="📐"
          label="Mileage Calc"
          color="#2563eb"
          onPress={() => onWorkTabChange("trips")}
        />
        <QuickAction
          icon="＋"
          label="New Claim"
          color="#7c3aed"
          onPress={() => onWorkTabChange("claims")}
        />
      </View>

      {/* This-month stats */}
      <SectionHeader title={`Stats · ${monthLabel}`} />
      <View style={styles.statGrid}>
        <StatCard label="Trips" value={stats.tripsThisMonth} />
        <StatCard
          label="Distance"
          value={fmtKm(stats.totalKmThisMonth)}
        />
        <StatCard label="Draft Claims" value={stats.draftClaims} />
        <StatCard label="Submitted" value={stats.submittedClaims} />
      </View>

      {/* Recent Trips */}
      <SectionHeader
        title="Recent Trips"
        onSeeAll={() => onWorkTabChange("trips")}
      />
      {recentTrips.length === 0 ? (
        <EmptyCard
          icon="🗺"
          message="No trips yet. Start tracking your first trip."
          cta="Go to Trips"
          onPress={() => onWorkTabChange("trips")}
        />
      ) : (
        <View style={styles.list}>
          {recentTrips.map((trip) => {
            const badge = sourceBadge(trip);
            return (
              <Pressable
                accessibilityRole="button"
                key={trip.id}
                onPress={() => onWorkTabChange("trips")}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {tripTitle(trip)}
                    </Text>
                    <Text style={styles.cardSub}>{fmtDate(trip.startedAt)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardMetric}>
                      {fmtKm(trip.finalDistanceM)}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Recent Claims */}
      <SectionHeader
        title="Recent Claims"
        onSeeAll={() => onWorkTabChange("claims")}
      />
      {recentClaims.length === 0 ? (
        <EmptyCard
          icon="📋"
          message="No claims yet. Create your first claim."
          cta="Go to Claims"
          onPress={() => onWorkTabChange("claims")}
        />
      ) : (
        <View style={styles.list}>
          {recentClaims.map((claim) => {
            const isDraft = claim.status === "draft";
            return (
              <Pressable
                accessibilityRole="button"
                key={claim.id}
                onPress={() => onWorkTabChange("claims")}
                style={styles.card}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {claim.title ?? `Claim — ${fmtDate(claim.createdAt)}`}
                    </Text>
                    <Text style={styles.cardSub}>{timeAgo(claim.updatedAt)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardMetric}>
                      {fmtMyr(claim.totalAmountCents)}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: isDraft ? "#fef9c3" : "#f0fdf4" }
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          { color: isDraft ? "#a16207" : "#16a34a" }
                        ]}
                      >
                        {isDraft ? "Draft" : "Submitted"}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* TNG shortcut */}
      <Pressable
        accessibilityRole="button"
        onPress={() => onWorkTabChange("tng")}
        style={styles.tngRow}
      >
        <Text style={styles.tngIcon}>$</Text>
        <Text style={styles.tngLabel}>TNG Transactions</Text>
        <Text style={styles.tngChevron}>›</Text>
      </Pressable>
    </ScrollView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function QuickAction({
  color,
  icon,
  label,
  onPress
}: {
  color: string;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.quickAction, { borderColor: color + "33" }]}
    >
      <View style={[styles.quickIcon, { backgroundColor: color + "18" }]}>
        <Text style={[styles.quickIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeader({
  onSeeAll,
  title
}: {
  onSeeAll?: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll ? (
        <Pressable accessibilityRole="button" onPress={onSeeAll}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyCard({
  cta,
  icon,
  message,
  onPress
}: {
  cta?: string;
  icon: string;
  message: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyMsg}>{message}</Text>
      {cta && onPress ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={styles.emptyBtn}
        >
          <Text style={styles.emptyBtnText}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl
  },
  greetingBlock: {
    gap: 2
  },
  greetingText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  greetingSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  onboardCard: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  onboardIcon: {
    fontSize: 28
  },
  onboardBody: {
    gap: 4
  },
  onboardTitle: {
    color: "#14532d",
    fontSize: typography.body,
    fontWeight: "900"
  },
  onboardSub: {
    color: "#166534",
    fontSize: typography.caption,
    lineHeight: 18
  },
  onboardBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#16a34a",
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  onboardBtnText: {
    color: "#fff",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  quickAction: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 6,
    paddingVertical: spacing.md
  },
  quickIcon: {
    alignItems: "center",
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  quickIconText: {
    fontSize: 18,
    fontWeight: "900"
  },
  quickLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center"
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  seeAll: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  statCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 4,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
    lineHeight: 30
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  list: {
    gap: spacing.sm
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.md
  },
  cardRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  cardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  cardSub: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  cardRight: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: 4
  },
  cardMetric: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900"
  },
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.lg,
    textAlign: "center"
  },
  emptyIcon: {
    fontSize: 28
  },
  emptyMsg: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: "center"
  },
  emptyBtn: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    marginTop: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8
  },
  emptyBtnText: {
    color: "#fff",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  tngRow: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md
  },
  tngIcon: {
    color: "#0891b2",
    fontSize: 18,
    fontWeight: "900",
    width: 28
  },
  tngLabel: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  tngChevron: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800"
  }
});
