import type { PropsWithChildren } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { appSpaces } from "@/features/shell/spaceConfig";
import type { AppSpace } from "@/features/shell/types";
import { colors, spacing, typography } from "@/theme/tokens";

type AppShellProps = PropsWithChildren<{
  activeSpace: AppSpace;
  pendingSyncCount: number;
  onSpaceChange: (space: AppSpace) => void;
}>;

export function AppShell({
  activeSpace,
  children,
  onSpaceChange,
  pendingSyncCount
}: AppShellProps) {
  const activeSpaceMeta =
    appSpaces.find((space) => space.id === activeSpace) ?? appSpaces[0];

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <Text style={styles.brand}>myexpensio</Text>
          <Text style={styles.spaceLabel}>{activeSpaceMeta.label}</Text>
        </View>
        <View style={styles.headerBadges}>
          <View style={styles.subscriptionBadge}>
            <Text style={styles.subscriptionText}>Free</Text>
          </View>
          <View
            style={[
              styles.syncBadge,
              pendingSyncCount > 0 ? styles.syncBadgePending : null
            ]}
          >
            <Text
              style={[
                styles.syncText,
                pendingSyncCount > 0 ? styles.syncTextPending : null
              ]}
            >
              {pendingSyncCount > 0 ? `${pendingSyncCount} pending` : "Synced"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>{children}</View>

      <View style={styles.nav}>
        {appSpaces.map((space) => {
          const active = space.id === activeSpace;

          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              key={space.id}
              onPress={() => onSpaceChange(space.id)}
              style={[styles.navTab, active ? styles.navTabActive : null]}
            >
              <Text style={[styles.navLabel, active ? styles.navLabelActive : null]}>
                {space.shortLabel}
              </Text>
              {active ? <View style={styles.navDot} /> : null}
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    flex: 1
  },
  header: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.lg
  },
  brandGroup: {
    flex: 1
  },
  brand: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  spaceLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: 2
  },
  headerBadges: {
    alignItems: "flex-end",
    gap: spacing.xs
  },
  subscriptionBadge: {
    backgroundColor: "#f1f5f9",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  subscriptionText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  syncBadge: {
    backgroundColor: "#dcfce7",
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  syncBadgePending: {
    backgroundColor: "#fef3c7"
  },
  syncText: {
    color: "#166534",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  syncTextPending: {
    color: "#92400e"
  },
  content: {
    flex: 1
  },
  nav: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    minHeight: 62,
    paddingBottom: spacing.xs
  },
  navTab: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    position: "relative"
  },
  navTabActive: {
    backgroundColor: "#f8fafc"
  },
  navLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  navLabelActive: {
    color: colors.primary
  },
  navDot: {
    backgroundColor: colors.primary,
    borderRadius: 2,
    height: 4,
    marginTop: spacing.xs,
    width: 4
  }
});

