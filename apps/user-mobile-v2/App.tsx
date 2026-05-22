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

import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { useSignOut } from "@/features/auth/hooks/useDevAuthActions";
import { useSessionRestore } from "@/features/auth/hooks/useSessionRestore";
import { ClaimDetail } from "@/features/claims/components/ClaimDetail";
import { ClaimDraftList } from "@/features/claims/components/ClaimDraftList";
import {
  useAddItemToClaimDraft,
  useAttachReceiptMetadataToClaimItem,
  useCreateClaimItemDraft,
  useDeleteLatestClaimItem,
  useIncreaseLatestClaimItem,
  useRenameClaimDraft,
  useSoftDeleteClaimDraft,
  useSoftDeleteClaimItem,
  useSubmitClaimDraft,
  useUpdateClaimDraft,
  useUpdateClaimItemDraft
} from "@/features/claims/hooks/useClaimDraftActions";
import {
  useClaimDraft,
  useClaimDrafts,
  useClaimItems
} from "@/features/claims/hooks/useClaimDrafts";
import type {
  ClaimDraft,
  ClaimItemDraft,
  ClaimItemType
} from "@/features/claims/types";
import {
  useCreateBlankClaimDraft,
  useCreateClaimWithItem
} from "@/features/claims/hooks/useCreateClaimWithItem";
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
import { useLocalFirstSmokeTest } from "@/features/verification/hooks/useLocalFirstSmokeTest";
import type { LocalVerificationResult } from "@/features/verification/types";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import {
  useRetryFailedSyncItems,
  useSyncQueueSummary
} from "@/sync/hooks/useSyncQueueSummary";
import { useAuthStore } from "@/state/authStore";
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
  const authStatus = useSessionRestore();
  const [activeSpace, setActiveSpace] = useState<AppSpace>("work");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const subscriptionTier: SubscriptionTier = "FREE";

  if (authStatus === "unknown") {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Restoring secure session...</Text>
      </SafeAreaView>
    );
  }

  if (authStatus === "signed_out") {
    return <LoginScreen />;
  }

  return (
    <AuthenticatedHome
      activeSpace={activeSpace}
      onSpaceChange={setActiveSpace}
      settingsOpen={settingsOpen}
      onToggleSettings={() => setSettingsOpen((open) => !open)}
      subscriptionTier={subscriptionTier}
    />
  );
}

function AuthenticatedHome({
  activeSpace,
  onSpaceChange,
  onToggleSettings,
  settingsOpen,
  subscriptionTier
}: {
  activeSpace: AppSpace;
  onSpaceChange: (space: AppSpace) => void;
  onToggleSettings: () => void;
  settingsOpen: boolean;
  subscriptionTier: SubscriptionTier;
}) {
  const session = useAuthStore((state) => state.session);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const signOut = useSignOut();
  const drafts = useExpenseDrafts();
  const createDraft = useCreateDraftExpense();
  const claims = useClaimDrafts();
  const selectedClaim = useClaimDraft(selectedClaimId);
  const selectedClaimItems = useClaimItems(selectedClaimId);
  const createBlankClaim = useCreateBlankClaimDraft();
  const createClaim = useCreateClaimWithItem();
  const addItemToClaim = useAddItemToClaimDraft();
  const createClaimItem = useCreateClaimItemDraft();
  const deleteClaim = useSoftDeleteClaimDraft();
  const deleteLatestItem = useDeleteLatestClaimItem();
  const deleteClaimItem = useSoftDeleteClaimItem();
  const increaseLatestItem = useIncreaseLatestClaimItem();
  const renameClaim = useRenameClaimDraft();
  const updateClaim = useUpdateClaimDraft();
  const updateClaimItem = useUpdateClaimItemDraft();
  const submitClaim = useSubmitClaimDraft();
  const attachReceiptMetadata = useAttachReceiptMetadataToClaimItem();
  const receiptUploadSummary = useReceiptUploadSummary();
  const retryFailedReceiptUploads = useRetryFailedReceiptUploads();
  const localFirstSmokeTest = useLocalFirstSmokeTest();
  const pendingSyncItems = usePendingSyncItems();
  const retryFailedSyncItems = useRetryFailedSyncItems();
  const syncQueueSummary = useSyncQueueSummary();
  const localActionError =
    createClaim.error ??
    createBlankClaim.error ??
    createDraft.error ??
    addItemToClaim.error ??
    createClaimItem.error ??
    deleteClaim.error ??
    deleteClaimItem.error ??
    deleteLatestItem.error ??
    increaseLatestItem.error ??
    renameClaim.error ??
    updateClaim.error ??
    updateClaimItem.error ??
    submitClaim.error ??
    attachReceiptMetadata.error;

  return (
    <AppShell
      activeSpace={activeSpace}
      onSpaceChange={onSpaceChange}
      onOpenSettings={onToggleSettings}
      pendingSyncCount={pendingSyncItems.data?.length ?? 0}
      subscriptionLabel={subscriptionTier}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {settingsOpen ? (
          <SettingsPanel
            email={session?.email ?? null}
            isSigningOut={signOut.isPending}
            onSignOut={() => signOut.mutate()}
            subscriptionTier={subscriptionTier}
          />
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
            activeClaim={selectedClaim.data ?? null}
            claimCount={claims.data?.length ?? 0}
            claims={claims.data ?? []}
            createBlankClaimLabel={
              createBlankClaim.isPending ? "Creating..." : "Create blank claim"
            }
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
            isCreatingBlankClaim={createBlankClaim.isPending}
            isCreatingExpense={createDraft.isPending}
            isLoadingClaimDetail={
              selectedClaim.isLoading || selectedClaimItems.isLoading
            }
            isLoadingClaims={claims.isLoading}
            isLoadingExpenses={drafts.isLoading}
            onAddItemToClaim={(claim) => addItemToClaim.mutate(claim)}
            onAttachReceiptToItem={(item) =>
              attachReceiptMetadata.mutate(item.id)
            }
            onBackToClaims={() => setSelectedClaimId(null)}
            onCreateBlankClaim={() => createBlankClaim.mutate()}
            onCreateClaim={() => createClaim.mutate()}
            onCreateClaimItem={(claim, input) =>
              createClaimItem.mutate({
                claimId: claim.id,
                currency: claim.currency,
                ...input
              })
            }
            onCreateExpense={() => createDraft.mutate()}
            onDeleteClaim={(claim) => deleteClaim.mutate(claim.id)}
            onDeleteClaimItem={(item) => deleteClaimItem.mutate(item.id)}
            onDeleteLatestItem={(claim) => deleteLatestItem.mutate(claim.id)}
            onIncreaseLatestItem={(claim) => increaseLatestItem.mutate(claim.id)}
            onOpenClaim={(claim) => setSelectedClaimId(claim.id)}
            onRenameClaim={(claim) => renameClaim.mutate(claim)}
            onSubmitClaim={(claim) => submitClaim.mutate(claim.id)}
            onUpdateClaim={(claim, input) =>
              updateClaim.mutate({
                claimId: claim.id,
                ...input
              })
            }
            onUpdateClaimItem={(item, input) =>
              updateClaimItem.mutate({
                itemId: item.id,
                ...input
              })
            }
            pendingSyncCount={pendingSyncItems.data?.length ?? 0}
            selectedClaimItems={selectedClaimItems.data ?? []}
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
            onRunSmokeTest={() => localFirstSmokeTest.mutate()}
            smokeTestError={
              localFirstSmokeTest.error instanceof Error
                ? localFirstSmokeTest.error.message
                : null
            }
            smokeTestLabel={
              localFirstSmokeTest.isPending
                ? "Running..."
                : "Run local-first smoke test"
            }
            smokeTestResult={localFirstSmokeTest.data ?? null}
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

function SettingsPanel({
  email,
  isSigningOut,
  onSignOut,
  subscriptionTier
}: {
  email: string | null;
  isSigningOut: boolean;
  onSignOut: () => void;
  subscriptionTier: SubscriptionTier;
}) {
  return (
    <View style={styles.settingsPanel}>
      <Text style={styles.settingsTitle}>Profile & settings</Text>
      <Text style={styles.settingsCopy}>
        Account, profile, rates, biometric login, and billing entry points will
        live here. Current local tier placeholder: {subscriptionTier}.
      </Text>
      <Text style={styles.settingsCopy}>Signed in as {email ?? "local user"}.</Text>
      <Pressable
        accessibilityRole="button"
        disabled={isSigningOut}
        onPress={onSignOut}
        style={({ pressed }) => [
          styles.signOutButton,
          pressed || isSigningOut ? styles.primaryButtonPressed : null
        ]}
      >
        <Text style={styles.signOutButtonText}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </Text>
      </Pressable>
    </View>
  );
}

type WorkClaimsSliceProps = {
  activeClaim: ClaimDraft | null;
  claimCount: number;
  claims: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>;
  createBlankClaimLabel: string;
  createClaimLabel: string;
  createExpenseLabel: string;
  draftCount: number;
  errorMessage: string | null;
  expenseDrafts: NonNullable<ReturnType<typeof useExpenseDrafts>["data"]>;
  isCreatingClaim: boolean;
  isCreatingBlankClaim: boolean;
  isCreatingExpense: boolean;
  isLoadingClaimDetail: boolean;
  isLoadingClaims: boolean;
  isLoadingExpenses: boolean;
  onAddItemToClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onAttachReceiptToItem: (item: ClaimItemDraft) => void;
  onBackToClaims: () => void;
  onCreateBlankClaim: () => void;
  onCreateClaim: () => void;
  onCreateClaimItem: (
    claim: ClaimDraft,
    input: {
      amountCents: number;
      itemDate: string;
      notes: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
  onCreateExpense: () => void;
  onDeleteClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onDeleteClaimItem: (item: ClaimItemDraft) => void;
  onDeleteLatestItem: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onIncreaseLatestItem: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onOpenClaim: (claim: ClaimDraft) => void;
  onRenameClaim: (claim: NonNullable<ReturnType<typeof useClaimDrafts>["data"]>[number]) => void;
  onSubmitClaim: (claim: ClaimDraft) => void;
  onUpdateClaim: (
    claim: ClaimDraft,
    input: {
      periodEnd: string | null;
      periodStart: string | null;
      title: string | null;
    }
  ) => void;
  onUpdateClaimItem: (
    item: ClaimItemDraft,
    input: {
      amountCents: number;
      itemDate: string;
      notes: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => void;
  pendingSyncCount: number;
  selectedClaimItems: ClaimItemDraft[];
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
  onRunSmokeTest: () => void;
  receiptRetryLabel: string;
  smokeTestError: string | null;
  smokeTestLabel: string;
  smokeTestResult: LocalVerificationResult | null;
};

function WorkClaimsSlice({
  activeClaim,
  claimCount,
  claims,
  createBlankClaimLabel,
  createClaimLabel,
  createExpenseLabel,
  draftCount,
  errorMessage,
  expenseDrafts,
  isCreatingClaim,
  isCreatingBlankClaim,
  isCreatingExpense,
  isLoadingClaimDetail,
  isLoadingClaims,
  isLoadingExpenses,
  onAddItemToClaim,
  onAttachReceiptToItem,
  onBackToClaims,
  onCreateBlankClaim,
  onCreateClaim,
  onCreateClaimItem,
  onCreateExpense,
  onDeleteClaim,
  onDeleteClaimItem,
  onDeleteLatestItem,
  onIncreaseLatestItem,
  onOpenClaim,
  onRenameClaim,
  onSubmitClaim,
  onUpdateClaim,
  onUpdateClaimItem,
  pendingSyncCount,
  selectedClaimItems,
  syncQueueSummary,
  onRetryFailedSync,
  retryLabel,
  receiptUploadSummary,
  onRetryFailedReceipts,
  onRunSmokeTest,
  receiptRetryLabel,
  smokeTestError,
  smokeTestLabel,
  smokeTestResult
}: WorkClaimsSliceProps) {
  if (activeClaim) {
    return (
      <ClaimDetail
        claim={activeClaim}
        isLoading={isLoadingClaimDetail}
        items={selectedClaimItems}
        onAddItem={(input) => onCreateClaimItem(activeClaim, input)}
        onAttachReceipt={onAttachReceiptToItem}
        onBack={onBackToClaims}
        onDeleteItem={onDeleteClaimItem}
        onSubmitClaim={onSubmitClaim}
        onUpdateClaim={(input) => onUpdateClaim(activeClaim, input)}
        onUpdateItem={onUpdateClaimItem}
      />
    );
  }

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

      <View style={styles.verificationPanel}>
        <View style={styles.syncPanelHeader}>
          <Text style={styles.syncPanelTitle}>Sprint 1 verification</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRunSmokeTest}
            style={({ pressed }) => [
              styles.retryButton,
              pressed ? styles.primaryButtonPressed : null
            ]}
          >
            <Text style={styles.retryButtonText}>{smokeTestLabel}</Text>
          </Pressable>
        </View>
        <Text style={styles.verificationCopy}>
          Creates a smoke-test claim, reads it back from SQLite, then simulates
          an offline sync failure against only that smoke-test queue.
        </Text>
        {smokeTestError ? (
          <Text style={styles.verificationError}>{smokeTestError}</Text>
        ) : null}
        {smokeTestResult ? (
          <View style={styles.verificationResult}>
            <Text style={styles.verificationLine}>
              SQLite read-back: {smokeTestResult.claimReadBack ? "pass" : "fail"}
            </Text>
            <Text style={styles.verificationLine}>
              Failed sync kept claim:{" "}
              {smokeTestResult.failedNetworkKeptClaim ? "pass" : "fail"}
            </Text>
            <Text style={styles.verificationLine}>
              Smoke queue pushed/failed:{" "}
              {smokeTestResult.failedNetworkResult.pushed}/
              {smokeTestResult.failedNetworkResult.failed}
            </Text>
            <Text style={styles.verificationLine}>
              Pending queue before/after create: {smokeTestResult.pendingBefore}/
              {smokeTestResult.pendingAfterCreate}
            </Text>
          </View>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={isCreatingBlankClaim}
        onPress={onCreateBlankClaim}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed || isCreatingBlankClaim ? styles.primaryButtonPressed : null
        ]}
      >
        <Text style={styles.primaryButtonText}>{createBlankClaimLabel}</Text>
      </Pressable>

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
          onOpen={onOpenClaim}
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
  verificationPanel: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  verificationCopy: {
    color: "#166534",
    fontSize: typography.caption,
    lineHeight: 18
  },
  verificationError: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  verificationResult: {
    gap: spacing.xs
  },
  verificationLine: {
    color: "#14532d",
    fontSize: typography.caption,
    fontWeight: "700"
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
  },
  signOutButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  signOutButtonText: {
    color: "#1e3a8a",
    fontSize: typography.caption,
    fontWeight: "800"
  }
});

