import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { ClaimDraftList } from "@/features/claims/components/ClaimDraftList";
import { useClaimDrafts } from "@/features/claims/hooks/useClaimDrafts";
import { useCreateClaimWithItem } from "@/features/claims/hooks/useCreateClaimWithItem";
import { ExpenseDraftList } from "@/features/expenses/components/ExpenseDraftList";
import { useCreateDraftExpense } from "@/features/expenses/hooks/useCreateDraftExpense";
import { useExpenseDrafts } from "@/features/expenses/hooks/useExpenseDrafts";
import { AppShell } from "@/features/shell/components/AppShell";
import type { AppSpace } from "@/features/shell/types";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import { colors, spacing, typography } from "@/theme/tokens";

export default function App() {
  const queryClient = useMemo(() => new QueryClient(), []);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeLocalDatabase()
      .then(() => setIsReady(true))
      .catch((databaseError: unknown) => {
        setError(
          databaseError instanceof Error
            ? databaseError.message
            : "Unable to initialize the local database."
        );
      });
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.title}>MyExpensio Mobile v2</Text>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!isReady) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Preparing local workspace...</Text>
      </SafeAreaView>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MobileV2Home />
      <StatusBar style="dark" />
    </QueryClientProvider>
  );
}

function MobileV2Home() {
  const [activeSpace, setActiveSpace] = useState<AppSpace>("work");
  const drafts = useExpenseDrafts();
  const createDraft = useCreateDraftExpense();
  const claims = useClaimDrafts();
  const createClaim = useCreateClaimWithItem();
  const pendingSyncItems = usePendingSyncItems();

  return (
    <AppShell
      activeSpace={activeSpace}
      onSpaceChange={setActiveSpace}
      pendingSyncCount={pendingSyncItems.data?.length ?? 0}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Local-first rewrite</Text>
          <Text style={styles.title}>MyExpensio Mobile v2</Text>
          <Text style={styles.subtitle}>
            Sprint 1 slice: create claims and expense drafts locally, queue them
            for sync, and keep the current app untouched.
          </Text>
        </View>

        {activeSpace === "work" ? (
          <WorkClaimsSlice
            claimCount={claims.data?.length ?? 0}
            claims={claims.data ?? []}
            createClaimLabel={
              createClaim.isPending ? "Creating..." : "Create claim + item"
            }
            createExpenseLabel={
              createDraft.isPending ? "Creating..." : "Create local draft"
            }
            draftCount={drafts.data?.length ?? 0}
            expenseDrafts={drafts.data ?? []}
            isCreatingClaim={createClaim.isPending}
            isCreatingExpense={createDraft.isPending}
            isLoadingClaims={claims.isLoading}
            isLoadingExpenses={drafts.isLoading}
            onCreateClaim={() => createClaim.mutate()}
            onCreateExpense={() => createDraft.mutate()}
            pendingSyncCount={pendingSyncItems.data?.length ?? 0}
          />
        ) : (
          <DeferredSpace
            spaceName={
              activeSpace === "personal"
                ? "Personal Expense"
                : "Business Space"
            }
          />
        )}
      </ScrollView>
    </AppShell>
  );
}

type WorkClaimsSliceProps = {
  claimCount: number;
  claims: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>;
  createClaimLabel: string;
  createExpenseLabel: string;
  draftCount: number;
  expenseDrafts: NonNullable<ReturnType<typeof useExpenseDrafts>["data"]>;
  isCreatingClaim: boolean;
  isCreatingExpense: boolean;
  isLoadingClaims: boolean;
  isLoadingExpenses: boolean;
  onCreateClaim: () => void;
  onCreateExpense: () => void;
  pendingSyncCount: number;
};

function WorkClaimsSlice({
  claimCount,
  claims,
  createClaimLabel,
  createExpenseLabel,
  draftCount,
  expenseDrafts,
  isCreatingClaim,
  isCreatingExpense,
  isLoadingClaims,
  isLoadingExpenses,
  onCreateClaim,
  onCreateExpense,
  pendingSyncCount
}: WorkClaimsSliceProps) {
  return (
    <>
      <View style={styles.statusRow}>
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>{claimCount}</Text>
          <Text style={styles.statusLabel}>Local claims</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>{draftCount}</Text>
          <Text style={styles.statusLabel}>Local expenses</Text>
        </View>
        <View style={styles.statusItem}>
          <Text style={styles.statusValue}>{pendingSyncCount}</Text>
          <Text style={styles.statusLabel}>Sync queue</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isCreatingClaim}
        onPress={onCreateClaim}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed || isCreatingClaim ? styles.primaryButtonPressed : null
        ]}
      >
        <Text style={styles.primaryButtonText}>{createClaimLabel}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={isCreatingExpense}
        onPress={onCreateExpense}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed || isCreatingExpense ? styles.primaryButtonPressed : null
        ]}
      >
        <Text style={styles.secondaryButtonText}>{createExpenseLabel}</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Work claim drafts</Text>
        <ClaimDraftList claims={claims} isLoading={isLoadingClaims} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense drafts</Text>
        <ExpenseDraftList
          drafts={expenseDrafts}
          isLoading={isLoadingExpenses}
        />
      </View>
    </>
  );
}

function DeferredSpace({ spaceName }: { spaceName: string }) {
  return (
    <View style={styles.deferredState}>
      <Text style={styles.deferredTitle}>{spaceName}</Text>
      <Text style={styles.deferredCopy}>
        This space is mapped in the full delivery roadmap. Sprint 1 keeps the
        navigation slot ready while the Work Claims local-first slice is built.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    padding: spacing.lg
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg
  },
  header: {
    gap: spacing.sm
  },
  section: {
    gap: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  eyebrow: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22
  },
  loadingText: {
    color: colors.muted,
    fontSize: typography.body
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.body,
    textAlign: "center"
  },
  statusRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  statusItem: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md
  },
  statusValue: {
    color: colors.text,
    fontSize: typography.metric,
    fontWeight: "800"
  },
  statusLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    marginTop: 2
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  primaryButtonPressed: {
    opacity: 0.82
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "700"
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  deferredState: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  deferredTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  deferredCopy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22
  }
});

