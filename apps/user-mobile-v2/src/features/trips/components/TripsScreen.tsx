import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { DatePickerField } from "@/components/DatePickerField";
import type { ClaimDraft } from "@/features/claims/types";
import { ErrorState } from "@/components/ErrorState";
import { canUseFeature } from "@/features/subscription/featureGates";
import { useSubscription } from "@/features/subscription/hooks/useSubscription";
import { SkeletonList } from "@/components/SkeletonRow";
import {
  RouteMap,
  type LatLng,
  type RouteMapRoute
} from "@/features/trips/components/RouteMap";
import { SinglePinMap } from "@/features/trips/components/SinglePinMap";
import type {
  CreateTripInput,
  TripCalculationMode,
  TripDraft,
  UpdateTripInput,
  VehicleType
} from "@/features/trips/types";
import type { ClaimRates } from "@/state/settingsStore";
import { getSyncBaseUrl } from "@/sync/syncConfig";
import { colors, spacing, typography } from "@/theme/tokens";

type TripsScreenProps = {
  claims: ClaimDraft[];
  isCreatingTrip: boolean;
  isDeletingTrip: boolean;
  isError?: boolean;
  isLoading: boolean;
  isRefreshing?: boolean;
  isStoppingTrip: boolean;
  isUpdatingTrip: boolean;
  onAddMileageToClaim: (input: {
    amountCents: number;
    claim: ClaimDraft;
    itemDate: string;
    title: string;
    trip: TripDraft;
  }) => void;
  onCreateTrip: (input: CreateTripInput) => Promise<TripDraft>;
  onDeleteTrip: (trip: TripDraft) => Promise<void>;
  onRefresh?: () => void;
  onStopGpsTrip: (input: { distanceM: number; tripId: string }) => Promise<void>;
  onUpdateTrip: (input: UpdateTripInput) => Promise<TripDraft | null>;
  rates: ClaimRates;
  trips: TripDraft[];
};

type TripFormMode = "route" | "odometer" | "gps" | null;
type TripStatusFilter = "all" | "final" | "draft";
type TripCategoryFilter = "all" | TripCalculationMode;
type TripSortKey = "date_desc" | "date_asc" | "distance_desc" | "category";

type RouteAlternative = {
  distanceKm: number;
  durationMin: number;
  geometry: RouteMapRoute["geometry"];
  id: string;
  label: string;
  note: string;
};

type GeocodeSuggestion = {
  id: string;
  label: string;
  latLng: LatLng;
};

// ── Favorite Locations ────────────────────────────────────────────────────────
type FavoriteLocation = {
  id: string;
  shortName: string;
  label: string;
  latLng: LatLng;
};

const FAV_STORAGE_KEY = "myexpensio-favorite-locations";
const FAV_MAX = 8;

async function loadFavorites(): Promise<FavoriteLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(FAV_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FavoriteLocation[]) : [];
  } catch { return []; }
}

async function saveFavorites(favs: FavoriteLocation[]): Promise<void> {
  await AsyncStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favs));
}

async function addFavorite(fav: Omit<FavoriteLocation, "id">): Promise<FavoriteLocation[]> {
  const existing = await loadFavorites();
  if (existing.some((f) => f.label === fav.label)) return existing;
  const updated = [{ ...fav, id: `fav-${Date.now()}` }, ...existing].slice(0, FAV_MAX);
  await saveFavorites(updated);
  return updated;
}

async function removeFavorite(id: string): Promise<FavoriteLocation[]> {
  const existing = await loadFavorites();
  const updated = existing.filter((f) => f.id !== id);
  await saveFavorites(updated);
  return updated;
}

const tripStatusFilters: Array<{ label: string; value: TripStatusFilter }> = [
  { label: "All", value: "all" },
  { label: "Final", value: "final" },
  { label: "In Progress", value: "draft" }
];

const tripCategoryFilters: Array<{ label: string; value: TripCategoryFilter }> = [
  { label: "All Types", value: "all" },
  { label: "Route", value: "selected_route" },
  { label: "Odometer", value: "odometer" },
  { label: "GPS", value: "gps_tracking" }
];

const tripSortOptions: Array<{ label: string; value: TripSortKey }> = [
  { label: "Newest", value: "date_desc" },
  { label: "Oldest", value: "date_asc" },
  { label: "Distance", value: "distance_desc" },
  { label: "Type", value: "category" }
];

export function TripsScreen({
  claims,
  isCreatingTrip,
  isDeletingTrip,
  isLoading,
  isStoppingTrip,
  isUpdatingTrip,
  onAddMileageToClaim,
  onCreateTrip,
  onDeleteTrip,
  onStopGpsTrip,
  onUpdateTrip,
  isError = false,
  isRefreshing = false,
  onRefresh,
  rates,
  trips
}: TripsScreenProps) {
  const [formMode, setFormMode] = useState<TripFormMode>(null);
  const [categoryFilter, setCategoryFilter] =
    useState<TripCategoryFilter>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [favLocationsOpen, setFavLocationsOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripDraft | null>(null);
  const [sortKey, setSortKey] = useState<TripSortKey>("date_desc");
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TripStatusFilter>("all");
  const activeGpsTrip = trips.find(
    (trip) => trip.status === "draft" && trip.calculationMode === "gps_tracking"
  );

  // ── Live GPS tracking ──────────────────────────────────────────────────────
  const [liveDistanceM, setLiveDistanceM] = useState(0);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);
  const accumulatedMRef = useRef(0);

  useEffect(() => {
    if (!activeGpsTrip || Platform.OS === "web") {
      // Stop watching if no active GPS trip
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
      return;
    }

    let cancelled = false;

    async function startWatching() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;

      // Reset accumulators when a new GPS trip begins
      if (!locationSubRef.current) {
        accumulatedMRef.current = 0;
        lastLocationRef.current = null;
        setLiveDistanceM(0);
      }

      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 10,   // update every 10 m moved
          timeInterval: 5000,     // or every 5 s
        },
        (loc) => {
          const { latitude, longitude } = loc.coords;
          if (lastLocationRef.current) {
            const delta = haversineM(
              lastLocationRef.current.lat,
              lastLocationRef.current.lng,
              latitude,
              longitude
            );
            // Ignore spurious jumps > 300 m in 5 s (GPS glitch)
            if (delta < 300) {
              accumulatedMRef.current += delta;
              setLiveDistanceM(Math.round(accumulatedMRef.current));
            }
          }
          lastLocationRef.current = { lat: latitude, lng: longitude };
        }
      );
    }

    void startWatching();

    return () => {
      cancelled = true;
      if (locationSubRef.current) {
        locationSubRef.current.remove();
        locationSubRef.current = null;
      }
    };
  }, [activeGpsTrip?.id]);

  const visibleTrips = useMemo(
    () =>
      sortTrips(
        trips.filter(
          (trip) =>
            (statusFilter === "all" || trip.status === statusFilter) &&
            (categoryFilter === "all" ||
              trip.calculationMode === categoryFilter)
        ),
        sortKey
      ),
    [categoryFilter, sortKey, statusFilter, trips]
  );

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trips</Text>
        {trips.length > 0 ? (
          <Text style={styles.count}>
            {trips.length} trip{trips.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      {activeGpsTrip ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setSelectedTrip(activeGpsTrip)}
          style={styles.activeBanner}
        >
          <View style={styles.activeGlow} />
          <Text style={styles.activeBannerText}>
            GPS trip in progress{liveDistanceM > 0 ? ` · ${(liveDistanceM / 1000).toFixed(2)} km` : ""} — tap to return
          </Text>
          <Text style={styles.bannerArrow}>{">"}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actionGrid}>
        <TripActionButton
          icon="📐"
          label="Mileage Calc"
          onPress={() => setFormMode("route")}
          tone="blue"
        />
        <TripActionButton
          icon="📏"
          label="Odometer"
          onPress={() => setFormMode("odometer")}
          tone="amber"
        />
        <TripActionButton
          icon={activeGpsTrip ? "🔴" : "▶"}
          label={activeGpsTrip ? "Return to GPS" : "GPS Trip"}
          onPress={() => {
            if (activeGpsTrip) {
              setSelectedTrip(activeGpsTrip);
              return;
            }
            setFormMode("gps");
          }}
          tone="dark"
        />
        <TripActionButton
          icon="⭐"
          label="Fav Locations"
          onPress={() => setFavLocationsOpen(true)}
          tone="star"
        />
      </View>

      {trips.length > 0 ? (
        <View style={styles.listToolbar}>
          <Text style={styles.listToolbarText}>
            {visibleTrips.length}/{trips.length} shown
          </Text>
          <View style={styles.toolbarActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setFilterSheetOpen(true)}
              style={styles.toolbarMenuButton}
            >
              <Text style={styles.toolbarMenuText}>
                Filter: {tripFilterSummary(statusFilter, categoryFilter)} ▾
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSortSheetOpen(true)}
              style={styles.toolbarMenuButton}
            >
              <Text style={styles.toolbarMenuText}>
                Sort: {tripSortLabel(sortKey)} ▾
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isLoading && trips.length === 0 ? (
        <SkeletonList count={4} />
      ) : isError && trips.length === 0 ? (
        <ErrorState message="Couldn't load trips" onRetry={onRefresh} />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🗺</Text>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyCopy}>
            Start a GPS trip, enter an odometer reading, or use the Mileage
            Calculator.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleTrips}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            ) : undefined
          }
          ListEmptyComponent={
            <View style={styles.emptyCompact}>
              <Text style={styles.emptyCopy}>No trips match this filter.</Text>
            </View>
          }
          renderItem={({ item: trip }) => (
            <TripCard key={trip.id} onPress={() => setSelectedTrip(trip)} trip={trip} />
          )}
        />
      )}

      <TripFormModal
        isCreating={isCreatingTrip}
        mode={formMode}
        onClose={() => setFormMode(null)}
        onCreateTrip={async (input) => {
          await onCreateTrip(input);
          setFormMode(null);
        }}
      />

      <TripDetailModal
        claims={claims}
        isDeletingTrip={isDeletingTrip}
        isStoppingTrip={isStoppingTrip}
        isUpdatingTrip={isUpdatingTrip}
        onAddMileageToClaim={onAddMileageToClaim}
        onClose={() => setSelectedTrip(null)}
        onDeleteTrip={async (trip) => {
          await onDeleteTrip(trip);
          setSelectedTrip(null);
        }}
        liveDistanceM={liveDistanceM}
        onStopGpsTrip={onStopGpsTrip}
        onUpdateTrip={async (input) => {
          const updated = await onUpdateTrip(input);
          if (updated) {
            setSelectedTrip(updated);
          }
        }}
        rates={rates}
        trip={selectedTrip}
      />
      <TripFilterSheet
        categoryFilter={categoryFilter}
        isVisible={filterSheetOpen}
        onCategoryChange={setCategoryFilter}
        onClose={() => setFilterSheetOpen(false)}
        onStatusChange={setStatusFilter}
        statusFilter={statusFilter}
      />
      <OptionSheet
        isVisible={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        onSelect={(value) => {
          setSortKey(value);
          setSortSheetOpen(false);
        }}
        options={tripSortOptions}
        selectedValue={sortKey}
        title="Sort trips"
      />
      <FavLocationsSheet
        isVisible={favLocationsOpen}
        onClose={() => setFavLocationsOpen(false)}
      />
    </View>
  );
}

function TripCard({
  onPress,
  trip
}: {
  onPress: () => void;
  trip: TripDraft;
}) {
  const isDraft = trip.status === "draft";
  const badge = getSourceBadge(trip);

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <Text style={styles.cardIcon}>{getTripIcon(trip)}</Text>
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {tripTitle(trip)}
          </Text>
          <View
            style={[
              styles.sourceBadge,
              isDraft ? styles.draftBadge : { backgroundColor: badge.bg }
            ]}
          >
            <Text
              style={[
                styles.sourceBadgeText,
                isDraft ? styles.draftBadgeText : { color: badge.color }
              ]}
            >
              {isDraft ? "In Progress" : badge.label}
            </Text>
          </View>
        </View>
        <Text style={styles.cardMeta}>
          {formatDate(trip.startedAt)} · {formatTime(trip.startedAt)}
          {trip.endedAt ? ` -> ${formatTime(trip.endedAt)}` : ""}
        </Text>
        <View style={styles.cardFooter}>
          {trip.finalDistanceM != null ? (
            <Text style={styles.distanceText}>{formatKm(trip.finalDistanceM)}</Text>
          ) : null}
          {trip.odometerMode && trip.odometerMode !== "NONE" ? (
            <Text style={styles.odoTag}>📏 Override</Text>
          ) : null}
        </View>
      </View>
      <Text style={styles.cardArrow}>{">"}</Text>
    </Pressable>
  );
}

function TripActionButton({
  icon,
  label,
  onPress,
  tone
}: {
  icon: string;
  label: string;
  onPress: () => void;
  tone: "amber" | "blue" | "dark" | "star";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.tripAction, styles[`tripAction_${tone}`]]}
    >
      <Text style={styles.tripActionIcon}>{icon}</Text>
      <Text style={styles.tripActionText}>{label}</Text>
    </Pressable>
  );
}

function TripFilterSheet({
  categoryFilter,
  isVisible,
  onCategoryChange,
  onClose,
  onStatusChange,
  statusFilter
}: {
  categoryFilter: TripCategoryFilter;
  isVisible: boolean;
  onCategoryChange: (value: TripCategoryFilter) => void;
  onClose: () => void;
  onStatusChange: (value: TripStatusFilter) => void;
  statusFilter: TripStatusFilter;
}) {
  if (!isVisible) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.optionSheet}>
          <View style={styles.optionSheetHeader}>
            <Text style={styles.optionSheetTitle}>Filter trips</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <Text style={styles.optionGroupLabel}>Status</Text>
          <OptionList
            onSelect={onStatusChange}
            options={tripStatusFilters}
            selectedValue={statusFilter}
          />
          <Text style={styles.optionGroupLabel}>Type</Text>
          <OptionList
            onSelect={onCategoryChange}
            options={tripCategoryFilters}
            selectedValue={categoryFilter}
          />
        </View>
      </View>
    </Modal>
  );
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
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>
          <OptionList
            onSelect={onSelect}
            options={options}
            selectedValue={selectedValue}
          />
        </View>
      </View>
    </Modal>
  );
}

function OptionList<T extends string>({
  onSelect,
  options,
  selectedValue
}: {
  onSelect: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  selectedValue: T;
}) {
  return (
    <View style={styles.optionList}>
      {options.map((option) => {
        const isActive = option.value === selectedValue;

        return (
          <Pressable
            accessibilityRole="button"
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.optionRow, isActive ? styles.optionRowActive : null]}
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
  );
}

// ── FavLocationsSheet ─────────────────────────────────────────────────────────
function FavLocationsSheet({
  isVisible,
  onClose
}: {
  isVisible: boolean;
  onClose: () => void;
}) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [mapScrollLocked, setMapScrollLocked] = useState(false);

  // ── Shared form state (reused for both add and edit) ──────────────────────
  type FormMode = { kind: "add" } | { kind: "edit"; id: string } | null;
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState(""); // free-text, user-controlled
  const [formLatLng, setFormLatLng] = useState<LatLng | null>(null); // from map pin only
  const [formMapCenter, setFormMapCenter] = useState<LatLng | null>(null);
  // Map search — navigation helper only, never writes to formAddress
  const [mapSearch, setMapSearch] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<GeocodeSuggestion[]>([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadFavorites().then(setFavorites).catch(() => {});
      closeForm();
    }
  }, [isVisible]);

  // Live search for map navigation only
  useEffect(() => {
    if (mapSearch.trim().length < 3) {
      setMapSearchResults([]);
      setMapSearchError(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setMapSearching(true);
      void searchGeocodeSuggestions(mapSearch)
        .then((results) => {
          if (!cancelled) {
            setMapSearchResults(results);
            setMapSearchError(results.length === 0 ? "No results found." : null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMapSearchResults([]);
            setMapSearchError("Search failed. Check your connection.");
          }
        })
        .finally(() => { if (!cancelled) setMapSearching(false); });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [mapSearch]);

  function closeForm() {
    setFormMode(null);
    setFormName("");
    setFormAddress("");
    setFormLatLng(null);
    setFormMapCenter(null);
    setMapSearch("");
    setMapSearchResults([]);
    setMapSearchError(null);
  }

  function openAdd() {
    closeForm();
    setFormMode({ kind: "add" });
  }

  function openEdit(fav: FavoriteLocation) {
    setFormMode({ kind: "edit", id: fav.id });
    setFormName(fav.shortName);
    setFormAddress(fav.label);
    setFormLatLng(fav.latLng);
    setFormMapCenter(fav.latLng);
    setMapSearch("");
    setMapSearchResults([]);
    setMapSearchError(null);
  }

  async function handleSave() {
    if (!formLatLng || !formName.trim()) return;
    setIsSaving(true);
    try {
      if (formMode?.kind === "edit") {
        const updated = favorites.map((f) =>
          f.id === formMode.id
            ? { ...f, shortName: formName.trim(), label: formAddress.trim(), latLng: formLatLng }
            : f
        );
        await saveFavorites(updated);
        setFavorites(updated);
      } else {
        const updated = await addFavorite({
          shortName: formName.trim(),
          label: formAddress.trim() || formName.trim(),
          latLng: formLatLng
        });
        setFavorites(updated);
      }
      closeForm();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const updated = await removeFavorite(id);
    setFavorites(updated);
    if (formMode?.kind === "edit" && formMode.id === id) closeForm();
  }

  if (!isVisible) return null;

  const isFormOpen = formMode !== null;
  const isEditMode = formMode?.kind === "edit";
  const saveDisabled = !formLatLng || !formName.trim() || isSaving;

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitle}>
              <Text style={styles.modalTitle}>⭐ Favourite Locations</Text>
              <Text style={styles.modalSub}>
                Saved places for quick origin / destination entry
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={!mapScrollLocked}
            style={styles.modalScroll}
          >
            {/* ── List view ── */}
            {!isFormOpen ? (
              <>
                {favorites.length === 0 ? (
                  <View style={styles.favMgrEmpty}>
                    <Text style={styles.favMgrEmptyIcon}>⭐</Text>
                    <Text style={styles.favMgrEmptyTitle}>No saved locations</Text>
                    <Text style={styles.favMgrEmptyText}>
                      Save locations while creating a trip or add one below.
                    </Text>
                  </View>
                ) : null}
                {favorites.map((fav) => (
                  <View key={fav.id} style={styles.favMgrRow}>
                    <View style={styles.favMgrItem}>
                      <View style={styles.favMgrItemBody}>
                        <Text style={styles.favMgrItemName} numberOfLines={1}>
                          ⭐ {fav.shortName}
                        </Text>
                        <Text style={styles.favMgrItemLabel} numberOfLines={1}>
                          {fav.label}
                        </Text>
                      </View>
                      <View style={styles.favMgrItemActions}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => openEdit(fav)}
                          style={styles.favMgrEditBtn}
                        >
                          <Text style={styles.favMgrEditBtnText}>✏️</Text>
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => void handleDelete(fav.id)}
                          style={styles.favMgrDeleteBtn}
                        >
                          <Text style={styles.favMgrDeleteBtnText}>🗑</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </>
            ) : null}

            {/* ── Add / Edit form ── */}
            {isFormOpen ? (
              <View style={styles.favMgrAddCard}>
                <Text style={styles.favMgrAddTitle}>
                  {isEditMode ? "Edit Location" : "Add New Location"}
                </Text>

                {/* Short Name */}
                <View style={styles.field}>
                  <Text style={styles.label}>Short Name *</Text>
                  <TextInput
                    autoFocus
                    onChangeText={setFormName}
                    placeholder="e.g. Home, Office, Client HQ"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    value={formName}
                  />
                </View>

                {/* Address — free text, completely independent of the map */}
                <View style={styles.field}>
                  <Text style={styles.label}>Address / Description</Text>
                  <TextInput
                    onChangeText={setFormAddress}
                    placeholder="e.g. No 12, Jalan ABC, Taman XYZ"
                    placeholderTextColor="#94a3b8"
                    style={[styles.input, styles.textarea]}
                    multiline
                    value={formAddress}
                  />
                </View>

                {/* Map search — navigation only, never writes to Address */}
                <View style={styles.favMgrMapSearchWrap}>
                  <Text style={styles.favMgrMapSearchLabel}>
                    🔍 Search to navigate the map
                  </Text>
                  <View style={styles.routeInputShell}>
                    <TextInput
                      onChangeText={(v) => {
                        setMapSearch(v);
                        setMapSearchResults([]);
                      }}
                      placeholder="Type a place name to jump to it…"
                      placeholderTextColor="#94a3b8"
                      style={styles.routeInput}
                      value={mapSearch}
                    />
                    {mapSearching ? (
                      <Text style={styles.routeInputSpinner}>...</Text>
                    ) : null}
                  </View>
                  {mapSearchError && mapSearch.trim().length >= 3 && !mapSearching ? (
                    <Text style={styles.searchErrorText}>{mapSearchError}</Text>
                  ) : null}
                  {mapSearchResults.length > 0 ? (
                    <View style={styles.suggestionPanel}>
                      <Text style={styles.suggestionPanelTitle}>Jump to location</Text>
                      {mapSearchResults.slice(0, 5).map((s) => (
                        <Pressable
                          accessibilityRole="button"
                          key={s.id}
                          onPress={() => {
                            setFormMapCenter(s.latLng);
                            setFormLatLng(s.latLng);
                            setMapSearch("");
                            setMapSearchResults([]);
                          }}
                          style={styles.suggestionItem}
                        >
                          <Text style={styles.suggestionMain}>
                            {shortLocationName(s.label)}
                          </Text>
                          <Text numberOfLines={2} style={styles.suggestionSub}>
                            {s.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                {/* Map — always visible, tap/drag to set pin */}
                <View style={styles.favMgrMapWrap}>
                  <Text style={styles.favMgrMapHint}>
                    {formLatLng
                      ? "📍 Drag or tap to adjust exact location"
                      : "📍 Tap the map to drop a pin *"}
                  </Text>
                  <View
                    onTouchStart={() => setMapScrollLocked(true)}
                    onTouchEnd={() => setMapScrollLocked(false)}
                    onTouchCancel={() => setMapScrollLocked(false)}
                  >
                    <SinglePinMap
                      center={formMapCenter}
                      pinLatLng={formLatLng}
                      onPinSet={(ll) => setFormLatLng(ll)}
                    />
                  </View>
                  <Text style={styles.favMgrMapCoords}>
                    {formLatLng
                      ? `📌 ${formLatLng[0].toFixed(5)}, ${formLatLng[1].toFixed(5)}`
                      : "No pin set yet"}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.favMgrEditActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={closeForm}
                    style={styles.favMgrCancelBtn}
                  >
                    <Text style={styles.favMgrCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    disabled={saveDisabled}
                    onPress={() => void handleSave()}
                    style={[styles.favMgrSaveBtn, saveDisabled ? styles.disabled : null]}
                  >
                    <Text style={styles.favMgrSaveText}>
                      {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Location"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer: Add button (only in list view) */}
          {!isFormOpen ? (
            <View style={styles.modalFooter}>
              <Pressable
                accessibilityRole="button"
                disabled={favorites.length >= FAV_MAX}
                onPress={openAdd}
                style={[styles.saveButton, favorites.length >= FAV_MAX ? styles.disabled : null]}
              >
                <Text style={styles.saveButtonText}>
                  {favorites.length >= FAV_MAX
                    ? `Max ${FAV_MAX} locations reached`
                    : "+ Add New Location"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

// ── OdometerStep — accordion card for Origin / Destination ───────────────────
function OdometerStep({
  children,
  icon,
  isDone,
  isOpen,
  onToggle,
  stepNumber,
  subtitle,
  title
}: {
  children: React.ReactNode;
  icon: string;
  isDone: boolean;
  isOpen: boolean;
  onToggle: () => void;
  stepNumber: number;
  subtitle: string;
  title: string;
}) {
  return (
    <View style={[styles.odoStep, isDone && !isOpen ? styles.odoStepDone : null]}>
      <Pressable accessibilityRole="button" onPress={onToggle} style={styles.odoStepHeader}>
        <View style={styles.odoStepBadge}>
          <Text style={styles.odoStepBadgeText}>{stepNumber}</Text>
        </View>
        <View style={styles.odoStepTitleWrap}>
          <View style={styles.odoStepTitleRow}>
            <Text style={styles.odoStepIcon}>{icon}</Text>
            <Text style={styles.odoStepTitle}>{title}</Text>
            {isDone ? <Text style={styles.odoStepCheck}>✓</Text> : null}
          </View>
          <Text style={styles.odoStepSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <Text style={styles.odoStepChevron}>{isOpen ? "▴" : "▾"}</Text>
      </Pressable>
      {isOpen ? (
        <View style={styles.odoStepBody}>{children}</View>
      ) : null}
    </View>
  );
}

function TripFormModal({
  isCreating,
  mode,
  onClose,
  onCreateTrip
}: {
  isCreating: boolean;
  mode: TripFormMode;
  onClose: () => void;
  onCreateTrip: (input: CreateTripInput) => Promise<void>;
}) {
  const [date, setDate] = useState(todayInput());
  const [time, setTime] = useState(nowTimeInput());
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [notes, setNotes] = useState("");
  const [routeAlternatives, setRouteAlternatives] = useState<
    RouteAlternative[]
  >([]);
  const [originLatLng, setOriginLatLng] = useState<LatLng | null>(null);
  const [destinationLatLng, setDestinationLatLng] = useState<LatLng | null>(
    null
  );
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [geocodingTarget, setGeocodingTarget] = useState<
    "origin" | "destination" | null
  >(null);
  // Odometer-specific state
  const [originReading, setOriginReading] = useState("");
  const [destinationReading, setDestinationReading] = useState("");
  const [originEvidence, setOriginEvidence] = useState<string | null>(null);
  const [destinationEvidence, setDestinationEvidence] = useState<string | null>(null);
  const [originSectionDone, setOriginSectionDone] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("car");

  useEffect(() => {
    if (!mode) {
      resetForm();
    }
  }, [mode]);

  if (!mode) {
    return null;
  }

  const distance = Number(distanceKm);
  const isGps = mode === "gps";
  const isOdometer = mode === "odometer";
  const odoOriginKm = Number(originReading);
  const odoDestKm = Number(destinationReading);
  const odoDistance = odoDestKm - odoOriginKm;
  const selectedRoute = routeAlternatives.find(
    (route) => route.id === selectedRouteId
  );
  const mapRoutes: RouteMapRoute[] = routeAlternatives.map((route) => ({
    distanceM: Math.round(route.distanceKm * 1000),
    durationS: route.durationMin * 60,
    geometry: route.geometry,
    id: route.id,
    summary: route.label
  }));
  const selectedRouteIndex = routeAlternatives.findIndex(
    (route) => route.id === selectedRouteId
  );
  const hasBaseRouteInput =
    origin.trim().length > 0 &&
    destination.trim().length > 0 &&
    distanceKm.length > 0 &&
    !Number.isNaN(distance) &&
    distance > 0;
  const hasRouteSearchInput =
    origin.trim().length > 0 && destination.trim().length > 0;
  const odoValid =
    originReading.length > 0 &&
    Number.isFinite(odoOriginKm) &&
    odoOriginKm >= 0 &&
    destinationReading.length > 0 &&
    Number.isFinite(odoDestKm) &&
    odoDistance > 0;
  const valid =
    isGps || (mode === "route" ? Boolean(selectedRoute) : isOdometer ? odoValid : hasBaseRouteInput);
  const title =
    mode === "gps"
      ? "Start GPS Trip"
      : mode === "odometer"
        ? "Odometer Trip"
        : "Mileage Calculator";

  async function handleCreate() {
    if (!valid) {
      return;
    }

    const startedAt = `${date}T${time}:00+08:00`;
    const calculationMode: TripCalculationMode =
      mode === "gps"
        ? "gps_tracking"
        : mode === "odometer"
          ? "odometer"
          : "selected_route";

    try {
      await onCreateTrip({
        calculationMode,
        destinationText: destination.trim() || null,
        distanceM: isGps
          ? null
          : isOdometer
            ? Math.round(odoDistance * 1000)
            : Math.round((selectedRoute?.distanceKm ?? distance) * 1000),
        endEvidenceUri: isOdometer ? destinationEvidence : null,
        notes:
          [
            notes.trim(),
            isOdometer
              ? `Odometer: ${odoOriginKm} → ${odoDestKm} km`
              : selectedRoute
                ? `Route option: ${selectedRoute.label}`
                : ""
          ]
            .filter(Boolean)
            .join("\n") || null,
        originText: origin.trim() || null,
        routeOptionLabel: selectedRoute?.label ?? null,
        startedAt,
        startEvidenceUri: isOdometer ? originEvidence : null,
        vehicleType
      });
      resetForm();
    } catch (error) {
      setRouteError(
        error instanceof Error
          ? error.message
          : "Could not save trip. Please try again."
      );
    }
  }

  async function findAddressOnMap(target: "origin" | "destination") {
    const query = target === "origin" ? origin : destination;
    if (!query.trim()) {
      return;
    }

    setRouteError(null);
    setGeocodingTarget(target);

    try {
      const result = await geocodeAddress(query);
      if (target === "origin") {
        setOriginLatLng(result.latLng);
        setOrigin(result.label);
      } else {
        setDestinationLatLng(result.latLng);
        setDestination(result.label);
      }
      clearRouteSelection();
    } catch (error) {
      setRouteError(
        error instanceof Error ? error.message : "Could not find that location."
      );
    } finally {
      setGeocodingTarget(null);
    }
  }

  async function useCurrentPosition(target: "origin" | "destination") {
    setRouteError(null);

    try {
      const latLng = await getCurrentLatLng();
      if (target === "origin") {
        handleOriginMapSet(latLng);
      } else {
        handleDestinationMapSet(latLng);
      }
    } catch (error) {
      setRouteError(
        error instanceof Error
          ? error.message
          : "Current position is not available."
      );
    }
  }

  async function calculateRouteOptions() {
    if (!hasRouteSearchInput) {
      setRouteError("Set both origin and destination first.");
      return;
    }

    setRouteError(null);
    setIsRouteLoading(true);

    try {
      const resolvedOrigin = originLatLng ?? (await geocodeAddress(origin)).latLng;
      const resolvedDestination =
        destinationLatLng ?? (await geocodeAddress(destination)).latLng;
      setOriginLatLng(resolvedOrigin);
      setDestinationLatLng(resolvedDestination);

      const options = await fetchRouteAlternatives(
        resolvedOrigin,
        resolvedDestination
      );
      setRouteAlternatives(options);
      setSelectedRouteId(options[0]?.id ?? null);
    } catch (error) {
      setRouteError(
        error instanceof Error
          ? error.message
          : "Could not calculate route. Check your connection and try again."
      );
    } finally {
      setIsRouteLoading(false);
    }
  }

  function clearRouteSelection() {
    setRouteAlternatives([]);
    setSelectedRouteId(null);
  }

  function resetForm() {
    setDate(todayInput());
    setTime(nowTimeInput());
    setOrigin("");
    setDestination("");
    setDistanceKm("");
    setNotes("");
    setRouteAlternatives([]);
    setOriginLatLng(null);
    setDestinationLatLng(null);
    setSelectedRouteId(null);
    setRouteError(null);
    setIsRouteLoading(false);
    setGeocodingTarget(null);
    setOriginReading("");
    setDestinationReading("");
    setOriginEvidence(null);
    setDestinationEvidence(null);
    setOriginSectionDone(false);
    setVehicleType("car");
  }

  function handleOriginMapSet(latLng: LatLng) {
    setOriginLatLng(latLng);
    setOrigin(formatLatLng(latLng));
    clearRouteSelection();
    setRouteError(null);
  }

  function handleDestinationMapSet(latLng: LatLng) {
    setDestinationLatLng(latLng);
    setDestination(formatLatLng(latLng));
    clearRouteSelection();
    setRouteError(null);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.modalSub}>
                {isGps
                  ? "Start a draft trip and stop it when you arrive."
                  : mode === "odometer" ? "Record origin and destination odometer readings."
                  : "Calculate route and distance for mileage claims."}
              </Text>
            </View>
            <View style={styles.modalHeaderActions}>
              {mode === "route" ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={resetForm}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </Pressable>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={onClose}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
            <View style={styles.fieldRow}>
              <DatePickerField label="Date" onChange={setDate} value={date} />
              <Field label="Time" onChangeText={setTime} value={time} />
            </View>

            <VehicleSelector value={vehicleType} onChange={setVehicleType} />

            {!isGps ? (
              <>
                {mode === "route" ? (
                  <>
                    <RouteMap
                      destinationLatLng={destinationLatLng}
                      mode={routeAlternatives.length > 0 ? "routing" : "pinning"}
                      onDestinationSet={handleDestinationMapSet}
                      onOriginSet={handleOriginMapSet}
                      onRouteClick={(index: number) =>
                        setSelectedRouteId(routeAlternatives[index]?.id ?? null)
                      }
                      originLatLng={originLatLng}
                      routes={mapRoutes}
                      selectedIndex={
                        selectedRouteIndex >= 0 ? selectedRouteIndex : null
                      }
                    />
                    <RouteAddressField
                      isLoading={geocodingTarget === "origin"}
                      label="Origin"
                      onChangeText={(value) => {
                        setOrigin(value);
                        setOriginLatLng(null);
                        clearRouteSelection();
                      }}
                      onFind={() => void findAddressOnMap("origin")}
                      onSelect={(suggestion) => {
                        setOrigin(suggestion.label);
                        setOriginLatLng(suggestion.latLng);
                        clearRouteSelection();
                      }}
                      selectedLatLng={originLatLng}
                      onUseCurrent={() => void useCurrentPosition("origin")}
                      pin="green"
                      value={origin}
                    />
                    <RouteAddressField
                      isLoading={geocodingTarget === "destination"}
                      label="Destination"
                      onChangeText={(value) => {
                        setDestination(value);
                        setDestinationLatLng(null);
                        clearRouteSelection();
                      }}
                      onFind={() => void findAddressOnMap("destination")}
                      onSelect={(suggestion) => {
                        setDestination(suggestion.label);
                        setDestinationLatLng(suggestion.latLng);
                        clearRouteSelection();
                      }}
                      selectedLatLng={destinationLatLng}
                      onUseCurrent={() =>
                        void useCurrentPosition("destination")
                      }
                      pin="red"
                      value={destination}
                    />
                    {routeError ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{routeError}</Text>
                      </View>
                    ) : null}
                    <Pressable
                      accessibilityRole="button"
                      disabled={!hasRouteSearchInput || isRouteLoading}
                      onPress={() => void calculateRouteOptions()}
                      style={[
                        styles.calculateButton,
                        !hasRouteSearchInput || isRouteLoading
                          ? styles.disabled
                          : null
                      ]}
                    >
                      <Text style={styles.calculateButtonText}>
                        {isRouteLoading ? "Calculating..." : "Calculate Route"}
                      </Text>
                    </Pressable>
                    {routeAlternatives.length > 0 ? (
                      <View style={styles.routeOptions}>
                        <Text style={styles.routeOptionsTitle}>
                          Select Route
                        </Text>
                        {routeAlternatives.map((route) => (
                          <RouteAlternativeOption
                            key={route.id}
                            onPress={() => setSelectedRouteId(route.id)}
                            route={route}
                            selected={route.id === selectedRouteId}
                          />
                        ))}
                      </View>
                    ) : null}
                  </>
                ) : (
                  // ── Odometer accordion flow ──────────────────────────────
                  <View style={styles.odoFlow}>

                    {/* Step 1: Origin */}
                    <OdometerStep
                      icon="🟢"
                      stepNumber={1}
                      title="Origin"
                      subtitle={
                        originSectionDone && originReading
                          ? `${originReading} km · ${origin || "no location set"}`
                          : "Enter reading when you depart"
                      }
                      isOpen={!originSectionDone}
                      isDone={originSectionDone}
                      onToggle={() => setOriginSectionDone((v) => !v)}
                    >
                      <FavPickField
                        label="Location (optional)"
                        onChangeText={setOrigin}
                        placeholder="e.g. Ayer Keroh, Melaka"
                        value={origin}
                      />
                      <Field
                        keyboardType="decimal-pad"
                        label="Odometer Reading (km) *"
                        onChangeText={(v) => {
                          if (v === "" || /^\d*\.?\d*$/.test(v)) setOriginReading(v);
                        }}
                        placeholder="e.g. 12450"
                        value={originReading}
                      />
                      <EvidenceCapture
                        label="Origin Reading"
                        onChange={setOriginEvidence}
                        value={originEvidence}
                      />
                      <Pressable
                        accessibilityRole="button"
                        disabled={!originReading || Number(originReading) < 0}
                        onPress={() => setOriginSectionDone(true)}
                        style={[
                          styles.odoStepDoneBtn,
                          !originReading ? styles.disabled : null
                        ]}
                      >
                        <Text style={styles.odoStepDoneBtnText}>
                          Done — Save Origin ›
                        </Text>
                      </Pressable>
                    </OdometerStep>

                    {/* Step 2: Destination */}
                    <OdometerStep
                      icon="🔴"
                      stepNumber={2}
                      title="Destination"
                      subtitle={
                        originSectionDone && destinationReading
                          ? `${destinationReading} km · ${destination || "no location set"}`
                          : originSectionDone
                            ? "Enter reading when you arrive"
                            : "Complete Origin first"
                      }
                      isOpen={originSectionDone}
                      isDone={odoValid}
                      onToggle={() => { if (originSectionDone) setOriginSectionDone(false); }}
                    >
                      <FavPickField
                        label="Location (optional)"
                        onChangeText={setDestination}
                        placeholder="e.g. Putrajaya, Selangor"
                        value={destination}
                      />
                      <Field
                        keyboardType="decimal-pad"
                        label="Odometer Reading (km) *"
                        onChangeText={(v) => {
                          if (v === "" || /^\d*\.?\d*$/.test(v)) setDestinationReading(v);
                        }}
                        placeholder="e.g. 12502"
                        value={destinationReading}
                      />
                      <EvidenceCapture
                        label="Destination Reading"
                        onChange={setDestinationEvidence}
                        value={destinationEvidence}
                      />
                    </OdometerStep>

                    {/* Auto-calculated distance */}
                    {odoValid ? (
                      <View style={styles.odoSummary}>
                        <Text style={styles.odoSummaryLabel}>Calculated Distance</Text>
                        <Text style={styles.odoSummaryValue}>
                          {odoDistance.toFixed(2)} km
                        </Text>
                        <Text style={styles.odoSummaryMath}>
                          {odoDestKm} − {odoOriginKm} = {odoDistance.toFixed(2)} km
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Tapping &quot;Start GPS Trip&quot; will request location permission and
                  begin live tracking. Your distance is recorded automatically.
                  Open the trip again to stop and finalise.
                </Text>
              </View>
            )}

            <Field
              label="Notes"
              multiline
              onChangeText={setNotes}
              placeholder="e.g. Client visit, fastest route taken"
              value={notes}
            />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={!valid || isCreating}
              onPress={() => void handleCreate()}
              style={[
                styles.saveButton,
                !valid || isCreating ? styles.disabled : null
              ]}
            >
              <Text style={styles.saveButtonText}>
                {isCreating
                  ? "Saving..."
                  : isGps
                    ? "Start GPS Trip"
                    : `Save ${vehicleType === "motorcycle" ? "Motorcycle" : "Car"} Trip`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TripDetailModal({
  claims,
  isDeletingTrip,
  isStoppingTrip,
  isUpdatingTrip,
  liveDistanceM,
  onAddMileageToClaim,
  onClose,
  onDeleteTrip,
  onStopGpsTrip,
  onUpdateTrip,
  rates,
  trip
}: {
  claims: ClaimDraft[];
  isDeletingTrip: boolean;
  isStoppingTrip: boolean;
  isUpdatingTrip: boolean;
  /** Live GPS distance in metres from the tracking loop in TripsScreen */
  liveDistanceM?: number;
  onAddMileageToClaim: (input: {
    amountCents: number;
    claim: ClaimDraft;
    itemDate: string;
    title: string;
    trip: TripDraft;
  }) => void;
  onClose: () => void;
  onDeleteTrip: (trip: TripDraft) => Promise<void>;
  onStopGpsTrip: (input: { distanceM: number; tripId: string }) => Promise<void>;
  onUpdateTrip: (input: UpdateTripInput) => Promise<void>;
  rates: ClaimRates;
  trip: TripDraft | null;
}) {
  const [stopDistanceKm, setStopDistanceKm] = useState("");
  const [claimPickerOpen, setClaimPickerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editOrigin, setEditOrigin] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editDistanceKm, setEditDistanceKm] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editVehicleType, setEditVehicleType] = useState<VehicleType>("car");

  useEffect(() => {
    if (!trip) {
      return;
    }

    setEditOrigin(trip.originText ?? "");
    setEditDestination(trip.destinationText ?? "");
    setEditDistanceKm(
      trip.finalDistanceM ? (trip.finalDistanceM / 1000).toFixed(2) : ""
    );
    setEditNotes(trip.notes ?? "");
    setEditVehicleType(trip.vehicleType);
    setIsEditing(false);
  }, [trip?.id]);

  if (!trip) {
    return null;
  }

  const rate = Number(
    trip.vehicleType === "motorcycle"
      ? rates.mileageMotorcycleRate
      : rates.mileageCarRate
  );
  const finalDistanceM = trip.finalDistanceM ?? 0;
  const safeRate = Number.isFinite(rate) ? rate : 0;
  const amountCents = Math.round((finalDistanceM / 1000) * safeRate * 100);
  const draftClaims = claims.filter((claim) => claim.status === "draft");
  const canEditTrip = trip.status === "final";

  async function handleUpdateTrip() {
    if (!trip) {
      return;
    }

    const distance = Number(editDistanceKm);
    if (!Number.isFinite(distance) || distance <= 0) {
      return;
    }

    await onUpdateTrip({
      destinationText: editDestination.trim() || null,
      distanceM: Math.round(distance * 1000),
      notes: editNotes.trim() || null,
      originText: editOrigin.trim() || null,
      routeOptionLabel: trip.routeOptionLabel,
      tripId: trip.id,
      vehicleType: editVehicleType
    });
    setIsEditing(false);
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitle}>
              <Text numberOfLines={2} style={styles.modalTitle}>{tripTitle(trip)}</Text>
              <Text style={styles.modalSub}>
                {formatDate(trip.startedAt)} - {trip.vehicleType}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.modalClose}>X</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled" style={styles.modalScroll}>
            <View style={styles.detailGrid}>
              <Metric label="Status" value={trip.status === "draft" ? "In Progress" : "Final"} />
              <Metric label="Distance" value={finalDistanceM > 0 ? formatKm(finalDistanceM) : "-"} />
              <Metric label="Source" value={sourceLabel(trip)} />
              <Metric label="Rate" value={`MYR ${safeRate.toFixed(2)}/km`} />
            </View>

            {canEditTrip ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  This trip is still local and can be edited. Trips linked to
                  submitted claims should be treated as locked in the production
                  sync flow.
                </Text>
                {isEditing ? (
                  <>
                    <Field
                      label="Origin"
                      onChangeText={setEditOrigin}
                      value={editOrigin}
                    />
                    <Field
                      label="Destination"
                      onChangeText={setEditDestination}
                      value={editDestination}
                    />
                    <Field
                      keyboardType="decimal-pad"
                      label="Distance (km)"
                      onChangeText={(value) => {
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setEditDistanceKm(value);
                        }
                      }}
                      value={editDistanceKm}
                    />
                    <VehicleSelector
                      onChange={setEditVehicleType}
                      value={editVehicleType}
                    />
                    <Field
                      label="Notes"
                      multiline
                      onChangeText={setEditNotes}
                      value={editNotes}
                    />
                    <View style={styles.editActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setIsEditing(false)}
                        style={styles.secondaryButton}
                      >
                        <Text style={styles.secondaryButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        disabled={isUpdatingTrip || Number(editDistanceKm) <= 0}
                        onPress={() => void handleUpdateTrip()}
                        style={[
                          styles.saveButton,
                          styles.editSaveButton,
                          isUpdatingTrip || Number(editDistanceKm) <= 0
                            ? styles.disabled
                            : null
                        ]}
                      >
                        <Text style={styles.saveButtonText}>
                          {isUpdatingTrip ? "Saving..." : "Save Changes"}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setIsEditing(true)}
                    style={styles.secondaryButton}
                  >
                    <Text style={styles.secondaryButtonText}>Edit Trip</Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            {trip.routeOptionLabel ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Selected route: {trip.routeOptionLabel}
                </Text>
              </View>
            ) : null}

            {trip.odometerStartEvidenceUri || trip.odometerEndEvidenceUri ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Odometer evidence:{" "}
                  {trip.odometerStartEvidenceUri ? "Origin attached" : "Origin missing"}{" "}
                  / {trip.odometerEndEvidenceUri ? "Destination attached" : "Destination missing"}
                </Text>
              </View>
            ) : null}

            {trip.status === "draft" ? (
              <View style={styles.infoBox}>
                {/* Live GPS readout */}
                {(liveDistanceM ?? 0) > 0 ? (
                  <View style={{ backgroundColor: "#f0fdf4", borderRadius: 8, padding: spacing.sm, marginBottom: spacing.sm }}>
                    <Text style={{ color: "#15803d", fontSize: 22, fontWeight: "900", textAlign: "center" }}>
                      {((liveDistanceM ?? 0) / 1000).toFixed(2)} km
                    </Text>
                    <Text style={{ color: "#16a34a", fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 2 }}>
                      Live GPS distance
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.infoText}>
                    GPS is tracking your position. Tap Stop to finalise the distance.
                  </Text>
                )}
                <Field
                  keyboardType="decimal-pad"
                  label={(liveDistanceM ?? 0) > 0 ? "Adjust distance (km)" : "Final GPS distance (km)"}
                  onChangeText={setStopDistanceKm}
                  placeholder={
                    (liveDistanceM ?? 0) > 0
                      ? ((liveDistanceM ?? 0) / 1000).toFixed(2)
                      : "e.g. 12.40"
                  }
                  value={stopDistanceKm || ((liveDistanceM ?? 0) > 0 ? ((liveDistanceM ?? 0) / 1000).toFixed(2) : "")}
                />
                <Pressable
                  accessibilityRole="button"
                  disabled={isStoppingTrip || Number(stopDistanceKm) <= 0}
                  onPress={() =>
                    void onStopGpsTrip({
                      distanceM: Math.round(Number(stopDistanceKm) * 1000),
                      tripId: trip.id
                    })
                  }
                  style={[
                    styles.stopButton,
                    isStoppingTrip || Number(stopDistanceKm) <= 0
                      ? styles.disabled
                      : null
                  ]}
                >
                  <Text style={styles.stopButtonText}>
                    {isStoppingTrip ? "Stopping..." : "End Trip"}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Mileage Claim Value</Text>
                  <Text style={styles.totalValue}>
                    MYR {(amountCents / 100).toFixed(2)}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={draftClaims.length === 0}
                  onPress={() => setClaimPickerOpen(true)}
                  style={[
                    styles.saveButton,
                    draftClaims.length === 0 ? styles.disabled : null
                  ]}
                >
                  <Text style={styles.saveButtonText}>Add Mileage to Claim</Text>
                </Pressable>
                {draftClaims.length === 0 ? (
                  <Text style={styles.emptyHelp}>
                    Create a draft claim first, then add this trip as mileage.
                  </Text>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Pressable
              accessibilityRole="button"
              disabled={isDeletingTrip}
              onPress={() =>
                confirmTripDelete(() => {
                  void onDeleteTrip(trip);
                })
              }
              style={[
                styles.deleteTripButton,
                isDeletingTrip ? styles.disabled : null
              ]}
            >
              <Text style={styles.deleteTripText}>
                {isDeletingTrip ? "Deleting..." : "Delete Trip"}
              </Text>
            </Pressable>
          </View>

          {claimPickerOpen ? (
            <View style={styles.claimPicker}>
              <Text style={styles.claimPickerTitle}>Choose draft claim</Text>
              {draftClaims.map((claim) => (
                <Pressable
                  accessibilityRole="button"
                  key={claim.id}
                  onPress={() => {
                    onAddMileageToClaim({
                      amountCents,
                      claim,
                      itemDate: trip.startedAt.slice(0, 10),
                      title: tripTitle(trip),
                      trip
                    });
                    setClaimPickerOpen(false);
                    onClose();
                  }}
                  style={styles.claimOption}
                >
                  <Text style={styles.claimOptionTitle}>
                    {claim.title || "Draft claim"}
                  </Text>
                  <Text style={styles.claimOptionSub}>
                    {claim.periodStart ?? "-"} · {claim.currency}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

function VehicleSelector({
  onChange,
  value
}: {
  onChange: (value: VehicleType) => void;
  value: VehicleType;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>Vehicle Type</Text>
      <View style={styles.vehicleRow}>
        {[
          { icon: "🚗", label: "Car", value: "car" as const },
          { icon: "🏍", label: "Motorcycle", value: "motorcycle" as const }
        ].map((option) => {
          const active = value === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.vehicleButton,
                active ? styles.vehicleButtonActive : null
              ]}
            >
              <Text style={styles.vehicleIcon}>{option.icon}</Text>
              <Text
                style={[
                  styles.vehicleLabel,
                  active ? styles.vehicleLabelActive : null
                ]}
              >
                {option.label}
              </Text>
              {active ? <Text style={styles.vehicleCheck}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── FavPickField ─────────────────────────────────────────────────────────────
// Lightweight field for odometer/GPS origin-destination:
// shows saved favorites as chips, plain text input underneath.
function FavPickField({
  label,
  onChangeText,
  placeholder,
  value,
}: {
  label: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  value: string;
}) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);

  useEffect(() => {
    loadFavorites().then(setFavorites).catch(() => {});
  }, []);

  function handleRemove(id: string) {
    removeFavorite(id).then(setFavorites).catch(() => {});
  }

  const [favOpen, setFavOpen] = useState(false);

  return (
    <View style={styles.favPickWrap}>
      <View style={styles.routeAddressHeader}>
        <Text style={styles.label}>{label}</Text>
        {favorites.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setFavOpen((v) => !v)}
            style={[styles.favDropButton, favOpen ? styles.favDropButtonActive : null]}
          >
            <Text style={styles.favDropButtonText}>⭐ Favs {favOpen ? "▲" : "▼"}</Text>
          </Pressable>
        ) : null}
      </View>
      {favOpen && favorites.length > 0 ? (
        <View style={styles.favDropPanel}>
          {favorites.map((fav) => (
            <Pressable
              key={fav.id}
              accessibilityRole="button"
              onPress={() => { onChangeText(fav.shortName); setFavOpen(false); }}
              onLongPress={() => handleRemove(fav.id)}
              style={styles.favDropItem}
            >
              <Text style={styles.favDropItemText} numberOfLines={1}>⭐ {fav.shortName}</Text>
              <Text style={styles.favDropItemSub} numberOfLines={1}>{fav.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function RouteAddressField({
  isLoading,
  label,
  onChangeText,
  onFind,
  onSelect,
  onUseCurrent,
  pin,
  selectedLatLng,
  value
}: {
  isLoading: boolean;
  label: string;
  onChangeText: (value: string) => void;
  onFind: () => void;
  onSelect: (suggestion: GeocodeSuggestion) => void;
  onUseCurrent: () => void;
  pin: "green" | "red";
  selectedLatLng: LatLng | null;
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [savedThisSession, setSavedThisSession] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    loadFavorites().then(setFavorites).catch(() => {});
  }, []);

  // Reset save flag when location changes
  useEffect(() => {
    setSavedThisSession(false);
  }, [value]);

  function handleSaveFavorite() {
    if (!selectedLatLng || !value.trim()) return;
    const short = value.split(",")[0].trim();
    addFavorite({ shortName: short, label: value.trim(), latLng: selectedLatLng })
      .then((updated) => {
        setFavorites(updated);
        setSavedThisSession(true);
      })
      .catch(() => {});
  }

  function handleRemoveFavorite(id: string) {
    removeFavorite(id)
      .then(setFavorites)
      .catch(() => {});
  }

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setIsSearching(true);
      void searchGeocodeSuggestions(value)
        .then((results) => {
          if (!cancelled) {
            setSuggestions(results);
            setIsOpen(results.length > 0);
            setSearchError(results.length === 0 ? "No results found. Try a different name." : null);
          }
        })
        .catch((err: unknown) => {
          if (!cancelled) {
            setSuggestions([]);
            setIsOpen(false);
            setSearchError(err instanceof Error ? err.message : "Search failed. Check your connection.");
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [value]);

  const isFavAlready = selectedLatLng
    ? favorites.some((f) => f.label === value.trim())
    : false;

  const [favOpen, setFavOpen] = useState(false);

  return (
    <View style={styles.routeAddressCard}>
      <View style={styles.routeAddressHeader}>
        <View style={styles.routeAddressTitle}>
          <Text style={pin === "green" ? styles.originDot : styles.destDot}>●</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <View style={styles.routeAddressActions}>
          <Pressable accessibilityRole="button" onPress={onUseCurrent} style={styles.currentLocationButton}>
            <Text style={styles.currentLocationButtonText}>Current</Text>
          </Pressable>
          {favorites.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setFavOpen((v) => !v)}
              style={[styles.favDropButton, favOpen ? styles.favDropButtonActive : null]}
            >
              <Text style={styles.favDropButtonText}>⭐ Favs {favOpen ? "▲" : "▼"}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Favorites dropdown */}
      {favOpen && favorites.length > 0 ? (
        <View style={styles.favDropPanel}>
          {favorites.map((fav) => (
            <Pressable
              key={fav.id}
              accessibilityRole="button"
              onPress={() => {
                onSelect({ id: fav.id, label: fav.label, latLng: fav.latLng });
                setFavOpen(false);
              }}
              onLongPress={() => handleRemoveFavorite(fav.id)}
              style={styles.favDropItem}
            >
              <Text style={styles.favDropItemText} numberOfLines={1}>⭐ {fav.shortName}</Text>
              <Text style={styles.favDropItemSub} numberOfLines={1}>{fav.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.routeInputShell}>
        <TextInput
          onChangeText={onChangeText}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onSubmitEditing={onFind}
          placeholder="Search a place..."
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
          style={styles.routeInput}
          value={value}
        />
        {isSearching || isLoading ? (
          <Text style={styles.routeInputSpinner}>...</Text>
        ) : selectedLatLng && value.trim() && !isFavAlready && !savedThisSession ? (
          <Pressable accessibilityRole="button" onPress={handleSaveFavorite} style={styles.saveLocButton}>
            <Text style={styles.saveLocButtonText}>⭐ Save</Text>
          </Pressable>
        ) : selectedLatLng && (isFavAlready || savedThisSession) ? (
          <Text style={styles.savedLocText}>⭐</Text>
        ) : null}
      </View>

      {!isOpen && searchError && value.trim().length >= 3 && !isSearching ? (
        <Text style={styles.searchErrorText}>{searchError}</Text>
      ) : null}

      {isOpen ? (
        <View style={styles.suggestionPanel}>
          <Text style={styles.suggestionPanelTitle}>Search results</Text>
          {suggestions.slice(0, 5).map((suggestion) => (
            <Pressable
              accessibilityRole="button"
              key={suggestion.id}
              onPress={() => {
                onSelect(suggestion);
                setSuggestions([]);
                setIsOpen(false);
              }}
              style={styles.suggestionItem}
            >
              <Text style={styles.suggestionMain}>{shortLocationName(suggestion.label)}</Text>
              <Text numberOfLines={2} style={styles.suggestionSub}>{suggestion.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function RouteMapPreview({
  destination,
  origin,
  selectedRoute
}: {
  destination: string;
  origin: string;
  selectedRoute: RouteAlternative | undefined;
}) {
  return (
    <View style={styles.mapPreview}>
      <View style={styles.mapHeader}>
        <View>
          <Text style={styles.mapTitle}>Route Preview</Text>
          <Text style={styles.mapSub}>
            {origin.trim() && destination.trim()
              ? `${origin.trim()} -> ${destination.trim()}`
              : "Enter origin and destination"}
          </Text>
        </View>
        {selectedRoute ? (
          <Text style={styles.mapRouteLabel}>{selectedRoute.label}</Text>
        ) : null}
      </View>
      <View style={styles.mapCanvas}>
        <View style={[styles.mapPin, styles.mapPinStart]} />
        <View style={styles.mapRouteLine} />
        <View style={[styles.mapPin, styles.mapPinEnd]} />
      </View>
      <Text style={styles.mapSub}>
        {selectedRoute
          ? `${selectedRoute.distanceKm.toFixed(2)} km · ${selectedRoute.durationMin} min · ${selectedRoute.note}`
          : "Calculate routes to choose the claim distance."}
      </Text>
    </View>
  );
}

function RouteAlternativeOption({
  onPress,
  route,
  selected
}: {
  onPress: () => void;
  route: RouteAlternative;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.routeOption, selected ? styles.routeOptionActive : null]}
    >
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.routeOptionTitle}>{route.label}</Text>
        <Text style={styles.routeOptionSub}>{route.note}</Text>
      </View>
      <Text
        style={[
          styles.routeOptionMetric,
          selected ? styles.routeOptionMetricActive : null
        ]}
      >
        {route.distanceKm.toFixed(2)} km
      </Text>
    </Pressable>
  );
}

function EvidenceCapture({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string | null;
}) {
  const { tier } = useSubscription();
  const canScan = canUseFeature(tier, "receipt_scan");

  function handleCameraPress() {
    if (!canScan) {
      Alert.alert(
        "PRO Feature",
        "Camera scanning requires a PRO subscription. Upgrade in Settings → Billing to unlock.",
        [{ text: "OK" }]
      );
      return;
    }
    void openEvidencePicker(label, "camera").then((uri) => {
      if (uri) onChange(uri);
    });
  }

  return (
    <View style={styles.evidenceBlock}>
      <Text style={styles.evidenceTitle}>{label}</Text>
      <View style={styles.evidenceCapture}>
        <EvidenceChoice
          icon={canScan ? "📷" : "🔒"}
          title="Scan Document"
          sub={canScan ? "Camera · auto edge detect · perspective fix" : "PRO feature — upgrade to unlock"}
          selected={value?.includes("camera")}
          onPress={handleCameraPress}
        />
        <EvidenceChoice
          icon="📎"
          title="Attach from Gallery"
          sub="JPEG · PNG · WebP · Max 5 MB"
          selected={value?.includes("gallery")}
          onPress={() =>
            void openEvidencePicker(label, "gallery").then((uri) => {
              if (uri) onChange(uri);
            })
          }
        />
        {value ? (
          <View style={styles.evidencePreview}>
            <Text style={styles.evidencePreviewText}>
              {value.startsWith("blob:") || value.startsWith("local://")
                ? "Photo attached · pending sync"
                : value}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange("")}
              style={styles.evidenceRemoveButton}
            >
              <Text style={styles.evidenceRemoveText}>Remove</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function EvidenceChoice({
  icon,
  onPress,
  selected,
  sub,
  title
}: {
  icon: string;
  onPress: () => void;
  selected?: boolean;
  sub: string;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.evidenceChoice, selected ? styles.evidenceSelected : null]}
    >
      <Text style={styles.evidenceChoiceIcon}>{icon}</Text>
      <View style={styles.evidenceChoiceBody}>
        <Text style={styles.evidenceChoiceTitle}>{title}</Text>
        <Text style={styles.evidenceChoiceSub}>{sub}</Text>
      </View>
      <Text style={styles.evidenceChoiceArrow}>›</Text>
    </Pressable>
  );
}

function Field({
  keyboardType,
  label,
  multiline,
  onChangeText,
  placeholder,
  value
}: {
  keyboardType?: "decimal-pad" | "default";
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={[styles.input, multiline ? styles.textarea : null]}
        value={value}
      />
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function tripTitle(trip: TripDraft) {
  if (trip.originText && trip.destinationText) {
    return `${trip.originText} -> ${trip.destinationText}`;
  }

  if (trip.calculationMode === "gps_tracking") {
    return "GPS Trip";
  }

  if (trip.calculationMode === "odometer") {
    return "Odometer Trip";
  }

  return "Planned Trip";
}

function getTripIcon(trip: TripDraft) {
  if (trip.calculationMode === "gps_tracking") {
    return "📍";
  }

  if (trip.distanceSource === "odometer_override") {
    return "📏";
  }

  return "🗺";
}

function getSourceBadge(trip: TripDraft) {
  if (trip.distanceSource === "gps") {
    return { bg: "#f0fdf4", color: "#16a34a", label: "GPS" };
  }

  if (trip.distanceSource === "odometer_override") {
    return { bg: "#fefce8", color: "#ca8a04", label: "Odometer" };
  }

  return { bg: "#eff6ff", color: "#2563eb", label: "Route" };
}

function sourceLabel(trip: TripDraft) {
  return getSourceBadge(trip).label;
}

function sortTrips(trips: TripDraft[], sort: TripSortKey) {
  return [...trips].sort((left, right) => {
    if (sort === "date_asc") {
      return left.startedAt.localeCompare(right.startedAt);
    }

    if (sort === "distance_desc") {
      return (right.finalDistanceM ?? 0) - (left.finalDistanceM ?? 0);
    }

    if (sort === "category") {
      return sourceLabel(left).localeCompare(sourceLabel(right));
    }

    return right.startedAt.localeCompare(left.startedAt);
  });
}

function tripSortLabel(value: TripSortKey) {
  return tripSortOptions.find((option) => option.value === value)?.label ?? "Newest";
}

function tripFilterSummary(
  statusFilter: TripStatusFilter,
  categoryFilter: TripCategoryFilter
) {
  const status = tripStatusFilters.find((option) => option.value === statusFilter)?.label ?? "All";
  const category = tripCategoryFilters.find((option) => option.value === categoryFilter)?.label ?? "All Types";

  if (statusFilter === "all" && categoryFilter === "all") {
    return "All";
  }

  if (statusFilter === "all") {
    return category;
  }

  if (categoryFilter === "all") {
    return status;
  }

  return `${status}, ${category}`;
}

function formatKm(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDate(iso: string | null) {
  if (!iso) {
    return "-";
  }

  return new Date(iso).toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    weekday: "short",
    year: "numeric"
  });
}

function formatTime(iso: string | null) {
  if (!iso) {
    return "";
  }

  return new Date(iso).toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeInput() {
  const now = new Date();

  return `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes()
  ).padStart(2, "0")}`;
}

async function geocodeAddress(query: string) {
  const results = await searchGeocodeSuggestions(query);
  const first = results[0];

  if (!first) {
    throw new Error("Location not found. Try a nearby landmark or city.");
  }

  return {
    label: first.label,
    latLng: first.latLng
  };
}

async function searchGeocodeSuggestions(query: string) {
  // On React Native, User-Agent is settable in fetch (unlike browsers).
  // We call Nominatim directly — no proxy needed on native.
  // On web, the proxy is used to avoid CORS.
  const isNative = Platform.OS !== "web";
  const baseUrl = getSyncBaseUrl();

  if (!isNative && baseUrl) {
    // Web: use the server-side proxy which sets User-Agent for us
    const url = `${baseUrl}/api/geocode?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Location search failed (${response.status})`);
    const { results } = (await response.json()) as {
      results: Array<{ place_id: number; display_name: string; lat: number; lon: number }>;
    };
    return results.map((r, i): GeocodeSuggestion => ({
      id: String(r.place_id ?? i),
      label: r.display_name,
      latLng: [r.lat, r.lon] as LatLng,
    }));
  }

  // Native (Android/iOS): call Nominatim directly with proper User-Agent
  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "6",
    countrycodes: "my",
    addressdetails: "0",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        "User-Agent": "myexpensio/1.0 (mileage-claim-saas; effort.myexpensio@gmail.com)",
        "Accept": "application/json",
      },
    }
  );
  if (!response.ok) throw new Error(`Geocode error ${response.status}`);
  const raw = (await response.json()) as Array<{
    display_name?: string; place_id?: number; lat?: string; lon?: string;
  }>;
  return raw
    .filter((r) => r.lat && r.lon)
    .map((r, i): GeocodeSuggestion => ({
      id: String(r.place_id ?? i),
      label: r.display_name ?? query,
      latLng: [Number(r.lat), Number(r.lon)] as LatLng,
    }));
}

async function fetchRouteAlternatives(origin: LatLng, destination: LatLng) {
  const coordinates = `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
  const params = new URLSearchParams({
    alternatives: "true",
    geometries: "geojson",
    overview: "full",
    steps: "false"
  });
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Route calculation failed. Please try again.");
  }

  const data = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: RouteMapRoute["geometry"];
      legs?: Array<{ summary?: string }>;
    }>;
  };

  const routes = data.routes ?? [];
  if (routes.length === 0) {
    throw new Error("No route found between those two points.");
  }

  return routes.slice(0, 3).map((route, index): RouteAlternative => {
    const label = index === 0 ? "Recommended" : index === 1 ? "Alternative 1" : "Alternative 2";
    const summary = route.legs?.[0]?.summary || label;

    return {
      distanceKm: Math.round((route.distance / 1000) * 100) / 100,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
      geometry: route.geometry,
      id: `route-${index}`,
      label,
      note: summary
    };
  });
}

/** Haversine distance in metres between two lat/lng points */
function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getCurrentLatLng(): Promise<LatLng> {
  // ── Native: use expo-location ─────────────────────────────────────────────
  if (Platform.OS !== "web") {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      throw new Error(
        "Location permission was denied. Grant location access in Settings."
      );
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return [loc.coords.latitude, loc.coords.longitude];
  }

  // ── Web: navigator.geolocation ────────────────────────────────────────────
  return new Promise<LatLng>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(
        new Error(
          "Current position is not available in this environment. Search or tap the map instead."
        )
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        reject(
          new Error(
            "Location permission was denied or unavailable. Search or tap the map instead."
          )
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 12000
      }
    );
  });
}

function formatLatLng(latLng: LatLng) {
  return `${latLng[0].toFixed(5)}, ${latLng[1].toFixed(5)}`;
}

function shortLocationName(label: string) {
  return label.split(",").slice(0, 2).join(",").trim();
}

async function reverseGeocode(latLng: LatLng): Promise<string> {
  const isNative = Platform.OS !== "web";
  const baseUrl = getSyncBaseUrl();

  if (!isNative && baseUrl) {
    const url = `${baseUrl}/api/geocode/reverse?lat=${latLng[0]}&lon=${latLng[1]}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? `${latLng[0].toFixed(5)}, ${latLng[1].toFixed(5)}`;
  }

  const params = new URLSearchParams({
    lat: String(latLng[0]),
    lon: String(latLng[1]),
    format: "json",
    zoom: "17",
    addressdetails: "0",
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
    {
      headers: {
        "User-Agent": "myexpensio/1.0 (mileage-claim-saas; effort.myexpensio@gmail.com)",
        "Accept": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error("Reverse geocode failed");
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? `${latLng[0].toFixed(5)}, ${latLng[1].toFixed(5)}`;
}

function confirmTripDelete(onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (window.confirm("Delete this trip?")) {
      onConfirm();
    }
    return;
  }

  Alert.alert("Delete trip?", "This removes the trip from this device.", [
    { style: "cancel", text: "Cancel" },
    { onPress: onConfirm, style: "destructive", text: "Delete" }
  ]);
}

async function openEvidencePicker(
  label: string,
  source: "camera" | "gallery"
): Promise<string | null> {
  if (Platform.OS !== "web") {
    // ── Native: real camera / gallery via expo-image-picker ──────────────
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ["images"],
      quality: 0.82,
      allowsEditing: false,
      base64: false,
      exif: false,
    };

    let result: ImagePicker.ImagePickerResult;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Camera permission required",
          "Please allow camera access in Settings to snap odometer readings."
        );
        return null;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Photo library permission required",
          "Please allow photo access in Settings to attach odometer images."
        );
        return null;
      }
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? "image/jpeg";
    const ext = mimeType === "image/png" ? "png" : "jpg";
    const filename = `odometer-${label.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.${ext}`;

    try {
      const dir = `${FileSystem.documentDirectory}odometer/`;
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
      }
      const destUri = `${dir}${filename}`;
      await FileSystem.copyAsync({ from: asset.uri, to: destUri });
      return destUri;
    } catch {
      return asset.uri; // fallback to temp URI
    }
  }

  const documentRef = (globalThis as typeof globalThis & {
    document?: Document;
  }).document;

  if (!documentRef) {
    return null;
  }

  return new Promise((resolve) => {
    const input = documentRef.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/jpg,image/png,image/webp";
    if (source === "camera") {
      input.setAttribute("capture", "environment");
    }
    input.style.display = "none";
    input.onchange = () => {
      const file = input.files?.[0] ?? null;
      input.remove();

      if (!file) {
        resolve(null);
        return;
      }

      if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
        resolve(null);
        return;
      }

      if (file.size > 5_242_880) {
        resolve(null);
        return;
      }

      resolve(URL.createObjectURL(file));
    };
    documentRef.body.appendChild(input);
    input.click();
  });
}

const styles = StyleSheet.create({
  page: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md
  },
  header: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: "900"
  },
  count: {
    color: "#94a3b8",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  activeBanner: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  activeGlow: {
    backgroundColor: "#dc2626",
    borderRadius: 5,
    height: 10,
    width: 10
  },
  activeBannerText: {
    color: "#dc2626",
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  bannerArrow: {
    color: "#dc2626",
    fontSize: 18,
    fontWeight: "900"
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  listToolbar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  listToolbarText: {
    color: colors.muted,
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  toolbarActions: {
    flexDirection: "row",
    flexShrink: 0,
    gap: 6
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
  tripAction: {
    alignItems: "center",
    borderRadius: 14,
    flexBasis: "48%",
    flexDirection: "row",
    flexGrow: 1,
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  tripAction_dark: {
    backgroundColor: "rgba(15,23,42,0.88)"
  },
  tripAction_amber: {
    backgroundColor: "rgba(202,138,4,0.82)"
  },
  tripAction_blue: {
    backgroundColor: "rgba(37,99,235,0.82)"
  },
  tripAction_star: {
    backgroundColor: "rgba(161,124,0,0.82)"
  },
  tripActionIcon: {
    color: colors.surface,
    fontSize: 18,
    width: 24
  },
  tripActionText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 240,
    justifyContent: "center",
    padding: spacing.lg
  },
  emptyCompact: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.lg
  },
  emptyIcon: {
    fontSize: 34
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  emptyCopy: {
    color: colors.muted,
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 280,
    textAlign: "center"
  },
  list: {
    gap: spacing.sm
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: 90
  },
  filterPanel: {
    backgroundColor: "rgba(248, 250, 252, 0.86)",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  filterLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0,
    paddingHorizontal: 4,
    textTransform: "uppercase"
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  filterChip: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderColor: "transparent",
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterChipText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800"
  },
  filterChipTextActive: {
    color: colors.onPrimary
  },
  card: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 86,
    padding: spacing.md
  },
  cardIcon: {
    fontSize: 22,
    width: 28
  },
  cardBody: {
    flex: 1,
    gap: 3,
    minWidth: 0
  },
  cardRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  cardTitle: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800"
  },
  cardMeta: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700"
  },
  cardFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  distanceText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  odoTag: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700"
  },
  cardArrow: {
    color: "#cbd5e1",
    fontSize: 18,
    fontWeight: "900"
  },
  sourceBadge: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "900"
  },
  draftBadge: {
    backgroundColor: "#fef2f2"
  },
  draftBadgeText: {
    color: "#dc2626"
  },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  sheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    maxHeight: "92%",
    maxWidth: 520,
    overflow: "hidden",
    width: "100%"
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
    padding: spacing.lg
  },
  modalHeaderActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  modalHeaderTitle: {
    flex: 1,
    minWidth: 0
  },
  resetButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: spacing.md
  },
  resetButtonText: {
    color: "#475569",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  modalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  modalSub: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    marginTop: 3
  },
  modalClose: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "900"
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  closeButtonText: {
    color: "#475569",
    fontSize: 16,
    fontWeight: "900",
    lineHeight: 18,
  },
  favPickWrap: {
    gap: 6,
  },
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg
  },
  modalScroll: {
    flex: 1
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
  optionGroupLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    textTransform: "uppercase"
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
  modalFooter: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    padding: spacing.lg
  },
  fieldRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  field: {
    flex: 1,
    gap: 6
  },
  label: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  textarea: {
    minHeight: 86,
    paddingTop: spacing.sm,
    textAlignVertical: "top"
  },
  routeAddressCard: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  routeAddressHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  routeAddressTitle: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  routeInputShell: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  routeInput: {
    color: colors.text,
    flex: 1,
    fontSize: typography.body,
    minHeight: 42
  },
  routeInputSpinner: {
    color: "#94a3b8",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  saveLocButton: {
    backgroundColor: "#fefce8",
    borderColor: "#fde047",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  saveLocButtonText: {
    color: "#854d0e",
    fontSize: 11,
    fontWeight: "800",
  },
  savedLocText: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
  routeAddressActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  favDropButton: {
    backgroundColor: "#fefce8",
    borderColor: "#fde047",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  favDropButtonActive: {
    backgroundColor: "#fde047",
  },
  favDropButtonText: {
    color: "#854d0e",
    fontSize: 11,
    fontWeight: "800",
  },
  favDropPanel: {
    backgroundColor: colors.surface,
    borderColor: "#fde047",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
    overflow: "hidden",
  },
  favDropItem: {
    borderBottomColor: "#fef9c3",
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  favDropItemText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  favDropItemSub: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 1,
  },
  favRow: { marginBottom: 0 },
  favRowContent: { gap: 0 },
  favChip: { display: "none" },
  favChipStar: { display: "none" },
  favChipText: { display: "none" },
  searchErrorText: {
    color: "#dc2626",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  suggestionPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 0,
    overflow: "hidden"
  },
  suggestionPanelTitle: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    textTransform: "uppercase"
  },
  suggestionItem: {
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  suggestionMain: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  suggestionSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 17
  },
  originDot: {
    color: "#16a34a",
    fontSize: 16,
    fontWeight: "900"
  },
  destDot: {
    color: "#dc2626",
    fontSize: 16,
    fontWeight: "900"
  },
  currentLocationButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#dbeafe",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 30,
    paddingHorizontal: 10
  },
  currentLocationButtonText: {
    color: "#2563eb",
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  errorBox: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    padding: spacing.md
  },
  errorText: {
    color: "#b91c1c",
    fontSize: typography.caption,
    fontWeight: "800",
    lineHeight: 18
  },
  vehicleRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  vehicleButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  vehicleButtonActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb"
  },
  vehicleIcon: {
    fontSize: 20
  },
  vehicleLabel: {
    color: "#374151",
    flex: 1,
    fontSize: typography.body,
    fontWeight: "700"
  },
  vehicleLabelActive: {
    color: "#1d4ed8",
    fontWeight: "900"
  },
  vehicleCheck: {
    color: "#1d4ed8",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  infoBox: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  infoText: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  calculateButton: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 10,
    justifyContent: "center",
    minHeight: 44
  },
  calculateButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  mapPreview: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  mapHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  mapTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  mapSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    lineHeight: 18
  },
  mapCanvas: {
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    borderColor: "#bae6fd",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    height: 96,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: spacing.lg
  },
  mapPin: {
    borderRadius: 10,
    height: 20,
    width: 20
  },
  mapPinStart: {
    backgroundColor: "#16a34a"
  },
  mapPinEnd: {
    backgroundColor: "#dc2626"
  },
  mapRouteLine: {
    backgroundColor: "#2563eb",
    flex: 1,
    height: 4,
    marginHorizontal: spacing.md
  },
  mapRouteLabel: {
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    color: "#1d4ed8",
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  routeOptions: {
    gap: spacing.sm
  },
  routeOptionsTitle: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  routeOption: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  routeOptionActive: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb"
  },
  routeOptionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  routeOptionSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  routeOptionMetric: {
    color: "#64748b",
    fontSize: typography.body,
    fontWeight: "900"
  },
  routeOptionMetricActive: {
    color: "#1d4ed8"
  },
  evidenceSection: {
    gap: spacing.md
  },
  evidenceBlock: {
    gap: spacing.sm
  },
  evidenceTitle: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  evidenceCapture: {
    gap: spacing.sm
  },
  evidenceChoice: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md
  },
  evidenceSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#22c55e"
  },
  evidenceChoiceIcon: {
    fontSize: 22,
    lineHeight: 26,
    textAlign: "center",
    width: 34
  },
  evidenceChoiceBody: {
    flex: 1
  },
  evidenceChoiceTitle: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  evidenceChoiceSub: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2
  },
  evidenceChoiceArrow: {
    color: "#94a3b8",
    fontSize: 22,
    fontWeight: "800"
  },
  evidencePreview: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  evidencePreviewText: {
    color: "#15803d",
    flex: 1,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  evidenceRemoveButton: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing.sm
  },
  evidenceRemoveText: {
    color: "#dc2626",
    fontSize: 10,
    fontWeight: "900"
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 10,
    minHeight: 48,
    justifyContent: "center"
  },
  saveButtonText: {
    color: colors.onPrimary,
    fontSize: typography.body,
    fontWeight: "900"
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  metric: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexBasis: "48%",
    gap: 2,
    padding: spacing.md
  },
  metricValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800"
  },
  stopButton: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center"
  },
  stopButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "900"
  },
  editActionRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  editSaveButton: {
    flex: 1
  },
  secondaryButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 44
  },
  secondaryButtonText: {
    color: "#475569",
    fontSize: typography.body,
    fontWeight: "900"
  },
  deleteTripButton: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44
  },
  deleteTripText: {
    color: "#be123c",
    fontSize: typography.body,
    fontWeight: "900"
  },
  totalBox: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md
  },
  totalLabel: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  totalValue: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  emptyHelp: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    textAlign: "center"
  },
  claimPicker: {
    backgroundColor: "#f8fafc",
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg
  },
  claimPickerTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  claimOption: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: spacing.md
  },
  claimOptionTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  claimOptionSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  disabled: {
    opacity: 0.45
  },
  // ── Odometer accordion ───────────────────────────────────────────────────
  odoFlow: {
    gap: spacing.sm
  },
  odoStep: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden"
  },
  odoStepDone: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4"
  },
  odoStepHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  odoStepBadge: {
    alignItems: "center",
    backgroundColor: "#e2e8f0",
    borderRadius: 999,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  odoStepBadgeText: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "900"
  },
  odoStepTitleWrap: {
    flex: 1,
    gap: 2
  },
  odoStepTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  odoStepIcon: {
    fontSize: 14
  },
  odoStepTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  odoStepCheck: {
    color: "#16a34a",
    fontSize: 14,
    fontWeight: "900"
  },
  odoStepSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  odoStepChevron: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "900"
  },
  odoStepBody: {
    borderTopColor: "#f1f5f9",
    borderTopWidth: 1,
    gap: spacing.md,
    padding: spacing.md
  },
  odoStepDoneBtn: {
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 8,
    justifyContent: "center",
    minHeight: 40
  },
  odoStepDoneBtnText: {
    color: colors.surface,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  odoSummary: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderColor: "#22c55e",
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
    padding: spacing.md
  },
  odoSummaryLabel: {
    color: "#15803d",
    fontSize: typography.caption,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  odoSummaryValue: {
    color: "#15803d",
    fontSize: 26,
    fontWeight: "900"
  },
  odoSummaryMath: {
    color: "#16a34a",
    fontSize: 11,
    fontWeight: "700"
  },
  // ── Fav Locations Manager ────────────────────────────────────────────────
  favMgrEmpty: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.lg
  },
  favMgrEmptyIcon: {
    fontSize: 34
  },
  favMgrEmptyTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  favMgrEmptyText: {
    color: colors.muted,
    fontSize: typography.caption,
    lineHeight: 18,
    maxWidth: 260,
    textAlign: "center"
  },
  favMgrRow: {
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1
  },
  favMgrItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  favMgrItemBody: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  favMgrItemName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800"
  },
  favMgrItemLabel: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  favMgrItemActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    flexShrink: 0
  },
  favMgrEditBtn: {
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  favMgrEditBtnText: {
    fontSize: 16
  },
  favMgrDeleteBtn: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderRadius: 8,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  favMgrDeleteBtnText: {
    fontSize: 16
  },
  favMgrEditWrap: {
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  favMgrEditInput: {
    backgroundColor: colors.surface,
    borderColor: "#2563eb",
    borderRadius: 8,
    borderWidth: 1.5,
    color: colors.text,
    fontSize: typography.body,
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  favMgrEditSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    paddingHorizontal: 2
  },
  favMgrEditActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  favMgrCancelBtn: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  favMgrCancelText: {
    color: "#475569",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  favMgrSaveBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 40
  },
  favMgrSaveText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "900"
  },
  favMgrAddCard: {
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md
  },
  favMgrAddTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  favMgrMapSearchWrap: {
    backgroundColor: "#f0f9ff",
    borderColor: "#bae6fd",
    borderRadius: 10,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm
  },
  favMgrMapSearchLabel: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "900"
  },
  favMgrMapWrap: {
    gap: 6
  },
  favMgrMapHint: {
    color: "#0369a1",
    fontSize: typography.caption,
    fontWeight: "700"
  },
  favMgrMapCoords: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "right"
  }
});
