/**
 * SyncLoadingGate — web-only loading barrier.
 *
 * On web the in-memory DB starts empty on every page load. This component
 * blocks content rendering until `syncReady` is true (set by useSyncEngine
 * once the first bootstrap + pull cycle completes).
 *
 * On native this gate is a transparent pass-through (syncReady starts true
 * because SQLite already has persisted data).
 *
 * FREE tier on web: sync never runs, so syncReady becomes true immediately
 * after the startup effect sees FREE tier. In that case we render children
 * normally — the individual screens will show the WebSyncEmptyState via
 * the shared useSyncEngine.syncDisabled flag.
 *
 * Offline on web: if sync fails (network error), syncReady is still set to
 * true after the attempt so the user can see the offline state and retry
 * button, rather than being stuck on the loading screen forever.
 */
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";
import { colors, spacing, typography } from "@/theme/tokens";

type Props = {
  /** Forwarded from useSyncEngine */
  syncReady: boolean;
  /** Show contextual message when sync failed */
  syncStatus: "idle" | "syncing" | "error" | "offline" | "free_tier";
  children: ReactNode;
};

export function SyncLoadingGate({ syncReady, syncStatus, children }: Props) {
  // On native, gate is always open
  if (Platform.OS !== "web") return <>{children}</>;

  if (syncReady) return <>{children}</>;

  const isOffline = syncStatus === "offline";

  return (
    <View style={styles.container}>
      {isOffline ? (
        <>
          <Text style={styles.icon}>📡</Text>
          <Text style={styles.title}>No connection</Text>
          <Text style={styles.sub}>
            Your data is stored in the cloud.{"\n"}
            Connect to the internet to load your workspace.
          </Text>
        </>
      ) : (
        <>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.title}>Loading your data…</Text>
          <Text style={styles.sub}>
            Syncing your workspace from the cloud.
          </Text>
        </>
      )}
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
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900",
    textAlign: "center",
  },
  sub: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
