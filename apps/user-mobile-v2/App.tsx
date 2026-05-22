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
import {
  useAddItemToClaimDraft,
  useDeleteLatestClaimItem,
  useIncreaseLatestClaimItem,
  useRenameClaimDraft,
  useSoftDeleteClaimDraft
} from "@/features/claims/hooks/useClaimDraftActions";
import { useClaimDrafts } from "@/features/claims/hooks/useClaimDrafts";
import { useCreateClaimWithItem } from "@/features/claims/hooks/useCreateClaimWithItem";
import { ExpenseDraftList } from "@/features/expenses/components/ExpenseDraftList";
import { useCreateDraftExpense } from "@/features/expenses/hooks/useCreateDraftExpense";
import { useExpenseDrafts } from "@/features/expenses/hooks/useExpenseDrafts";
import {
  useReceiptUploadSummary,
  useRetryFailedReceiptUploads
} from "@/features/receipts/hooks/useReceiptUploadSummary";
import { AppShell } from "@/features/shell/components/AppShell";
import type { AppSpace } from "@/features/shell/types";
import { FeatureGate } from "@/features/subscription/components/FeatureGate";
import type { SubscriptionTier } from "@/features/subscription/types";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import {
  useRetryFailedSyncItems,
  useSyncQueueSummary
} from "@/sync/hooks/useSyncQueueSummary";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const subscriptionTier: SubscriptionTier = "FREE";
  const drafts = useExpenseDrafts();
  const createDraft = useCreateDraftExpense();
  const claims = useClaimDrafts();
  const createClaim = useCreateClaimWithItem();
  const addItemToClaim = useAddItemToClaimDraft();
  const deleteClaim = useSoftDeleteClaimDraft();
  const deleteLatestItem = useDeleteLatestClaimItem();
  const increaseLatestItem = useIncreaseLatestClaimItem();
  const renameClaim = useRenameClaimDraft();
  const receiptUploadSummary = useReceiptUploadSummary();
  const retryFailedReceiptUploads = useRetryFailedReceiptUploads();
  const pendingSyncItems = usePendingSyncItems();
  const retryFailedSyncItems = useRetryFailedSyncItems();
  const syncQueueSummary = useSyncQueueSummary();
  const localActionError =
    createClaim.error ??
    createDraft.error ??
    addItemToClaim.error ??
    deleteClaim.error ??
    deleteLatestItem.error ??
    increaseLatestItem.error ??
    renameClaim.error;

  return (
    <AppShell
      activeSpace={activeSpace}
      onSpaceChange={setActiveSpace}
      onOpenSettings={() => setSettingsOpen((open) => !open)}
      pendingSyncCount={pendingSyncItems.data?.length ?? 0}
      subscriptionLabel={subscriptionTier}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {settingsOpen ? (
          <SettingsPanel subscriptionTier={subscriptionTier} />
        ) : null}

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
            errorMessage={
              localActionError instanceof Error ? localActionError.message : null
            }
            isCreatingClaim={createClaim.isPending}
            isCreatingExpense={createDraft.isPending}
            isLoadingClaims={claims.isLoading}
            isLoadingExpenses={drafts.isLoading}
            onAddItemToClaim={(claim) => addItemToClaim.mutate(claim)}
            onCreateClaim={() => createClaim.mutate()}
            onCreateExpense={() => createDraft.mutate()}
            onDeleteClaim={(claim) => deleteClaim.mutate(claim.id)}
            onDeleteLatestItem={(claim) => deleteLatestItem.mutate(claim.id)}
            onIncreaseLatestItem={(claim) => increaseLatestItem.mutate(claim.id)}
            onRenameClaim={(claim) => renameClaim.mutate(claim)}
            pendingSyncCount={pendingSyncItems.data?.length ?? 0}
            syncQueueSummary={
              syncQueueSummary.data ?? {
                failed: 0,
                pending: 0,
                synced: 0,
                syncing: 0
              }
            }
            onRetryFailedSync={() => retryFailedSyncItems.mutate()}
            retryLabel={
              retryFailedSyncItems.isPending ? "Retrying..." : "Retry failed"
            }
            receiptUploadSummary={
              receiptUploadSummary.data ?? {
                failed: 0,
                local: 0,
                uploaded: 0,
                uploading: 0
              }
            }
            onRetryFailedReceipts={() => retryFailedReceiptUploads.mutate()}
            receiptRetryLabel={
              retryFailedReceiptUploads.isPending
                ? "Retrying..."
                : "Retry receipt uploads"
            }
          />
        ) : activeSpace === "business" ? (
          <FeatureGate feature="business_space" tier={subscriptionTier}>
            <DeferredSpace spaceName="Business Space" />
          </FeatureGate>
        ) : (
          <DeferredSpace
            spaceName="Personal Expense"
          />
        )}
      </ScrollView>
    </AppShell>
  );
}

function SettingsPanel({ subscriptionTier }: { subscriptionTier: SubscriptionTier }) {
  return (
    <View style={styles.settingsPanel}>
      <Text style={styles.settingsTitle}>Profile & settings</Text>
      <Text style={styles.settingsCopy}>
        Account, profile, rates, biometric login, and billing entry points will
        live here. Current local tier placeholder: {subscriptionTier}.
      </Text>
    </View>
  );
}

type WorkClaimsSliceProps = {
  claimCount: number;
  claims: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>;
  createClaimLabel: string;
  createExpenseLabel: string;
  draftCount: number;
  errorMessage: string | null;
  expenseDrafts: NonNullable<ReturnType<typeof useExpenseDrafts>["data"]>;
  isCreatingClaim: boolean;
  isCreatingExpense: boolean;
  isLoadingClaims: boolean;
  isLoadingExpenses: boolean;
  onAddItemToClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onCreateClaim: () => void;
  onCreateExpense: () => void;
  onDeleteClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onDeleteLatestItem: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onIncreaseLatestItem: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onRenameClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  pendingSyncCount: number;
  syncQueueSummary: {
    failed: number;
    pending: number;
    synced: number;
    syncing: number;
  };
  onRetryFailedSync: () => void;
  retryLabel: string;
  receiptUploadSummary: {
    failed: number;
    local: number;
    uploaded: number;
    uploading: number;
  };
  onRetryFailedReceipts: () => void;
  receiptRetryLabel: string;
};

function WorkClaimsSlice({
  claimCount,
  claims,
  createClaimLabel,
  createExpenseLabel,
  draftCount,
  errorMessage,
  expenseDrafts,
  isCreatingClaim,
  isCreatingExpense,
  isLoadingClaims,
  isLoadingExpenses,
  onAddItemToClaim,
  onCreateClaim,
  onCreateExpense,
  onDeleteClaim,
  onDeleteLatestItem,
  onIncreaseLatestItem,
  onRenameClaim,
  pendingSyncCount,
  syncQueueSummary,
  onRetryFailedSync,
  retryLabel,
  receiptUploadSummary,
  onRetryFailedReceipts,
  receiptRetryLabel
}: WorkClaimsSliceProps) {
  return (
    <>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

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

      <View style={styles.syncPanel}>
        <View style={styles.syncPanelHeader}>
          <Text style={styles.syncPanelTitle}>Sync queue</Text>
          <Pressable
            accessibilityRole="button"
            disabled={syncQueueSummary.failed === 0}
            onPress={onRetryFailedSync}
            style={({ pressed }) => [
              styles.retryButton,
              syncQueueSummary.failed === 0 ? styles.retryButtonDisabled : null,
              pressed ? styles.primaryButtonPressed : null
            ]}
          >
            <Text style={styles.retryButtonText}>{retryLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.syncStats}>
          <Text style={styles.syncStat}>Pending {syncQueueSummary.pending}</Text>
          <Text style={styles.syncStat}>Syncing {syncQueueSummary.syncing}</Text>
          <Text style={styles.syncStat}>Failed {syncQueueSummary.failed}</Text>
          <Text style={styles.syncStat}>Synced {syncQueueSummary.synced}</Text>
        </View>
      </View>

      <View style={styles.syncPanel}>
        <View style={styles.syncPanelHeader}>
          <Text style={styles.syncPanelTitle}>Receipt uploads</Text>
          <Pressable
            accessibilityRole="button"
            disabled={receiptUploadSummary.failed === 0}
            onPress={onRetryFailedReceipts}
            style={({ pressed }) => [
              styles.retryButton,
              receiptUploadSummary.failed === 0 ? styles.retryButtonDisabled : null,
              pressed ? styles.primaryButtonPressed : null
            ]}
          >
            <Text style={styles.retryButtonText}>{receiptRetryLabel}</Text>
          </Pressable>
        </View>
        <View style={styles.syncStats}>
          <Text style={styles.syncStat}>Local {receiptUploadSummary.local}</Text>
          <Text style={styles.syncStat}>Uploading {receiptUploadSummary.uploading}</Text>
          <Text style={styles.syncStat}>Failed {receiptUploadSummary.failed}</Text>
          <Text style={styles.syncStat}>Uploaded {receiptUploadSummary.uploaded}</Text>
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
        <ClaimDraftList
          claims={claims}
          isLoading={isLoadingClaims}
          onAddItem={onAddItemToClaim}
          onDelete={onDeleteClaim}
          onDeleteLatestItem={onDeleteLatestItem}
          onIncreaseLatestItem={onIncreaseLatestItem}
          onRename={onRenameClaim}
        />
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
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "700"
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
  syncPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  syncPanelHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  syncPanelTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  syncStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  syncStat: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  retryButton: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  retryButtonDisabled: {
    opacity: 0.5
  },
  retryButtonText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "700"
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
  },
  settingsPanel: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  settingsTitle: {
    color: "#1e3a8a",
    fontSize: typography.body,
    fontWeight: "800"
  },
  settingsCopy: {
    color: "#1d4ed8",
    fontSize: typography.body,
    lineHeight: 22
  }
});

