import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
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
import type { WorkTab } from "@/features/shell/components/AppShell";
import type { AppSpace } from "@/features/shell/types";
import { FeatureGate } from "@/features/subscription/components/FeatureGate";
import type { SubscriptionTier } from "@/features/subscription/types";
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
import { useTngTransactions } from "@/features/tng/hooks/useTngLibrary";
import type { TngTransaction } from "@/features/tng/types";
import { initializeLocalDatabase } from "@/local-db/database";
import { usePendingSyncItems } from "@/sync/hooks/usePendingSyncItems";
import { useSyncQueueSummary } from "@/sync/hooks/useSyncQueueSummary";
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
  const [activeWorkTab, setActiveWorkTab] = useState<WorkTab>("claims");
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
      activeWorkTab={activeWorkTab}
      onSpaceChange={(space) => {
        setActiveSpace(space);
        setSettingsOpen(false);
      }}
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
  onOpenSettings,
  onSpaceChange,
  onWorkTabChange,
  settingsOpen,
  subscriptionTier
}: {
  activeSpace: AppSpace;
  activeWorkTab: WorkTab;
  onOpenSettings: () => void;
  onSpaceChange: (space: AppSpace) => void;
  onWorkTabChange: (tab: WorkTab) => void;
  settingsOpen: boolean;
  subscriptionTier: SubscriptionTier;
}) {
  const session = useAuthStore((state) => state.session);
  const profile = useUserSettingsStore((state) => state.profile);
  const settingsRates = useUserSettingsStore((state) => state.rates);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [newClaimOpen, setNewClaimOpen] = useState(false);
  const signOut = useSignOut();
  const claims = useClaimDrafts();
  const trips = useTrips();
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
    <AppShell
      activeSpace={activeSpace}
      activeWorkTab={activeWorkTab}
      displayName={profile.displayName || session?.email?.split("@")[0] || ""}
      email={profile.email || session?.email || ""}
      isSigningOut={signOut.isPending}
      onSpaceChange={onSpaceChange}
      onOpenSettings={onOpenSettings}
      onSignOut={() => signOut.mutate()}
      onWorkTabChange={onWorkTabChange}
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
            isLoadingClaimDetail={
              selectedClaim.isLoading || selectedClaimItems.isLoading
            }
            isLoadingClaims={claims.isLoading}
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
            onLinkTngTransaction={(item, transaction) =>
              linkTngTransaction.mutate({
                claimId: item.claimId,
                itemId: item.id,
                transactionId: transaction.id
              })
            }
            onRemoveReceiptFromItem={async (item) => {
              await updateClaimItem.mutateAsync({
                itemId: item.id,
                receiptId: null
              });
            }}
            onUnlinkTngTransaction={(item) =>
              unlinkTngTransaction.mutate({
                claimId: item.claimId,
                itemId: item.id
              })
            }
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
            isLoading={trips.isLoading}
            isStoppingTrip={stopGpsTrip.isPending}
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
          <TngScreen />
        ) : activeSpace === "work" && activeWorkTab === "export" ? (
          <ExportScreen
            claims={claims.data ?? []}
            isLoadingClaims={claims.isLoading}
          />
        ) : activeSpace === "work" ? (
          <DeferredSpace spaceName={workTabLabel(activeWorkTab)} />
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
  const profile = useUserSettingsStore((state) => state.profile);
  const rates = useUserSettingsStore((state) => state.rates);
  const updateProfile = useUserSettingsStore((state) => state.updateProfile);
  const updateRates = useUserSettingsStore((state) => state.updateRates);
  const [openSections, setOpenSections] = useState({
    billing: false,
    profile: true,
    rates: true,
    system: false
  });
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const mealAverage = averageRate([
    rates.mealMorningRate,
    rates.mealNoonRate,
    rates.mealEveningRate
  ]);
  const isFree = subscriptionTier === "FREE";

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
    <View style={styles.settingsPage}>
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
            label="Save Profile"
            onPress={() => showSaved("Profile saved locally.")}
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
            label="Rate Label"
            onChangeText={(value) => updateRates({ rateLabel: value })}
            value={rates.rateLabel}
          />
          <SettingsTextField
            label="Notes"
            multiline
            onChangeText={(value) => updateRates({ notes: value })}
            value={rates.notes}
          />
        </SettingsCard>

        <SettingsCard
          icon="🚗"
          sub="Users choose Car or Motorcycle when creating each trip. These rates calculate mileage claim amounts."
          title="Mileage Rates"
        >
          <RateInputRow
            label="🚗 Car rate per km"
            onChangeText={(value) => updateRates({ mileageCarRate: numericRate(value) })}
            suffix="/km"
            value={rates.mileageCarRate}
          />
          <RateInputRow
            label="🏍 Motorcycle rate per km"
            onChangeText={(value) =>
              updateRates({ mileageMotorcycleRate: numericRate(value) })
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
            label="Morning"
            onChangeText={(value) => updateRates({ mealMorningRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealMorningRate}
          />
          <RateInputRow
            label="Noon"
            onChangeText={(value) => updateRates({ mealNoonRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealNoonRate}
          />
          <RateInputRow
            label="Evening"
            onChangeText={(value) => updateRates({ mealEveningRate: numericRate(value) })}
            suffix="/session"
            value={rates.mealEveningRate}
          />
          <RateInputRow
            label="Full Day"
            onChangeText={(value) => updateRates({ fullDayMealRate: numericRate(value) })}
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
              label="Rate per night"
              onChangeText={(value) => updateRates({ lodgingRate: numericRate(value) })}
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
              label="Daily allowance rate"
              onChangeText={(value) => updateRates({ perDiemRate: numericRate(value) })}
              suffix="/day"
              value={rates.perDiemRate}
            />
          </SettingsCard>
        </View>

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
            onPress={() => showSaved("Billing screen will connect to the sync API.")}
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
          sub="Fast local unlock after a secure session is restored."
          title="Biometric Login"
        >
          <View style={styles.switchRow}>
            <View style={styles.switchCopy}>
              <Text style={styles.switchTitle}>Enable biometric login</Text>
              <Text style={styles.switchSub}>
                Use Face ID, Touch ID, or device biometrics when supported.
              </Text>
            </View>
            <Switch
              onValueChange={setBiometricEnabled}
              value={biometricEnabled}
            />
          </View>
        </SettingsCard>

        <SettingsCard
          icon="🔑"
          sub="Password changes will be handled by auth backend once sync API is connected."
          title="Password"
        >
          <SecondarySettingsButton
            label="Change Password"
            onPress={() => showSaved("Password change modal is queued for auth parity.")}
          />
        </SettingsCard>

        <SettingsCard
          icon="ℹ️"
          sub="Application information and legal links."
          title="About myexpensio"
        >
          <Text style={styles.aboutName}>myexpensio</Text>
          <Text style={styles.aboutText}>Version 0.1.0 mobile v2</Text>
          <Text style={styles.aboutText}>Terms of Service · Privacy Policy</Text>
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
    </View>
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
        <Text style={styles.accordionChevron}>{isOpen ? "⌄" : "›"}</Text>
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
  label,
  multiline,
  onChangeText,
  value
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.settingsField}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor="#94a3b8"
        style={[styles.settingsInput, multiline ? styles.settingsTextarea : null]}
        value={value}
      />
    </View>
  );
}

function RateInputRow({
  label,
  onChangeText,
  suffix,
  value
}: {
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
          keyboardType="decimal-pad"
          onChangeText={onChangeText}
          style={styles.rateInput}
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
  isLoadingClaimDetail: boolean;
  isLoadingClaims: boolean;
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
      title: string;
      type: ClaimItemType;
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
  settingsPage: {
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

