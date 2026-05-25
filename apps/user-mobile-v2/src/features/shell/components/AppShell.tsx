import type { PropsWithChildren } from "react";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { appSpaces } from "@/features/shell/spaceConfig";
import type { AppSpace } from "@/features/shell/types";
import { colors, spacing, typography } from "@/theme/tokens";

export type WorkTab = "claims" | "export" | "home" | "tng" | "trips";

type AppShellProps = PropsWithChildren<{
  activeSpace: AppSpace;
  activeWorkTab: WorkTab;
  displayName: string;
  email: string;
  isSigningOut: boolean;
  onOpenSettings: () => void;
  onSignOut: () => void;
  onSpaceChange: (space: AppSpace) => void;
  onWorkTabChange: (tab: WorkTab) => void;
  pendingSyncCount: number;
  subscriptionLabel: string;
}>;

export function AppShell({
  activeSpace,
  activeWorkTab,
  children,
  displayName,
  email,
  isSigningOut,
  onOpenSettings,
  onSignOut,
  onSpaceChange,
  onWorkTabChange,
  pendingSyncCount,
  subscriptionLabel
}: AppShellProps) {
  const [spaceMenuOpen, setSpaceMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const activeSpaceMeta =
    appSpaces.find((space) => space.id === activeSpace) ?? appSpaces[0];
  const footerTabs = useMemo(
    () => getFooterTabs(activeSpace, activeWorkTab),
    [activeSpace, activeWorkTab]
  );
  const accent = getSpaceAccent(activeSpace);
  const avatarLabel = (displayName || email || "U").slice(0, 1).toUpperCase();
  const subLabel = subscriptionLabel === "FREE" ? "Trial" : subscriptionLabel;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brand}>myexpensio</Text>
        <View style={styles.spaceSwitcher}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSpaceMenuOpen((open) => !open);
              setProfileMenuOpen(false);
            }}
            style={styles.spacePill}
          >
            <Text style={styles.spaceIcon}>{activeSpaceMeta.icon}</Text>
            <Text style={styles.spaceLabel}>{activeSpaceMeta.label}</Text>
            <Text style={styles.chevron}>{spaceMenuOpen ? "^" : "v"}</Text>
          </Pressable>
          {spaceMenuOpen ? (
            <View style={styles.spaceMenu}>
              {appSpaces.map((space) => {
                const active = space.id === activeSpace;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={space.id}
                    onPress={() => {
                      setSpaceMenuOpen(false);
                      onSpaceChange(space.id);
                    }}
                    style={[
                      styles.spaceOption,
                      active ? styles.spaceOptionActive : null
                    ]}
                  >
                    <Text style={styles.spaceOptionIcon}>{space.icon}</Text>
                    <View style={styles.spaceOptionText}>
                      <Text style={styles.spaceOptionLabel}>{space.label}</Text>
                      {space.premium ? (
                        <Text style={styles.premiumText}>Premium</Text>
                      ) : null}
                    </View>
                    {active ? <Text style={styles.checkMark}>OK</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityLabel="Profile and settings"
          accessibilityRole="button"
          onPress={() => {
            setProfileMenuOpen((open) => !open);
            setSpaceMenuOpen(false);
          }}
          style={[
            styles.gearButton,
            profileMenuOpen ? styles.gearButtonOpen : null
          ]}
        >
          <Text style={styles.gearText}>⚙️</Text>
        </Pressable>

        {profileMenuOpen ? (
          <View style={styles.profileMenu}>
            <View style={styles.userBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{avatarLabel}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text numberOfLines={1} style={styles.displayName}>
                  {displayName || email.split("@")[0] || "User"}
                </Text>
                <Text numberOfLines={1} style={styles.emailText}>
                  {email || "local user"}
                </Text>
              </View>
            </View>
            <View style={styles.subRow}>
              <Text
                style={[
                  styles.subBadge,
                  subscriptionLabel === "FREE"
                    ? styles.subBadgeFree
                    : styles.subBadgePaid
                ]}
              >
                {subLabel}
              </Text>
            </View>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setProfileMenuOpen(false);
                onOpenSettings();
              }}
              style={styles.profileMenuItem}
            >
              <Text style={styles.profileMenuIcon}>⚙️</Text>
              <Text style={styles.profileMenuText}>Settings</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={() => {
                setProfileMenuOpen(false);
                onSignOut();
              }}
              style={styles.signOutMenuItem}
            >
              <Text style={styles.profileMenuIcon}>🚪</Text>
              <Text style={styles.signOutMenuText}>
                {isSigningOut ? "Signing Out..." : "Sign Out"}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.statusBar}>
        <View style={styles.subscriptionBadge}>
          <Text style={styles.subscriptionText}>{subscriptionLabel}</Text>
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

      <View style={styles.content}>{children}</View>

      <View style={styles.nav}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <Text style={[styles.footerSpaceLabel, { color: accent }]}>
          {activeSpaceMeta.label}
        </Text>
        <View style={styles.navTabs}>
          {footerTabs.map((tab) => {
            const active = tab.active;

            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                disabled={tab.disabled}
                key={tab.key}
                onPress={() => {
                  if (tab.space) {
                    onSpaceChange(tab.space);
                  }
                  if (tab.workTab) {
                    onWorkTabChange(tab.workTab);
                  }
                }}
                style={styles.navTab}
              >
                {tab.primary ? (
                  <View
                    style={[
                      styles.primaryNavIcon,
                      { backgroundColor: accent }
                    ]}
                  >
                    <Text style={styles.primaryNavIconText}>{tab.icon}</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.navIconWrap,
                      active
                        ? { backgroundColor: getSpaceAccentBg(activeSpace) }
                        : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.navIcon,
                        !active || tab.disabled ? styles.navIconMuted : null
                      ]}
                    >
                      {tab.icon}
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.navLabel,
                    active ? { color: accent, fontWeight: "800" } : null,
                    tab.disabled ? styles.navLabelDisabled : null
                  ]}
                >
                  {tab.label}
                </Text>
                {active && !tab.primary ? (
                  <View style={[styles.navDot, { backgroundColor: accent }]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

type FooterTab = {
  active: boolean;
  disabled?: boolean;
  icon: string;
  key: string;
  label: string;
  primary?: boolean;
  space?: AppSpace;
  workTab?: WorkTab;
};

function getFooterTabs(activeSpace: AppSpace, activeWorkTab: WorkTab): FooterTab[] {
  if (activeSpace === "personal") {
    return [
      { active: true, icon: "⌂", key: "personal-home", label: "Home", space: "personal" },
      { active: false, icon: "$", key: "personal-expenses", label: "Expenses" },
      { active: false, icon: "+", key: "personal-add", label: "Add", primary: true },
      { active: false, icon: "□", key: "personal-bills", label: "Bills" },
      { active: false, icon: "%", key: "personal-tax", label: "Tax" }
    ];
  }

  if (activeSpace === "business") {
    return [
      { active: true, icon: "▦", key: "business-dashboard", label: "Dashboard", space: "business" },
      { active: false, icon: "$", key: "business-income", label: "Income" },
      { active: false, icon: "+", key: "business-add", label: "Add", primary: true },
      { active: false, icon: "□", key: "business-expenses", label: "Expenses" },
      { active: false, icon: "↗", key: "business-reports", label: "Reports" }
    ];
  }

  return [
    { active: activeWorkTab === "home", icon: "⌂", key: "work-home", label: "Home", space: "work", workTab: "home" },
    { active: activeWorkTab === "trips", icon: "⌖", key: "work-trips", label: "Trips", space: "work", workTab: "trips" },
    { active: activeWorkTab === "claims", icon: "□", key: "work-claims", label: "Claims", primary: true, space: "work", workTab: "claims" },
    { active: activeWorkTab === "tng", icon: "$", key: "work-transactions", label: "TNG", space: "work", workTab: "tng" },
    { active: activeWorkTab === "export", icon: "↥", key: "work-export", label: "Export", space: "work", workTab: "export" }
  ];
}

function getSpaceAccent(space: AppSpace) {
  if (space === "personal") {
    return "#4f46e5";
  }

  if (space === "business") {
    return "#16a34a";
  }

  return "#0f172a";
}

function getSpaceAccentBg(space: AppSpace) {
  if (space === "personal") {
    return "#eef2ff";
  }

  if (space === "business") {
    return "#f0fdf4";
  }

  return "#f1f5f9";
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
    minHeight: 52,
    paddingHorizontal: spacing.md,
    zIndex: 20
  },
  brand: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  spaceSwitcher: {
    position: "relative"
  },
  spacePill: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    minHeight: 30,
    paddingHorizontal: spacing.sm
  },
  spaceIcon: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  spaceLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  chevron: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "800"
  },
  spaceMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 210,
    padding: 4,
    position: "absolute",
    right: 0,
    top: 38,
    zIndex: 50
  },
  spaceOption: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.sm
  },
  spaceOptionActive: {
    backgroundColor: "#f1f5f9"
  },
  spaceOptionIcon: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  spaceOptionText: {
    flex: 1
  },
  spaceOptionLabel: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  premiumText: {
    color: "#7c3aed",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2
  },
  checkMark: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "800"
  },
  gearButton: {
    alignItems: "center",
    borderRadius: 8,
    minHeight: 34,
    justifyContent: "center",
    width: 34
  },
  gearButtonOpen: {
    backgroundColor: "#f1f5f9"
  },
  gearText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  profileMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 240,
    overflow: "hidden",
    position: "absolute",
    right: spacing.md,
    top: 46,
    zIndex: 80
  },
  userBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    paddingTop: spacing.md
  },
  avatar: {
    alignItems: "center",
    backgroundColor: colors.text,
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  avatarText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  userInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  displayName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  emailText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  subRow: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md
  },
  subBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4
  },
  subBadgeFree: {
    backgroundColor: "#f1f5f9",
    color: "#475569"
  },
  subBadgePaid: {
    backgroundColor: "#fef9c3",
    color: "#854d0e"
  },
  divider: {
    backgroundColor: "#f1f5f9",
    height: 1
  },
  profileMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  signOutMenuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md
  },
  profileMenuIcon: {
    fontSize: 18,
    width: 24
  },
  profileMenuText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  signOutMenuText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "700"
  },
  statusBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "flex-end",
    minHeight: 30,
    paddingHorizontal: spacing.md
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
    flex: 1,
    paddingBottom: 70
  },
  nav: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    minHeight: 66,
    paddingBottom: spacing.xs
  },
  accentBar: {
    height: 3,
    width: "100%"
  },
  footerSpaceLabel: {
    fontSize: 9,
    fontWeight: "800",
    opacity: 0.72,
    paddingRight: spacing.md,
    paddingTop: 3,
    textAlign: "right",
    textTransform: "uppercase"
  },
  navTabs: {
    alignItems: "flex-end",
    flexDirection: "row",
    height: 52
  },
  navTab: {
    alignItems: "center",
    flex: 1,
    gap: 2,
    justifyContent: "flex-end",
    minWidth: 0,
    paddingBottom: 7,
    position: "relative"
  },
  navIconWrap: {
    alignItems: "center",
    borderRadius: 8,
    height: 28,
    justifyContent: "center",
    width: 36
  },
  navIcon: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  navIconMuted: {
    color: "#94a3b8"
  },
  primaryNavIcon: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginBottom: 2,
    top: -8,
    width: 44
  },
  primaryNavIconText: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26
  },
  navLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700"
  },
  navLabelDisabled: {
    color: "#cbd5e1"
  },
  navDot: {
    borderRadius: 2,
    height: 4,
    position: "absolute",
    top: 4,
    width: 4
  }
});
