/**
 * WebSyncEmptyState — shown to FREE tier users who open the PWA.
 *
 * FREE tier is local-only by design. On native Android this works fine —
 * SQLite persists data on-device. On web the in-memory DB is empty and sync
 * is disabled, so every screen would show a blank list.
 *
 * This component replaces those blank lists with a clear explanation and an
 * upgrade path, rather than a confusing empty state.
 *
 * Only render this on web AND when syncDisabled is true. On native the
 * component is a transparent pass-through so the same import works everywhere.
 */
import { Linking, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { colors, spacing, typography } from "@/theme/tokens";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { useAuthStore } from "@/state/authStore";

type Props = {
  /** Whether sync is disabled (FREE tier) */
  syncDisabled: boolean;
  children: ReactNode;
};

export function WebSyncEmptyState({ syncDisabled, children }: Props) {
  // On native, always show children regardless of tier
  if (Platform.OS !== "web") return <>{children}</>;
  // On web, only intercept for FREE tier (PRO/PREMIUM show synced data)
  if (!syncDisabled) return <>{children}</>;

  async function handleUpgrade() {
    const session = useAuthStore.getState().session;
    if (!session?.accessToken) return;
    try {
      const baseUrl = getSyncBaseUrl();
      const res = await fetch(`${baseUrl}/api/billing/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tier: "PRO", entity_type: "USER" }),
      });
      const data = (await res.json()) as { checkout_url?: string };
      if (data.checkout_url) {
        Linking.openURL(data.checkout_url);
      }
    } catch {
      // Silently fail — user can try again
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.title}>Your data lives on your device</Text>
      <Text style={styles.body}>
        myexpensio stores data locally on your Android app.{"\n\n"}
        <Text style={styles.bold}>Cloud sync is a PRO feature.</Text>
        {" "}Upgrade to PRO to access your claims, trips, and expenses
        from any device — including this browser.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void handleUpgrade()}
        style={({ pressed }) => [
          styles.upgradeButton,
          pressed ? styles.upgradeButtonPressed : null,
        ]}
      >
        <Text style={styles.upgradeButtonText}>Upgrade to PRO</Text>
      </Pressable>
      <Text style={styles.hint}>
        Already subscribed? Sign out and sign back in to refresh your plan.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    textAlign: "center",
  },
  body: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 24,
    maxWidth: 360,
    textAlign: "center",
  },
  bold: {
    color: colors.text,
    fontWeight: "800",
  },
  upgradeButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 14,
    marginTop: spacing.sm,
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  upgradeButtonPressed: {
    opacity: 0.82,
  },
  upgradeButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900",
  },
  hint: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
