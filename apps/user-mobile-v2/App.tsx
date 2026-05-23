import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { DatePickerField } from "@/components/DatePickerField";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { useSignOut } from "@/features/auth/hooks/useDevAuthActions";
import { useSessionRestore } from "@/features/auth/hooks/useSessionRestore";
import { ClaimDetail } from "@/features/claims/components/ClaimDetail";
import { ClaimDraftList } from "@/features/claims/components/ClaimDraftList";
import {
  useAttachReceiptMetadataToClaimItem,
  useCreateClaimItemDraft,
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
  CreateClaimDraftInput,
  ClaimItemDraft,
  ClaimItemType
} from "@/features/claims/types";
import { useCreateBlankClaimDraft } from "@/features/claims/hooks/useCreateClaimWithItem";
import { useReceiptUploadSummary } from "@/features/receipts/hooks/useReceiptUploadSummary";
import { AppShell } from "@/features/shell/components/AppShell";
import type { AppSpace } from "@/features/shell/types";
import { FeatureGate } from "@/features/subscription/components/FeatureGate";
import type { SubscriptionTier } from "@/features/subscription/types";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import { useSyncQueueSummary } from "@/sync/hooks/useSyncQueueSummary";
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
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const signOut = useSignOut();
  const claims = useClaimDrafts();
  const selectedClaim = useClaimDraft(selectedClaimId);
  const selectedClaimItems = useClaimItems(selectedClaimId);
  const createBlankClaim = useCreateBlankClaimDraft();
  const createClaimItem = useCreateClaimItemDraft();
  const deleteClaim = useSoftDeleteClaimDraft();
  const deleteClaimItem = useSoftDeleteClaimItem();
  const updateClaim = useUpdateClaimDraft();
  const updateClaimItem = useUpdateClaimItemDraft();
  const submitClaim = useSubmitClaimDraft();
  const attachReceiptMetadata = useAttachReceiptMetadataToClaimItem();
  const receiptUploadSummary = useReceiptUploadSummary();
  const pendingSyncItems = usePendingSyncItems();
  const syncQueueSummary = useSyncQueueSummary();
  const localActionError =
    createBlankClaim.error ??
    createClaimItem.error ??
    deleteClaim.error ??
    deleteClaimItem.error ??
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

        {activeSpace === "work" ? (
          <WorkClaimsSlice
            activeClaim={selectedClaim.data ?? null}
            claims={claims.data ?? []}
            createBlankClaimLabel={
              createBlankClaim.isPending ? "Creating..." : "+ New"
            }
            errorMessage={
              localActionError instanceof Error ? localActionError.message : null
            }
            isCreatingBlankClaim={createBlankClaim.isPending}
            isLoadingClaimDetail={
              selectedClaim.isLoading || selectedClaimItems.isLoading
            }
            isLoadingClaims={claims.isLoading}
            onAttachReceiptToItem={(item) =>
              attachReceiptMetadata.mutate(item.id)
            }
            onBackToClaims={() => setSelectedClaimId(null)}
            onCloseNewClaim={() => setNewClaimOpen(false)}
            onCreateBlankClaim={async (input) => {
              const result = await createBlankClaim.mutateAsync(input);
              setNewClaimOpen(false);
              setSelectedClaimId(result.claim.id);
            }}
            onCreateClaimItem={(claim, input) =>
              createClaimItem.mutate({
                claimId: claim.id,
                currency: claim.currency,
                ...input
              })
            }
            onDeleteClaimItem={(item) => deleteClaimItem.mutate(item.id)}
            onDeleteClaim={async (claim) => {
              await deleteClaim.mutateAsync(claim.id);
              setSelectedClaimId(null);
            }}
            onOpenClaim={(claim) => setSelectedClaimId(claim.id)}
            onOpenNewClaim={() => setNewClaimOpen(true)}
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
            showNewClaimModal={newClaimOpen}
            selectedClaimItems={selectedClaimItems.data ?? []}
            syncQueueSummary={
              syncQueueSummary.data ?? {
                failed: 0,
                pending: 0,
                synced: 0,
                syncing: 0
              }
            }
            receiptUploadSummary={
              receiptUploadSummary.data ?? {
                failed: 0,
                local: 0,
                uploaded: 0,
                uploading: 0
              }
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
  claims: ClaimDraft[];
  createBlankClaimLabel: string;
  errorMessage: string | null;
  isCreatingBlankClaim: boolean;
  isLoadingClaimDetail: boolean;
  isLoadingClaims: boolean;
  onAttachReceiptToItem: (item: ClaimItemDraft) => void;
  onBackToClaims: () => void;
  onCloseNewClaim: () => void;
  onCreateBlankClaim: (input: CreateClaimDraftInput) => Promise<void>;
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
  onDeleteClaimItem: (item: ClaimItemDraft) => void;
  onDeleteClaim: (claim: ClaimDraft) => Promise<void>;
  onOpenClaim: (claim: ClaimDraft) => void;
  onOpenNewClaim: () => void;
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
  showNewClaimModal: boolean;
  selectedClaimItems: ClaimItemDraft[];
  syncQueueSummary: {
    failed: number;
    pending: number;
    synced: number;
    syncing: number;
  };
  receiptUploadSummary: {
    failed: number;
    local: number;
    uploaded: number;
    uploading: number;
  };
};

function WorkClaimsSlice({
  activeClaim,
  claims,
  createBlankClaimLabel,
  errorMessage,
  isCreatingBlankClaim,
  isLoadingClaimDetail,
  isLoadingClaims,
  onAttachReceiptToItem,
  onBackToClaims,
  onCloseNewClaim,
  onCreateBlankClaim,
  onCreateClaimItem,
  onDeleteClaimItem,
  onDeleteClaim,
  onOpenClaim,
  onOpenNewClaim,
  onSubmitClaim,
  onUpdateClaim,
  onUpdateClaimItem,
  pendingSyncCount,
  showNewClaimModal,
  selectedClaimItems,
  syncQueueSummary,
  receiptUploadSummary
}: WorkClaimsSliceProps) {
  const [claimFilter, setClaimFilter] = useState<"all" | "draft" | "submitted">(
    "all"
  );
  const draftClaimCount = claims.filter((claim) => claim.status === "draft").length;
  const submittedClaimCount = claims.filter(
    (claim) => claim.status === "submitted"
  ).length;
  const filteredClaims =
    claimFilter === "all"
      ? claims
      : claims.filter((claim) => claim.status === claimFilter);

  if (activeClaim) {
    return (
      <ClaimDetail
        claim={activeClaim}
        isLoading={isLoadingClaimDetail}
            items={selectedClaimItems}
            onAddItem={(input) => onCreateClaimItem(activeClaim, input)}
            onAttachReceipt={onAttachReceiptToItem}
            onBack={onBackToClaims}
            onDeleteClaim={() => onDeleteClaim(activeClaim)}
            onDeleteItem={onDeleteClaimItem}
        onSubmitClaim={onSubmitClaim}
        onUpdateClaim={(input) => onUpdateClaim(activeClaim, input)}
        onUpdateItem={onUpdateClaimItem}
      />
    );
  }

  return (
    <View style={styles.claimsPage}>
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.claimsHeader}>
        <View>
          <Text style={styles.claimsTitle}>Claims</Text>
          <Text style={styles.claimsSubtitle}>
            Work reimbursements ready for draft, review, and submission.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isCreatingBlankClaim}
          onPress={onOpenNewClaim}
          style={({ pressed }) => [
            styles.newClaimButton,
            pressed || isCreatingBlankClaim ? styles.primaryButtonPressed : null
          ]}
        >
          <Text style={styles.newClaimButtonText}>{createBlankClaimLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.claimTabs}>
        <ClaimFilterTab
          count={claims.length}
          isActive={claimFilter === "all"}
          label="All"
          onPress={() => setClaimFilter("all")}
        />
        <ClaimFilterTab
          count={draftClaimCount}
          isActive={claimFilter === "draft"}
          label="Draft"
          onPress={() => setClaimFilter("draft")}
        />
        <ClaimFilterTab
          count={submittedClaimCount}
          isActive={claimFilter === "submitted"}
          label="Submitted"
          onPress={() => setClaimFilter("submitted")}
        />
      </View>

      <View style={styles.claimMetaBar}>
        <Text style={styles.claimMetaText}>Sync queue: {pendingSyncCount}</Text>
        <Text style={styles.claimMetaDot}>|</Text>
        <Text style={styles.claimMetaText}>
          Pending {syncQueueSummary.pending}
        </Text>
        <Text style={styles.claimMetaDot}>|</Text>
        <Text style={styles.claimMetaText}>
          Receipts local {receiptUploadSummary.local}
        </Text>
      </View>

      <ClaimDraftList
        claims={filteredClaims}
        isLoading={isLoadingClaims}
        onOpen={onOpenClaim}
      />

      <NewClaimModal
        isCreating={isCreatingBlankClaim}
        isVisible={showNewClaimModal}
        onClose={onCloseNewClaim}
        onCreate={onCreateBlankClaim}
      />
    </View>
  );
}

function ClaimFilterTab({
  count,
  isActive,
  label,
  onPress
}: {
  count: number;
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.claimTab, isActive ? styles.claimTabActive : null]}
    >
      <Text
        style={[styles.claimTabText, isActive ? styles.claimTabTextActive : null]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.claimTabCount,
          isActive ? styles.claimTabCountActive : null
        ]}
      >
        {count}
      </Text>
    </Pressable>
  );
}

function NewClaimModal({
  isCreating,
  isVisible,
  onClose,
  onCreate
}: {
  isCreating: boolean;
  isVisible: boolean;
  onClose: () => void;
  onCreate: (input: CreateClaimDraftInput) => Promise<void>;
}) {
  const range = useMemo(() => currentMonthRange(), []);
  const [title, setTitle] = useState("");
  const [periodStart, setPeriodStart] = useState(range.start);
  const [periodEnd, setPeriodEnd] = useState(range.end);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setError(null);

    if (!periodStart || !periodEnd) {
      setError("Period start and end are required.");
      return;
    }

    if (periodStart > periodEnd) {
      setError("Start date must be before or equal to end date.");
      return;
    }

    try {
      await onCreate({
        title: title.trim() || null,
        periodStart,
        periodEnd,
        currency: "MYR"
      });

      setTitle("");
      setPeriodStart(range.start);
      setPeriodEnd(range.end);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create claim."
      );
    }
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      transparent
      visible={isVisible}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.newClaimSheet}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>New Claim</Text>
              <Text style={styles.modalSubtitle}>
                Set the period, then add your trips and expenses.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={isCreating}
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>x</Text>
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                editable={!isCreating}
                onChangeText={setTitle}
                placeholder="e.g. March 2026 - Site Visits"
                placeholderTextColor="#94a3b8"
                style={styles.input}
                value={title}
              />
              <Text style={styles.fieldHint}>
                Leave blank to use the period as the title.
              </Text>
            </View>

            <View style={styles.fieldRow}>
              <DatePickerField
                disabled={isCreating}
                label="Period start *"
                onChange={setPeriodStart}
                value={periodStart}
              />
              <DatePickerField
                disabled={isCreating}
                label="Period end *"
                onChange={setPeriodEnd}
                value={periodEnd}
              />
            </View>

            {error ? (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={isCreating}
              onPress={onClose}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={isCreating}
              onPress={() => void handleCreate()}
              style={({ pressed }) => [
                styles.createClaimButton,
                pressed || isCreating ? styles.primaryButtonPressed : null
              ]}
            >
              <Text style={styles.createClaimButtonText}>
                {isCreating ? "Creating..." : "Create Claim >"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function currentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    start: toDateInput(start),
    end: toDateInput(end)
  };
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function DeferredSpace({ spaceName }: { spaceName: string }) {
  return (
    <View style={styles.deferredState}>
      <Text style={styles.deferredTitle}>{spaceName}</Text>
      <Text style={styles.deferredCopy}>
        This space is available from the workspace switcher. Its full workflow
        will follow the established MyExpensio mobile navigation pattern.
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
  claimsPage: {
    gap: spacing.md
  },
  claimsHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  claimsTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  claimsSubtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 2,
    maxWidth: 260
  },
  newClaimButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexShrink: 0,
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  newClaimButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  claimTabs: {
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4
  },
  claimTab: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    gap: 2,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.xs
  },
  claimTabActive: {
    backgroundColor: colors.primary
  },
  claimTabText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  claimTabTextActive: {
    color: colors.onPrimary
  },
  claimTabCount: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    minWidth: 18,
    paddingHorizontal: 6,
    paddingVertical: 1,
    textAlign: "center"
  },
  claimTabCountActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    color: colors.onPrimary
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  newClaimSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 460,
    overflow: "hidden",
    width: "100%"
  },
  modalHeader: {
    alignItems: "flex-start",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 4
  },
  modalCloseButton: {
    alignItems: "center",
    borderRadius: 8,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  modalCloseText: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800"
  },
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg
  },
  field: {
    flex: 1,
    gap: 6
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  fieldLabel: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  fieldHint: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  modalErrorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  modalErrorText: {
    color: colors.danger,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  modalFooter: {
    alignItems: "center",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    padding: spacing.lg
  },
  cancelButton: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  cancelButtonText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  createClaimButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  createClaimButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "800"
  },
  claimMetaBar: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  claimMetaText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  claimMetaDot: {
    color: "#cbd5e1",
    fontSize: typography.caption,
    fontWeight: "800"
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

