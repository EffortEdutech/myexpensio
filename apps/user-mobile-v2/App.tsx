import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  AppState,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DatePickerField } from "@/components/DatePickerField";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { ResetPasswordScreen } from "@/features/auth/components/ResetPasswordScreen";
import { nativeBiometricAuthAdapter } from "@/features/auth/biometricAuth";
import { useSignOut } from "@/features/auth/hooks/useAuthActions";
import { useOrgContext } from "@/features/auth/hooks/useOrgContext";
import { useSessionRestore } from "@/features/auth/hooks/useSessionRestore";
import { ClaimDetail } from "@/features/claims/components/ClaimDetail";
import { ClaimDraftList } from "@/features/claims/components/ClaimDraftList";
import {
  useAttachReceiptMetadataToClaimItem,
  useCreateClaimItemDraft,
  useLinkTngTransactionToClaimItem,
  useSoftDeleteClaimDraft,
  useSoftDeleteClaimItem,
  useSubmitClaimDraft,
  useUpdateClaimDraft,
  useUpdateClaimItemDraft,
  useUnlinkTngTransactionFromClaimItem
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
import { ExportScreen } from "@/features/exports/components/ExportScreen";
import { useCreateBlankClaimDraft } from "@/features/claims/hooks/useCreateClaimWithItem";
import { useReceiptUploadSummary } from "@/features/receipts/hooks/useReceiptUploadSummary";
import type { LocalReceiptFile } from "@/features/receipts/types";
import { AppShell } from "@/features/shell/components/AppShell";
import type { WorkTab, PersonalView, BusinessView } from "@/features/shell/components/AppShell";
import type { AppSpace } from "@/features/shell/types";
import { FeatureGate } from "@/features/subscription/components/FeatureGate";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import type { SubscriptionTier } from "@/features/subscription/types";
import { useProfileSave } from "@/features/profile/hooks/useProfileSave";
import { TripsScreen } from "@/features/trips/components/TripsScreen";
import type { TripDraft } from "@/features/trips/types";
import {
  useCreateTrip,
  useSoftDeleteTrip,
  useStopGpsTrip,
  useUpdateTrip
} from "@/features/trips/hooks/useTripActions";
import { useTrips } from "@/features/trips/hooks/useTrips";
import { TngScreen } from "@/features/tng/components/TngScreen";
import { WorkHomeScreen } from "@/features/shell/components/WorkHomeScreen";
import { useTngTransactions } from "@/features/tng/hooks/useTngLibrary";
import type { TngTransaction } from "@/features/tng/types";
import { PersonalSpace } from "@/features/personal/components/PersonalSpace";
import { BusinessSpace } from "@/features/business/components/BusinessSpace";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import { useSyncQueueSummary } from "@/sync/hooks/useSyncQueueSummary";
import { useSyncEngine } from "@/sync/hooks/useSyncEngine";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { useAuthStore } from "@/state/authStore";
import {
  type ClaimRates,
  defaultRates,
  useUserSettingsStore
} from "@/state/settingsStore";
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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        {error ? (
          <SafeAreaView style={styles.centered}>
            <Text style={styles.title}>MyExpensio Mobile v2</Text>
            <Text style={styles.errorText}>{error}</Text>
          </SafeAreaView>
        ) : !isReady ? (
          <SafeAreaView style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Preparing local workspace...</Text>
          </SafeAreaView>
        ) : (
          <MobileV2Home />
        )}
        <StatusBar style="dark" />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// ── Deep-link URL parser ──────────────────────────────────────────────────────

type DeepLinkResetPassword = { type: "reset-password"; accessToken: string; refreshToken: string };
type DeepLinkParsed = DeepLinkResetPassword | null;

function parseDeepLinkUrl(url: string): DeepLinkParsed {
  if (!url.startsWith("myexpensio://")) return null;
  const hashIdx = url.indexOf("#");
  const paramStr = hashIdx >= 0 ? url.slice(hashIdx + 1) : url.slice(url.indexOf("?") + 1);
  const params = new URLSearchParams(paramStr);
  if (url.includes("reset-password") && params.get("type") === "recovery") {
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      return { type: "reset-password", accessToken, refreshToken };
    }
  }
  return null;
}

function MobileV2Home() {
  const authStatus = useSessionRestore();
  const [activeSpace, setActiveSpace] = useState<AppSpace>("work");
  const [activeWorkTab, setActiveWorkTab] = useState<WorkTab>("claims");
  const [personalView, setPersonalView] = useState<PersonalView>("home");
  const [businessView, setBusinessView] = useState<BusinessView>("dashboard");
  const [personalAddOpen, setPersonalAddOpen] = useState(false);
  const [businessAddOpen, setBusinessAddOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { tier: subscriptionTier } = useSubscription();

  // ── Deep-link handler ──────────────────────────────────────────────────────
  const [deepLinkReset, setDeepLinkReset] = useState<DeepLinkResetPassword | null>(null);

  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) {
        const parsed = parseDeepLinkUrl(url);
        if (parsed?.type === "reset-password") setDeepLinkReset(parsed);
      }
    });
    const sub = Linking.addEventListener("url", ({ url }) => {
      const parsed = parseDeepLinkUrl(url);
      if (parsed?.type === "reset-password") setDeepLinkReset(parsed);
    });
    return () => sub.remove();
  }, []);

  if (deepLinkReset) {
    return (
      <ResetPasswordScreen
        accessToken={deepLinkReset.accessToken}
        refreshToken={deepLinkReset.refreshToken}
        onComplete={() => setDeepLinkReset(null)}
      />
    );
  }

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
      activeWorkTab={activeWorkTab}
      personalView={personalView}
      businessView={businessView}
      personalAddOpen={personalAddOpen}
      businessAddOpen={businessAddOpen}
      onSpaceChange={(space) => {
        setActiveSpace(space);
        setSettingsOpen(false);
        // Reset sub-views when switching space
        if (space === "personal") setPersonalView("home");
        if (space === "business") setBusinessView("dashboard");
      }}
      onPersonalViewChange={(view) => {
        if (view === "add") { setPersonalAddOpen(true); return; }
        setPersonalView(view);
        setSettingsOpen(false);
      }}
      onBusinessViewChange={(view) => {
        if (view === "add") { setBusinessAddOpen(true); return; }
        setBusinessView(view);
        setSettingsOpen(false);
      }}
      onPersonalAddClose={() => setPersonalAddOpen(false)}
      onBusinessAddClose={() => setBusinessAddOpen(false)}
      settingsOpen={settingsOpen}
      onWorkTabChange={(tab) => {
        setActiveWorkTab(tab);
        setSettingsOpen(false);
      }}
      onOpenSettings={() => setSettingsOpen(true)}
      subscriptionTier={subscriptionTier}
    />
  );
}

function AuthenticatedHome({
  activeSpace,
  activeWorkTab,
  personalView,
  businessView,
  personalAddOpen,
  businessAddOpen,
  onOpenSettings,
  onSpaceChange,
  onPersonalViewChange,
  onBusinessViewChange,
  onPersonalAddClose,
  onBusinessAddClose,
  onWorkTabChange,
  settingsOpen,
  subscriptionTier
}: {
  activeSpace: AppSpace;
  activeWorkTab: WorkTab;
  personalView: PersonalView;
  businessView: BusinessView;
  personalAddOpen: boolean;
  businessAddOpen: boolean;
  onOpenSettings: () => void;
  onSpaceChange: (space: AppSpace) => void;
  onPersonalViewChange: (view: PersonalView | "add") => void;
  onBusinessViewChange: (view: BusinessView | "add") => void;
  onPersonalAddClose: () => void;
  onBusinessAddClose: () => void;
  onWorkTabChange: (tab: WorkTab) => void;
  settingsOpen: boolean;
  subscriptionTier: SubscriptionTier;
}) {
  const session = useAuthStore((state) => state.session);
  const profile = useUserSettingsStore((state) => state.profile);
  const settingsRates = useUserSettingsStore((state) => state.rates);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);
  const signOut = useSignOut();

  // ── Biometric lock on app resume ─────────────────────────────────────────────
  useEffect(() => {
    let appWasBackground = false; // only lock after coming back from background

    const sub = AppState.addEventListener("change", async (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        appWasBackground = true;
        return;
      }
      if (nextState === "active" && appWasBackground) {
        appWasBackground = false;
        const enabled = await AsyncStorage.getItem("myexpensio-biometric-enabled");
        if (enabled !== "true") return;
        const { available } = await nativeBiometricAuthAdapter.getAvailability();
        if (!available) return;
        setIsLocked(true);
        setLockError(null);
      }
    });

    return () => sub.remove();
  }, []);

  async function handleBiometricUnlock() {
    setLockError(null);
    const success = await nativeBiometricAuthAdapter.authenticate();
    if (success) {
      setIsLocked(false);
    } else {
      setLockError("Authentication failed. Try again.");
    }
  }

  const claims = useClaimDrafts();
  const trips = useTrips();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await Promise.all([claims.refetch(), trips.refetch()]);
    } finally {
      setIsRefreshing(false);
    }
  }
  const selectedClaim = useClaimDraft(selectedClaimId);
  const selectedClaimItems = useClaimItems(selectedClaimId);
  const createBlankClaim = useCreateBlankClaimDraft();
  const createClaimItem = useCreateClaimItemDraft();
  const createTrip = useCreateTrip();
  const tngTransactions = useTngTransactions({ claimed: "all", sector: "ALL" });
  const deleteTrip = useSoftDeleteTrip();
  const linkTngTransaction = useLinkTngTransactionToClaimItem();
  const unlinkTngTransaction = useUnlinkTngTransactionFromClaimItem();
  const updateTrip = useUpdateTrip();
  const deleteClaim = useSoftDeleteClaimDraft();
  const deleteClaimItem = useSoftDeleteClaimItem();
  const updateClaim = useUpdateClaimDraft();
  const updateClaimItem = useUpdateClaimItemDraft();
  const submitClaim = useSubmitClaimDraft();
  const stopGpsTrip = useStopGpsTrip();
  const attachReceiptMetadata = useAttachReceiptMetadataToClaimItem();
  const receiptUploadSummary = useReceiptUploadSummary();
  const pendingSyncItems = usePendingSyncItems();
  const syncQueueSummary = useSyncQueueSummary();
  const syncEngine = useSyncEngine();
  const localActionError =
    createBlankClaim.error ??
    createClaimItem.error ??
    createTrip.error ??
    linkTngTransaction.error ??
    unlinkTngTransaction.error ??
    deleteTrip.error ??
    updateTrip.error ??
    deleteClaim.error ??
    deleteClaimItem.error ??
    updateClaim.error ??
    updateClaimItem.error ??
    submitClaim.error ??
    stopGpsTrip.error ??
    attachReceiptMetadata.error;

  return (
    <>
    <AppShell
      activeSpace={activeSpace}
      activeWorkTab={activeWorkTab}
      personalView={personalView}
      businessView={businessView}
      displayName={profile.displayName || session?.email?.split("@")[0] || ""}
      email={profile.email || session?.email || ""}
      isSigningOut={signOut.isPending}
      onSpaceChange={onSpaceChange}
      onOpenSettings={onOpenSettings}
      onSignOut={() => signOut.mutate()}
      onWorkTabChange={onWorkTabChange}
      onPersonalViewChange={onPersonalViewChange}
      onBusinessViewChange={onBusinessViewChange}
      pendingSyncCount={pendingSyncItems.data?.length ?? 0}
      subscriptionLabel={subscriptionTier}
      syncStatus={syncEngine.status}
    >
      {!settingsOpen && activeSpace === "personal" ? (
        <PersonalSpace
          view={personalView}
          addOpen={personalAddOpen}
          onViewChange={onPersonalViewChange}
          onAddClose={onPersonalAddClose}
        />
      ) : !settingsOpen && activeSpace === "business" ? (
        <FeatureGate feature="business_space" tier={subscriptionTier}>
          <BusinessSpace
            view={businessView}
            addOpen={businessAddOpen}
            onViewChange={onBusinessViewChange}
            onAddClose={onBusinessAddClose}
          />
        </FeatureGate>
      ) : (
      <View style={styles.contentFill}>
        {settingsOpen ? (
          <SettingsPanel
            email={session?.email ?? null}
            isSigningOut={signOut.isPending}
            onSignOut={() => signOut.mutate()}
            subscriptionTier={subscriptionTier}
          />
        ) : activeSpace === "work" && activeWorkTab === "claims" ? (
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
            isError={claims.isError}
            isLoadingClaimDetail={
              selectedClaim.isLoading || selectedClaimItems.isLoading
            }
            isLoadingClaims={claims.isLoading}
            isRefreshing={isRefreshing}
            onRefresh={handleRefresh}
            onAttachReceiptToItem={(item, receipt) =>
              attachReceiptMetadata.mutate({
                fileSize: receipt.fileSize,
                itemId: item.id,
                localUri: receipt.localUri,
                mimeType: receipt.mimeType
              })
            }
            onBackToClaims={() => setSelectedClaimId(null)}
            onCloseNewClaim={() => setNewClaimOpen(false)}
            onCreateBlankClaim={async (input) => {
              const result = await createBlankClaim.mutateAsync(input);
              setNewClaimOpen(false);
              setSelectedClaimId(result.claim.id);
            }}
            onCreateClaimItem={async (claim, input) => {
              const item = await createClaimItem.mutateAsync({
                claimId: claim.id,
                currency: claim.currency,
                ...input
              });
              if (input.receipt) {
                await attachReceiptMetadata.mutateAsync({
                  fileSize: input.receipt.fileSize,
                  itemId: item.id,
                  localUri: input.receipt.localUri,
                  mimeType: input.receipt.mimeType
                });
              }
              setSelectedClaimId(claim.id);
            }}
            onDeleteClaimItem={(item) => deleteClaimItem.mutate(item.id)}
            onLinkTngTransaction={async (item, transaction) => {
              // Link first — await so SQLite transactions don't overlap
              await linkTngTransaction.mutateAsync({
                claimId: item.claimId,
                itemId: item.id,
                transactionId: transaction.id
              });
              // Then stamp transNo into notes (sequential, not concurrent)
              if (transaction.transNo) {
                const existingNotes = item.notes ?? "";
                const tngTag = `TNG #${transaction.transNo}`;
                if (!existingNotes.includes(tngTag)) {
                  await updateClaimItem.mutateAsync({
                    itemId: item.id,
                    notes: existingNotes ? `${existingNotes}\n${tngTag}` : tngTag
                  });
                }
              }
            }}
            onRemoveReceiptFromItem={async (item) => {
              await updateClaimItem.mutateAsync({
                itemId: item.id,
                receiptId: null
              });
            }}
            onUnlinkTngTransaction={async (item) => {
              await unlinkTngTransaction.mutateAsync({
                claimId: item.claimId,
                itemId: item.id
              });
              // Strip TNG tag from notes
              if (item.notes?.includes("TNG #")) {
                const cleaned = item.notes
                  .split("\n")
                  .filter((line) => !line.startsWith("TNG #"))
                  .join("\n")
                  .trim();
                await updateClaimItem.mutateAsync({
                  itemId: item.id,
                  notes: cleaned || null
                });
              }
              Alert.alert(
                "TNG Unlinked",
                "The TNG transaction has been unlinked. It is now open and available to link again."
              );
            }}
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
            onUpdateClaimItem={async (item, input) => {
              await updateClaimItem.mutateAsync({
                itemId: item.id,
                ...input
              });
              if (input.receipt) {
                await attachReceiptMetadata.mutateAsync({
                  fileSize: input.receipt.fileSize,
                  itemId: item.id,
                  localUri: input.receipt.localUri,
                  mimeType: input.receipt.mimeType
                });
              }
            }}
            pendingSyncCount={pendingSyncItems.data?.length ?? 0}
            rates={settingsRates}
            showNewClaimModal={newClaimOpen}
            selectedClaimItems={selectedClaimItems.data ?? []}
            tngTransactions={tngTransactions.data ?? []}
            trips={trips.data ?? []}
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
        ) : activeSpace === "work" && activeWorkTab === "trips" ? (
          <TripsScreen
            claims={claims.data ?? []}
            isCreatingTrip={createTrip.isPending}
            isDeletingTrip={deleteTrip.isPending}
            isUpdatingTrip={updateTrip.isPending}
            isError={trips.isError}
            isLoading={trips.isLoading}
            isRefreshing={isRefreshing}
            isStoppingTrip={stopGpsTrip.isPending}
            onRefresh={handleRefresh}
            onAddMileageToClaim={({ amountCents, claim, itemDate, title, trip }) =>
              createClaimItem.mutate({
                amountCents,
                claimId: claim.id,
                currency: claim.currency,
                itemDate,
                notes: `Trip ${trip.id} - ${trip.vehicleType}`,
                title,
                tripId: trip.id,
                type: "mileage"
              })
            }
            onCreateTrip={(input) => createTrip.mutateAsync(input)}
            onDeleteTrip={async (trip) => {
              await deleteTrip.mutateAsync(trip.id);
            }}
            onStopGpsTrip={async (input) => {
              await stopGpsTrip.mutateAsync(input);
            }}
            onUpdateTrip={(input) => updateTrip.mutateAsync(input)}
            rates={settingsRates}
            trips={trips.data ?? []}
          />
        ) : activeSpace === "work" && activeWorkTab === "tng" ? (
          <TngScreen
            claims={claims.data ?? []}
            onAddToClaim={async ({ claim, transaction }) => {
              const type =
                transaction.sector === "TOLL" ? "toll" as const
                : transaction.sector === "PARKING" ? "parking" as const
                : "transport" as const;
              const title =
                transaction.sector === "TOLL"
                  ? [transaction.entryLocation, transaction.exitLocation]
                      .filter(Boolean).join(" → ") || "Toll"
                  : transaction.location ?? transaction.entryLocation ?? transaction.sector;
              const item = await createClaimItem.mutateAsync({
                claimId: claim.id,
                currency: claim.currency,
                type,
                title,
                amountCents: transaction.amountCents,
                itemDate: transaction.transactionDate,
                tngTransactionId: transaction.id,
                notes: transaction.transNo ? `TNG #${transaction.transNo}` : null
              });
              linkTngTransaction.mutate({
                claimId: claim.id,
                itemId: item.id,
                transactionId: transaction.id
              });
            }}
          />
        ) : activeSpace === "work" && activeWorkTab === "export" ? (
          <ExportScreen
            claims={claims.data ?? []}
            isLoadingClaims={claims.isLoading}
          />
        ) : activeSpace === "work" && activeWorkTab === "home" ? (
          <WorkHomeScreen
            claims={claims.data ?? []}
            displayName={profile.displayName || session?.email?.split("@")[0] || ""}
            onWorkTabChange={onWorkTabChange}
            trips={trips.data ?? []}
          />
        ) : activeSpace === "work" ? (
          <DeferredSpace spaceName={workTabLabel(activeWorkTab)} />
        ) : null}
      </View>
      )}
    </AppShell>

    {/* Biometric lock overlay — rendered as Modal so hooks are never skipped */}
    <Modal visible={isLocked} animationType="fade" transparent={false}>
      <SafeAreaView style={styles.centered}>
        <Text style={[styles.title, { marginBottom: 8 }]}>myexpensio</Text>
        <Text style={{ color: "#64748b", fontSize: 14, marginBottom: spacing.xl, textAlign: "center", lineHeight: 22 }}>
          Your session is locked.{"\n"}Authenticate to continue.
        </Text>
        <Pressable
          onPress={handleBiometricUnlock}
          style={{
            backgroundColor: "#0f766e",
            borderRadius: 14,
            paddingHorizontal: 32,
            paddingVertical: 16,
            alignItems: "center",
            minWidth: 200
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>🔐 Unlock</Text>
        </Pressable>
        {lockError ? (
          <Text style={{ color: "#dc2626", fontSize: 13, marginTop: 16 }}>{lockError}</Text>
        ) : null}
        <Pressable onPress={() => signOut.mutate()} style={{ marginTop: 32 }}>
          <Text style={{ color: "#94a3b8", fontSize: 13 }}>Sign out instead</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
    </>
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
  const profile = useUserSettingsStore((state) => state.profile);
  const rates = useUserSettingsStore((state) => state.rates);
  const updateProfile = useUserSettingsStore((state) => state.updateProfile);
  const updateRates = useUserSettingsStore((state) => state.updateRates);
  const profileSave = useProfileSave();
  const { canManageRates, orgRole, workspaceType } = useOrgContext();
  const [openSections, setOpenSections] = useState({
    billing: false,
    profile: false,
    rates: false,
    system: false
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Check biometric hardware availability on mount
  useEffect(() => {
    nativeBiometricAuthAdapter.getAvailability().then(({ available }) => {
      setBiometricAvailable(available);
    });
    // Load persisted preference
    AsyncStorage.getItem("myexpensio-biometric-enabled").then((val) => {
      if (val === "true") setBiometricEnabled(true);
    });
  }, []);

  const mealAverage = averageRate([
    rates.mealMorningRate,
    rates.mealNoonRate,
    rates.mealEveningRate
  ]);
  const isFree = subscriptionTier === "FREE";

  async function handleBillingPress() {
    const session = useAuthStore.getState().session;
    if (!session?.accessToken) {
      showSaved("Sign in required.");
      return;
    }
    const baseUrl = getSyncBaseUrl();
    try {
      if (isFree) {
        // Upgrade — open Stripe checkout for PRO
        const res = await fetch(`${baseUrl}/api/billing/checkout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tier: "PRO", entity_type: "USER" }),
        });
        const data = await res.json() as { checkout_url?: string; error?: { message?: string } };
        if (data.checkout_url) {
          Linking.openURL(data.checkout_url);
        } else {
          showSaved(data.error?.message ?? "Could not open billing.");
        }
      } else {
        // Manage — open Stripe customer portal
        const res = await fetch(`${baseUrl}/api/billing/portal`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ return_url: "https://myexpensio.com/settings" }),
        });
        const data = await res.json() as { url?: string; error?: { message?: string } };
        if (data.url) {
          Linking.openURL(data.url);
        } else {
          showSaved(data.error?.message ?? "Could not open billing portal.");
        }
      }
    } catch {
      showSaved("Billing unavailable — check connection.");
    }
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((current) => ({
      ...current,
      [key]: !current[key]
    }));
  }

  function showSaved(message: string) {
    setSavedNotice(message);
    setTimeout(() => setSavedNotice(null), 2600);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.settingsPage}
    >
      <ScrollView
        contentContainerStyle={styles.settingsPageContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsPageTitle}>Settings</Text>
        <Text style={styles.settingsPageSub}>
          Profile, rates, billing, and system settings used by claims and trips.
        </Text>
      </View>

      {savedNotice ? (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>{savedNotice}</Text>
        </View>
      ) : null}

      <SettingsAccordion
        description="Your claimant identity and employer details used in claim headers and declarations."
        icon="👤"
        isOpen={openSections.profile}
        onToggle={() => toggleSection("profile")}
        previews={[
          profile.displayName || "Full name",
          profile.email || email || "Email",
          profile.companyName || "Company name"
        ]}
        title="Profile"
      >
        <SettingsCard
          icon="🪪"
          sub="Company here means your employer company, not the organization or agent managing your enrolment."
          title="Claimant Profile"
        >
          <SettingsTextField
            label="Full Name"
            onChangeText={(value) => updateProfile({ displayName: value })}
            value={profile.displayName}
          />
          <SettingsTextField
            label="Email"
            onChangeText={(value) => updateProfile({ email: value })}
            value={profile.email || email || ""}
          />
          <View style={styles.settingsTwoCol}>
            <SettingsTextField
              label="Department"
              onChangeText={(value) => updateProfile({ department: value })}
              value={profile.department}
            />
            <SettingsTextField
              label="Location"
              onChangeText={(value) => updateProfile({ location: value })}
              value={profile.location}
            />
          </View>
          <SettingsTextField
            label="Company Name"
            onChangeText={(value) => updateProfile({ companyName: value })}
            value={profile.companyName}
          />
          <PrimarySettingsButton
            label={profileSave.isPending ? "Saving..." : "Save Profile"}
            onPress={async () => {
              try {
                await profileSave.mutateAsync({
                  displayName: profile.displayName,
                  department: profile.department,
                  location: profile.location,
                  companyName: profile.companyName,
                });
                showSaved("Profile saved.");
              } catch {
                showSaved("Save failed — check connection.");
              }
            }}
          />
        </SettingsCard>
      </SettingsAccordion>

      <SettingsAccordion
        description="Your personal claim calculation settings, with template reference and fixed defaults."
        icon="💸"
        isOpen={openSections.rates}
        onToggle={() => toggleSection("rates")}
        previews={[
          `Car MYR ${rates.mileageCarRate}/km · Moto MYR ${rates.mileageMotorcycleRate}/km`,
          `Meal avg MYR ${mealAverage}`,
          `Lodging MYR ${rates.lodgingRate}/night`,
          `Per diem MYR ${rates.perDiemRate}/day`
        ]}
        title="Rates"
      >
        {/* Read-only notice for non-admin org members */}
        {!canManageRates && (
          <View style={styles.ratesLockedBanner}>
            <Text style={styles.ratesLockedBannerText}>
              🔒 Rates are managed by your {workspaceType === "TEAM" ? "team" : "organisation"} admin
              {orgRole ? ` (your role: ${orgRole})` : ""}.
            </Text>
          </View>
        )}

        <SettingsCard
          icon="📚"
          sub="Company standard templates will sync from admin later. The saved personal rate is what new claims and trips refer to locally."
          title="Rate Template Reference"
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{rates.templateName}</Text>
          </View>
        </SettingsCard>

        <SettingsCard
          icon="🧾"
          sub="This is your own rate record for claim calculations."
          title="Personal Rate Profile"
        >
          <SettingsTextField
            editable={canManageRates}
            label="Rate Label"
            onChangeText={(value) => canManageRates && updateRates({ rateLabel: value })}
            value={rates.rateLabel}
          />
          <SettingsTextField
            editable={canManageRates}
            label="Notes"
            multiline
            onChangeText={(value) => canManageRates && updateRates({ notes: value })}
            value={rates.notes}
          />
        </SettingsCard>

        <SettingsCard
          icon="🚗"
          sub="Users choose Car or Motorcycle when creating each trip. These rates calculate mileage claim amounts."
          title="Mileage Rates"
        >
          <RateInputRow
            editable={canManageRates}
            label="🚗 Car rate per km"
            onChangeText={(value) => canManageRates && updateRates({ mileageCarRate: numericRate(value) })}
            suffix="/km"
            value={rates.mileageCarRate}
          />
          <RateInputRow
            editable={canManageRates}
            label="🏍 Motorcycle rate per km"
            onChangeText={(value) =>
              canManageRates && updateRates({ mileageMotorcycleRate: numericRate(value) })
            }
            suffix="/km"
            value={rates.mileageMotorcycleRate}
          />
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Trips refer to these rates based on vehicle type.
            </Text>
          </View>
        </SettingsCard>

        <SettingsCard
          icon="🍽"
          sub="Personal fixed-rate values when no receipt is used."
          title="Meal Rates"
        >
          <RateInputRow
            editable={canManageRates}
            label="Morning"
            onChangeText={(value) => canManageRates && updateRates({ mealMorningRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealMorningRate}
          />
          <RateInputRow
            editable={canManageRates}
            label="Noon"
            onChangeText={(value) => canManageRates && updateRates({ mealNoonRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealNoonRate}
          />
          <RateInputRow
            editable={canManageRates}
            label="Evening"
            onChangeText={(value) => canManageRates && updateRates({ mealEveningRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealEveningRate}
          />
          <RateInputRow
            editable={canManageRates}
            label="Full Day"
            onChangeText={(value) => canManageRates && updateRates({ fullDayMealRate: numericRate(value) })}
            suffix="/day"
            value={rates.fullDayMealRate}
          />
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Calculated meal average per session: MYR {mealAverage}
            </Text>
          </View>
        </SettingsCard>

        <View style={styles.settingsTwoCol}>
          <SettingsCard
            icon="🏨"
            sub="Personal default for lodging without receipt override."
            title="Lodging Rate"
          >
            <RateInputRow
              editable={canManageRates}
              label="Rate per night"
              onChangeText={(value) => canManageRates && updateRates({ lodgingRate: numericRate(value) })}
              suffix="/night"
              value={rates.lodgingRate}
            />
          </SettingsCard>
          <SettingsCard
            icon="📅"
            sub="Personal default daily travel allowance."
            title="Per Diem Allowance"
          >
            <RateInputRow
              editable={canManageRates}
              label="Daily allowance rate"
              onChangeText={(value) => canManageRates && updateRates({ perDiemRate: numericRate(value) })}
              suffix="/day"
              value={rates.perDiemRate}
            />
          </SettingsCard>
        </View>

        {canManageRates && (
          <View style={styles.settingsActions}>
            <PrimarySettingsButton
              label="Save Personal Rates"
              onPress={() => showSaved("Personal rates saved locally.")}
            />
            <SecondarySettingsButton
              label="Reset Defaults"
              onPress={() => {
                updateRates(defaultRates);
                showSaved("Default rates restored.");
              }}
            />
          </View>
        )}
      </SettingsAccordion>

      <SettingsAccordion
        description="Your current plan and export access."
        icon="💳"
        isOpen={openSections.billing}
        onToggle={() => toggleSection("billing")}
        previews={[
          isFree ? "Free plan" : `${subscriptionTier} plan`,
          isFree ? "Exports locked on trial" : "Exports enabled"
        ]}
        title="Plan & Billing"
      >
        <SettingsCard
          icon={isFree ? "🆓" : subscriptionTier === "PREMIUM" ? "💎" : "🚀"}
          sub={
            isFree
              ? "Explore myexpensio before upgrading. Claim exports are available on Pro and Premium."
              : "Your paid plan includes claim exports and paid-plan features."
          }
          title={isFree ? "Free trial" : `${subscriptionTier} plan`}
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              {isFree
                ? "Free trial includes core tracking. Upgrade when ready for exports and paid-plan workflows."
                : "Manage invoices, plan changes, and cancellation from billing when backend billing is connected."}
            </Text>
          </View>
          <PrimarySettingsButton
            label={isFree ? "See pricing" : "Manage billing"}
            onPress={handleBillingPress}
          />
        </SettingsCard>
      </SettingsAccordion>

      <SettingsAccordion
        description="Device setup and account access controls for install, biometrics, password, and app details."
        icon="⚙️"
        isOpen={openSections.system}
        onToggle={() => toggleSection("system")}
        previews={["App Install", "Biometric Login", "Password", "About"]}
        title="System Settings"
      >
        <SettingsCard
          icon="📲"
          sub="Install behavior will use the platform app install prompt when available."
          title="App Install"
        >
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Mobile v2 is built as a native-friendly Expo app. PWA install can
              remain a web fallback, but the mobile app should prioritize native
              store builds.
            </Text>
          </View>
        </SettingsCard>

        <SettingsCard
          icon="🔐"
          sub={
            biometricAvailable === false
              ? "Biometrics not available on this device. Set up Face ID or fingerprint in device settings first."
              : "Fast local unlock after a secure session is restored."
          }
          title="Biometric Login"
        >
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Enable biometric login</Text>
              <Text style={styles.switchSub}>
                {biometricAvailable
                  ? "Use Face ID, Touch ID, or device biometrics."
                  : "Not available on this device."}
              </Text>
            </View>
            <Switch
              disabled={biometricAvailable === false}
              onValueChange={(val) => {
                setBiometricEnabled(val);
                AsyncStorage.setItem("myexpensio-biometric-enabled", val ? "true" : "false");
              }}
              value={biometricEnabled && biometricAvailable === true}
            />
          </View>
        </SettingsCard>

        <SettingsCard
          icon="🔑"
          sub="Update the password for your myexpensio account."
          title="Password"
        >
          <ChangePasswordForm />
        </SettingsCard>

        <SettingsCard
          icon="ℹ️"
          sub="Application information and legal links."
          title="About myexpensio"
        >
          <Text style={styles.aboutName}>myexpensio</Text>
          <Text style={styles.aboutText}>Version 1.0.0</Text>
          <View style={styles.legalLinks}>
            <Pressable onPress={() => Linking.openURL("https://myexpensio.com/terms")}>
              <Text style={styles.legalLinkText}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.aboutMuted}> · </Text>
            <Pressable onPress={() => Linking.openURL("https://myexpensio.com/privacy")}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
            </Pressable>
          </View>
          <Text style={styles.aboutMuted}>
            Copyright © EffortEdutech 2026. All rights reserved.
          </Text>
        </SettingsCard>
      </SettingsAccordion>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SettingsAccordion({
  children,
  description,
  icon,
  isOpen,
  onToggle,
  previews,
  title
}: {
  children: ReactNode;
  description: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  previews: string[];
  title: string;
}) {
  return (
    <View style={styles.settingsAccordion}>
      <Pressable
        accessibilityRole="button"
        onPress={onToggle}
        style={styles.accordionButton}
      >
        <View style={styles.accordionLeft}>
          <View style={styles.accordionTitleRow}>
            <Text style={styles.accordionIcon}>{icon}</Text>
            <Text style={styles.accordionTitle}>{title}</Text>
          </View>
          <Text style={styles.accordionDesc}>{description}</Text>
          {!isOpen ? (
            <View style={styles.previewWrap}>
              {previews.map((item) => (
                <Text key={item} numberOfLines={1} style={styles.previewPill}>
                  {item}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
        <Text style={styles.accordionChevron}>{isOpen ? "-" : "+"}</Text>
      </Pressable>
      {isOpen ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function SettingsCard({
  children,
  icon,
  sub,
  title
}: {
  children: ReactNode;
  icon: string;
  sub: string;
  title: string;
}) {
  return (
    <View style={styles.settingsCard}>
      <View style={styles.cardHead}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSub}>{sub}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function SettingsTextField({
  editable = true,
  label,
  multiline,
  onChangeText,
  value
}: {
  editable?: boolean;
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.settingsField}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor="#94a3b8"
        style={[
          styles.settingsInput,
          multiline ? styles.settingsTextarea : null,
          !editable ? styles.inputReadOnly : null
        ]}
        value={value}
      />
    </View>
  );
}

function RateInputRow({
  editable = true,
  label,
  onChangeText,
  suffix,
  value
}: {
  editable?: boolean;
  label: string;
  onChangeText: (value: string) => void;
  suffix: string;
  value: string;
}) {
  return (
    <View style={styles.rateRow}>
      <Text style={styles.rateLabel}>{label}</Text>
      <View style={styles.rateRight}>
        <Text style={styles.ratePrefix}>MYR</Text>
        <TextInput
          editable={editable}
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          style={[styles.rateInput, !editable ? styles.inputReadOnly : null]}
          value={value}
        />
        <Text style={styles.rateSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

function PrimarySettingsButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsPrimaryButton,
        pressed ? styles.primaryButtonPressed : null
      ]}
    >
      <Text style={styles.settingsPrimaryText}>{label}</Text>
    </Pressable>
  );
}

function ChangePasswordForm() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleChangePassword() {
    setError(null);
    setSuccess(false);
    if (!newPassword.trim()) { setError("Please enter a new password."); return; }
    if (newPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsPending(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setNewPassword}
        placeholder="New password"
        secureTextEntry
        style={styles.input}
        value={newPassword}
      />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setConfirmPassword}
        placeholder="Confirm new password"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
      />
      {error ? (
        <Text style={{ color: colors.danger, fontSize: typography.caption, fontWeight: "700" }}>
          {error}
        </Text>
      ) : null}
      {success ? (
        <Text style={{ color: "#16a34a", fontSize: typography.caption, fontWeight: "700" }}>
          ✅ Password updated successfully.
        </Text>
      ) : null}
      <Pressable
        disabled={isPending}
        onPress={handleChangePassword}
        style={({ pressed }) => [
          styles.settingsSecondaryButton,
          pressed || isPending ? styles.primaryButtonPressed : null,
        ]}
      >
        <Text style={styles.settingsSecondaryText}>
          {isPending ? "Updating…" : "Update Password"}
        </Text>
      </Pressable>
    </View>
  );
}

function SecondarySettingsButton({
  label,
  onPress
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsSecondaryButton,
        pressed ? styles.primaryButtonPressed : null
      ]}
    >
      <Text style={styles.settingsSecondaryText}>{label}</Text>
    </Pressable>
  );
}

function numericRate(value: string) {
  if (value === "" || /^\d*\.?\d*$/.test(value)) {
    return value;
  }

  return value.replace(/[^\d.]/g, "");
}

function averageRate(values: string[]) {
  const total = values.reduce((sum, value) => sum + (Number(value) || 0), 0);

  return (total / values.length).toFixed(2);
}

type WorkClaimsSliceProps = {
  activeClaim: ClaimDraft | null;
  claims: ClaimDraft[];
  createBlankClaimLabel: string;
  errorMessage: string | null;
  isCreatingBlankClaim: boolean;
  isError?: boolean;
  isLoadingClaimDetail: boolean;
  isLoadingClaims: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onAttachReceiptToItem: (item: ClaimItemDraft, receipt: LocalReceiptFile) => void;
  onBackToClaims: () => void;
  onCloseNewClaim: () => void;
  onCreateBlankClaim: (input: CreateClaimDraftInput) => Promise<void>;
  onCreateClaimItem: (
    claim: ClaimDraft,
    input: {
      amountCents: number;
      itemDate: string;
      notes: string | null;
      receipt?: LocalReceiptFile | null;
      mode?: string | null;
      tngTransactionId?: string | null;
      tripId?: string | null;
      title: string;
      type: ClaimItemType;
      mealSession?: string | null;
      lodgingCheckIn?: string | null;
      lodgingCheckOut?: string | null;
      perdiemDays?: number | null;
      perdiemRateMyr?: number | null;
      perdiemDestination?: string | null;
      merchant?: string | null;
    }
  ) => Promise<void>;
  onDeleteClaimItem: (item: ClaimItemDraft) => void;
  onLinkTngTransaction: (
    item: ClaimItemDraft,
    transaction: TngTransaction
  ) => void;
  onRemoveReceiptFromItem: (item: ClaimItemDraft) => Promise<void>;
  onUnlinkTngTransaction: (item: ClaimItemDraft) => void;
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
      receipt?: LocalReceiptFile | null;
      receiptId?: string | null;
      mode?: string | null;
      tngTransactionId?: string | null;
      title: string;
      type: ClaimItemType;
    }
  ) => Promise<void>;
  pendingSyncCount: number;
  rates: ClaimRates;
  showNewClaimModal: boolean;
  selectedClaimItems: ClaimItemDraft[];
  tngTransactions: TngTransaction[];
  trips: TripDraft[];
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

type ClaimSortKey = "updated_desc" | "period_desc" | "amount_desc" | "title_asc";

function WorkClaimsSlice({
  activeClaim,
  claims,
  createBlankClaimLabel,
  errorMessage,
  isCreatingBlankClaim,
  isError = false,
  isLoadingClaimDetail,
  isLoadingClaims,
  isRefreshing = false,
  onRefresh,
  onAttachReceiptToItem,
  onBackToClaims,
  onCloseNewClaim,
  onCreateBlankClaim,
  onCreateClaimItem,
  onDeleteClaimItem,
  onLinkTngTransaction,
  onRemoveReceiptFromItem,
  onUnlinkTngTransaction,
  onDeleteClaim,
  onOpenClaim,
  onOpenNewClaim,
  onSubmitClaim,
  onUpdateClaim,
  onUpdateClaimItem,
  pendingSyncCount,
  rates,
  showNewClaimModal,
  selectedClaimItems,
  tngTransactions,
  trips,
  syncQueueSummary,
  receiptUploadSummary
}: WorkClaimsSliceProps) {
  const [claimFilter, setClaimFilter] = useState<"all" | "draft" | "submitted">(
    "all"
  );
  const [claimSort, setClaimSort] = useState<ClaimSortKey>("updated_desc");
  const [claimSortOpen, setClaimSortOpen] = useState(false);
  const [claimFilterOpen, setClaimFilterOpen] = useState(false);
  const draftClaimCount = claims.filter((claim) => claim.status === "draft").length;
  const submittedClaimCount = claims.filter(
    (claim) => claim.status === "submitted"
  ).length;
  const filteredClaims =
    claimFilter === "all"
      ? claims
      : claims.filter((claim) => claim.status === claimFilter);
  const visibleClaims = sortClaims(filteredClaims, claimSort);

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
        onLinkTngTransaction={onLinkTngTransaction}
        onRemoveReceipt={onRemoveReceiptFromItem}
        onUnlinkTngTransaction={onUnlinkTngTransaction}
        onSubmitClaim={onSubmitClaim}
        onUpdateClaim={(input) => onUpdateClaim(activeClaim, input)}
        onUpdateItem={onUpdateClaimItem}
        rates={rates}
        tngTransactions={tngTransactions}
        trips={trips}
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
        <Text style={styles.claimsTitle}>Claims</Text>
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

      <View style={styles.listToolbar}>
        <Text style={styles.listToolbarText}>
          {visibleClaims.length} shown · {pendingSyncCount} pending sync
        </Text>
        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setClaimFilterOpen(true)}
            style={styles.toolbarMenuButton}
          >
            <Text style={styles.toolbarMenuText}>
              {claimFilter === "all" ? "All" : claimFilter === "draft" ? "Draft" : "Submitted"} ▾
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setClaimSortOpen(true)}
            style={styles.toolbarMenuButton}
          >
            <Text style={styles.toolbarMenuText}>
              Sort: {claimSortLabel(claimSort)} ▾
            </Text>
          </Pressable>
        </View>
      </View>

      <ClaimDraftList
        claims={visibleClaims}
        isError={isError}
        isLoading={isLoadingClaims}
        isRefreshing={isRefreshing}
        onOpen={onOpenClaim}
        onRefresh={onRefresh}
      />

      <NewClaimModal
        isCreating={isCreatingBlankClaim}
        isVisible={showNewClaimModal}
        onClose={onCloseNewClaim}
        onCreate={onCreateBlankClaim}
      />
      <OptionSheet
        isVisible={claimFilterOpen}
        onClose={() => setClaimFilterOpen(false)}
        title="Filter claims"
        options={[
          { label: `All (${claims.length})`, value: "all" },
          { label: `Draft (${draftClaimCount})`, value: "draft" },
          { label: `Submitted (${submittedClaimCount})`, value: "submitted" },
        ]}
        selectedValue={claimFilter}
        onSelect={(value) => {
          setClaimFilter(value as "all" | "draft" | "submitted");
          setClaimFilterOpen(false);
        }}
      />
      <OptionSheet
        isVisible={claimSortOpen}
        onClose={() => setClaimSortOpen(false)}
        options={claimSortOptions}
        selectedValue={claimSort}
        title="Sort claims"
        onSelect={(value) => {
          setClaimSort(value);
          setClaimSortOpen(false);
        }}
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

const claimSortOptions: Array<{ label: string; value: ClaimSortKey }> = [
  { label: "Updated", value: "updated_desc" },
  { label: "Date", value: "period_desc" },
  { label: "Amount", value: "amount_desc" },
  { label: "Name", value: "title_asc" }
];

function sortClaims(claims: ClaimDraft[], sort: ClaimSortKey) {
  return [...claims].sort((left, right) => {
    if (sort === "period_desc") {
      return claimDateValue(right).localeCompare(claimDateValue(left));
    }

    if (sort === "amount_desc") {
      return right.totalAmountCents - left.totalAmountCents;
    }

    if (sort === "title_asc") {
      return (left.title ?? "").localeCompare(right.title ?? "");
    }

    return right.updatedAt.localeCompare(left.updatedAt);
  });
}

function claimSortLabel(value: ClaimSortKey) {
  return claimSortOptions.find((option) => option.value === value)?.label ?? "Updated";
}

function claimDateValue(claim: ClaimDraft) {
  return claim.periodStart ?? claim.periodEnd ?? claim.createdAt;
}

function OptionSheet<T extends string>({
  isVisible,
  onClose,
  onSelect,
  options,
  selectedValue,
  title
}: {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
  title: string;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.optionSheet}>
          <View style={styles.optionSheetHeader}>
            <Text style={styles.optionSheetTitle}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>X</Text>
            </Pressable>
          </View>
          <View style={styles.optionList}>
            {options.map((option) => {
              const isActive = option.value === selectedValue;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={[
                    styles.optionRow,
                    isActive ? styles.optionRowActive : null
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      isActive ? styles.optionTextActive : null
                    ]}
                  >
                    {option.label}
                  </Text>
                  {isActive ? <Text style={styles.optionCheck}>OK</Text> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
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

function workTabLabel(tab: WorkTab) {
  if (tab === "home") {
    return "Work Home";
  }

  if (tab === "tng") {
    return "TNG Transactions";
  }

  if (tab === "export") {
    return "Exports";
  }

  return "Work Claims";
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
  contentFill: {
    flex: 1
  },
  claimsPage: {
    flex: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  claimsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  claimsTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
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
    backgroundColor: "#eef2f7",
    borderRadius: 14,
    flexDirection: "row",
    gap: 4,
    padding: 4
  },
  claimTab: {
    alignItems: "center",
    borderRadius: 11,
    flex: 1,
    gap: 2,
    minHeight: 42,
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
    backgroundColor: "rgba(148, 163, 184, 0.14)",
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
  listToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 6
  },
  listToolbarText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  toolbarMenuButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 34,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  toolbarMenuText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  claimSortPanel: {
    backgroundColor: "rgba(248, 250, 252, 0.86)",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  claimSortLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
    paddingHorizontal: 4,
    textTransform: "uppercase"
  },
  claimSortRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  claimSortChip: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  claimSortChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  claimSortChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800"
  },
  claimSortChipTextActive: {
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
  optionSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 420,
    padding: spacing.md,
    width: "100%"
  },
  optionSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.xs
  },
  optionSheetTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  optionList: {
    gap: 6
  },
  optionRow: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  optionRowActive: {
    backgroundColor: "#f1f5f9"
  },
  optionText: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  optionTextActive: {
    color: colors.primary
  },
  optionCheck: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: "900"
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
  settingsPage: {
    flex: 1,
  },
  settingsPageContent: {
    gap: spacing.md,
    paddingBottom: spacing.xl
  },
  settingsHeader: {
    gap: spacing.xs
  },
  settingsPageTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  settingsPageSub: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 20
  },
  successBanner: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  successBannerText: {
    color: "#15803d",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  settingsAccordion: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden"
  },
  accordionButton: {
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.md
  },
  accordionLeft: {
    flex: 1,
    gap: spacing.xs
  },
  accordionTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  accordionIcon: {
    fontSize: 20,
    lineHeight: 24
  },
  accordionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  accordionDesc: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18
  },
  accordionChevron: {
    color: colors.muted,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 24
  },
  accordionBody: {
    backgroundColor: "#f8fafc",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  previewWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  previewPill: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    color: "#475569",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5
  },
  settingsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  cardHead: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  cardIcon: {
    fontSize: 20,
    width: 28
  },
  cardText: {
    flex: 1,
    gap: 2
  },
  cardTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  cardSub: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16
  },
  settingsField: {
    flex: 1,
    gap: 6
  },
  settingsLabel: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  settingsInput: {
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  settingsTextarea: {
    minHeight: 86,
    paddingTop: spacing.sm,
    textAlignVertical: "top"
  },
  settingsTwoCol: {
    gap: spacing.md
  },
  infoBox: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  infoText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  rateRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  rateLabel: {
    color: "#374151",
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  rateRight: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  ratePrefix: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "800"
  },
  rateInput: {
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900",
    minHeight: 38,
    paddingHorizontal: spacing.sm,
    textAlign: "right",
    width: 88
  },
  rateSuffix: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
    width: 58
  },
  inputReadOnly: {
    backgroundColor: "#f1f5f9",
    color: "#94a3b8"
  },
  ratesLockedBanner: {
    backgroundColor: "#fef3c7",
    borderColor: "#fbbf24",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  ratesLockedBannerText: {
    color: "#92400e",
    fontSize: 13,
    lineHeight: 18
  },
  settingsActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  settingsPrimaryButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  settingsPrimaryText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  settingsSecondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.lg
  },
  settingsSecondaryText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  switchCopy: {
    flex: 1,
    gap: 3
  },
  switchTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  switchSub: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16
  },
  aboutName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  aboutText: {
    color: "#475569",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  aboutMuted: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 16
  },
  legalLinks: {
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    marginTop: 2
  },
  legalLinkText: {
    color: "#3b82f6",
    fontSize: 11,
    textDecorationLine: "underline"
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
