import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { DatePickerField } from "@/components/DatePickerField";
import type { ClaimDraft } from "@/features/claims/types";
import {
  RouteMap,
  type LatLng,
  type RouteMapRoute
} from "@/features/trips/components/RouteMap";
import type {
  CreateTripInput,
  TripCalculationMode,
  TripDraft,
  VehicleType
} from "@/features/trips/types";
import type { ClaimRates } from "@/state/settingsStore";
import { colors, spacing, typography } from "@/theme/tokens";

type TripsScreenProps = {
  claims: ClaimDraft[];
  isCreatingTrip: boolean;
  isLoading: boolean;
  isStoppingTrip: boolean;
  onAddMileageToClaim: (input: {
    amountCents: number;
    claim: ClaimDraft;
    itemDate: string;
    title: string;
    trip: TripDraft;
  }) => void;
  onCreateTrip: (input: CreateTripInput) => Promise<TripDraft>;
  onStopGpsTrip: (input: { distanceM: number; tripId: string }) => Promise<void>;
  rates: ClaimRates;
  trips: TripDraft[];
};

type TripFormMode = "route" | "odometer" | "gps" | null;

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

export function TripsScreen({
  claims,
  isCreatingTrip,
  isLoading,
  isStoppingTrip,
  onAddMileageToClaim,
  onCreateTrip,
  onStopGpsTrip,
  rates,
  trips
}: TripsScreenProps) {
  const [formMode, setFormMode] = useState<TripFormMode>(null);
  const [selectedTrip, setSelectedTrip] = useState<TripDraft | null>(null);
  const activeGpsTrip = trips.find(
    (trip) => trip.status === "draft" && trip.calculationMode === "gps_tracking"
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
            GPS trip in progress - tap to return
          </Text>
          <Text style={styles.bannerArrow}>{">"}</Text>
        </Pressable>
      ) : null}

      <View style={styles.actionStack}>
        <TripActionButton
          icon={activeGpsTrip ? "🔴" : "▶"}
          label={activeGpsTrip ? "Return to Tracker" : "Start GPS Trip"}
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
          icon="📏"
          label="Odometer Trip"
          onPress={() => setFormMode("odometer")}
          tone="amber"
        />
        <TripActionButton
          icon="📐"
          label="Mileage Calculator"
          onPress={() => setFormMode("route")}
          tone="blue"
        />
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
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
        <View style={styles.list}>
          {trips.map((trip) => (
            <TripCard key={trip.id} onPress={() => setSelectedTrip(trip)} trip={trip} />
          ))}
        </View>
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
        isStoppingTrip={isStoppingTrip}
        onAddMileageToClaim={onAddMileageToClaim}
        onClose={() => setSelectedTrip(null)}
        onStopGpsTrip={onStopGpsTrip}
        rates={rates}
        trip={selectedTrip}
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
  tone: "amber" | "blue" | "dark";
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
  const [startEvidence, setStartEvidence] = useState<string | null>(null);
  const [endEvidence, setEndEvidence] = useState<string | null>(null);
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
  const valid =
    isGps || (mode === "route" ? Boolean(selectedRoute) : hasBaseRouteInput);
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
          : Math.round((selectedRoute?.distanceKm ?? distance) * 1000),
        endEvidenceUri: endEvidence,
        notes:
          [
            notes.trim(),
            selectedRoute ? `Route option: ${selectedRoute.label}` : ""
          ]
            .filter(Boolean)
            .join("\n") || null,
        originText: origin.trim() || null,
        routeOptionLabel: selectedRoute?.label ?? null,
        startedAt,
        startEvidenceUri: startEvidence,
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
    setStartEvidence(null);
    setEndEvidence(null);
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
            <View>
              <Text style={styles.modalTitle}>{title}</Text>
              <Text style={styles.modalSub}>
                {isGps
                  ? "Start a draft trip and stop it when you arrive."
                  : "Record route, distance, and vehicle type for mileage claims."}
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
              <Pressable accessibilityRole="button" onPress={onClose}>
                <Text style={styles.modalClose}>X</Text>
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalBody}>
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
                  <>
                    <Field
                      label="Origin"
                      onChangeText={setOrigin}
                      placeholder="e.g. Ayer Keroh, Melaka"
                      value={origin}
                    />
                    <Field
                      label="Destination"
                      onChangeText={setDestination}
                      placeholder="e.g. Putrajaya, Selangor"
                      value={destination}
                    />
                    <Field
                      keyboardType="decimal-pad"
                      label="Odometer Distance (km) *"
                      onChangeText={(value) => {
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          setDistanceKm(value);
                        }
                      }}
                      placeholder="e.g. 52.40"
                      value={distanceKm}
                    />
                  </>
                )}
                {mode === "odometer" ? (
                  <View style={styles.evidenceSection}>
                    <EvidenceCapture
                      label="Start Reading"
                      onChange={setStartEvidence}
                      value={startEvidence}
                    />
                    <EvidenceCapture
                      label="End Reading"
                      onChange={setEndEvidence}
                      value={endEvidence}
                    />
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  GPS permissions and live points will use native device APIs in
                  the production build. This local-first sprint creates the
                  resumable draft trip and lets you stop it with a final
                  distance.
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
  isStoppingTrip,
  onAddMileageToClaim,
  onClose,
  onStopGpsTrip,
  rates,
  trip
}: {
  claims: ClaimDraft[];
  isStoppingTrip: boolean;
  onAddMileageToClaim: (input: {
    amountCents: number;
    claim: ClaimDraft;
    itemDate: string;
    title: string;
    trip: TripDraft;
  }) => void;
  onClose: () => void;
  onStopGpsTrip: (input: { distanceM: number; tripId: string }) => Promise<void>;
  rates: ClaimRates;
  trip: TripDraft | null;
}) {
  const [stopDistanceKm, setStopDistanceKm] = useState("");
  const [claimPickerOpen, setClaimPickerOpen] = useState(false);

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

          <ScrollView contentContainerStyle={styles.modalBody}>
            <View style={styles.detailGrid}>
              <Metric label="Status" value={trip.status === "draft" ? "In Progress" : "Final"} />
              <Metric label="Distance" value={finalDistanceM > 0 ? formatKm(finalDistanceM) : "-"} />
              <Metric label="Source" value={sourceLabel(trip)} />
              <Metric label="Rate" value={`MYR ${safeRate.toFixed(2)}/km`} />
            </View>

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
                  {trip.odometerStartEvidenceUri ? "Start attached" : "Start missing"}{" "}
                  / {trip.odometerEndEvidenceUri ? "End attached" : "End missing"}
                </Text>
              </View>
            ) : null}

            {trip.status === "draft" ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  Stop this GPS trip by entering the final distance captured by
                  the tracker.
                </Text>
                <Field
                  keyboardType="decimal-pad"
                  label="Final GPS distance (km)"
                  onChangeText={setStopDistanceKm}
                  placeholder="e.g. 12.40"
                  value={stopDistanceKm}
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

function RouteAddressField({
  isLoading,
  label,
  onChangeText,
  onFind,
  onSelect,
  onUseCurrent,
  pin,
  value
}: {
  isLoading: boolean;
  label: string;
  onChangeText: (value: string) => void;
  onFind: () => void;
  onSelect: (suggestion: GeocodeSuggestion) => void;
  onUseCurrent: () => void;
  pin: "green" | "red";
  value: string;
}) {
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setIsOpen(false);
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
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSuggestions([]);
            setIsOpen(false);
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

  return (
    <View style={styles.routeAddressCard}>
      <View style={styles.routeAddressHeader}>
        <View style={styles.routeAddressTitle}>
          <Text style={pin === "green" ? styles.originDot : styles.destDot}>
            ●
          </Text>
          <Text style={styles.label}>{label}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onUseCurrent}
          style={styles.currentLocationButton}
        >
          <Text style={styles.currentLocationButtonText}>
            Use Current Position
          </Text>
        </Pressable>
      </View>

      <View style={styles.routeInputShell}>
        <TextInput
          onChangeText={onChangeText}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          onSubmitEditing={onFind}
          placeholder="Search or tap map..."
          placeholderTextColor="#94a3b8"
          returnKeyType="search"
          style={styles.routeInput}
          value={value}
        />
        {isSearching || isLoading ? (
          <Text style={styles.routeInputSpinner}>...</Text>
        ) : null}
      </View>

      {isOpen ? (
        <View style={styles.suggestionPanel}>
          <Text style={styles.suggestionPanelTitle}>Search results</Text>
          {suggestions.slice(0, 4).map((suggestion) => (
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
              <Text style={styles.suggestionMain}>
                {shortLocationName(suggestion.label)}
              </Text>
              <Text numberOfLines={2} style={styles.suggestionSub}>
                {suggestion.label}
              </Text>
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
  return (
    <View style={styles.evidenceBlock}>
      <Text style={styles.evidenceTitle}>Camera {label}</Text>
      <EvidenceChoice
        icon="Camera"
        label="Take Photo"
        onPress={() => onChange(`${label} camera photo pending upload`)}
        selected={value?.includes("camera")}
        sub="Camera · auto edge detect · perspective fix"
      />
      <EvidenceChoice
        icon={label.startsWith("Start") ? "Start" : "End"}
        label={label.startsWith("Start") ? "Start" : "End"}
        onPress={() => onChange(`${label} gallery image pending upload`)}
        selected={value?.includes("gallery")}
        sub="JPEG · PNG · WebP · Max 5 MB"
      />
    </View>
  );
}

function EvidenceChoice({
  icon,
  label,
  onPress,
  selected,
  sub
}: {
  icon: string;
  label: string;
  onPress: () => void;
  selected?: boolean;
  sub: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.evidenceChoice, selected ? styles.evidenceSelected : null]}
    >
      <Text style={styles.evidenceChoiceIcon}>{icon}</Text>
      <View style={styles.evidenceChoiceBody}>
        <Text style={styles.evidenceChoiceTitle}>{label}</Text>
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
  const params = new URLSearchParams({
    countrycodes: "my",
    format: "jsonv2",
    limit: "5",
    q: query
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json"
      }
    }
  );

  if (!response.ok) {
    throw new Error("Location search failed. Please try a more specific place.");
  }

  const results = (await response.json()) as Array<{
    display_name?: string;
    place_id?: number;
    lat?: string;
    lon?: string;
  }>;

  return results
    .filter((result) => result.lat && result.lon)
    .map((result, index): GeocodeSuggestion => ({
      id: String(result.place_id ?? `${result.lat}-${result.lon}-${index}`),
      label: result.display_name ?? query,
      latLng: [Number(result.lat), Number(result.lon)] as LatLng
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

function getCurrentLatLng() {
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

const styles = StyleSheet.create({
  page: {
    gap: spacing.md
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
  actionStack: {
    alignItems: "stretch",
    gap: spacing.sm
  },
  tripAction: {
    alignItems: "center",
    borderRadius: 24,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.lg
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
  modalBody: {
    gap: spacing.md,
    padding: spacing.lg
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
  evidenceChoice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 62,
    paddingHorizontal: spacing.md
  },
  evidenceSelected: {
    backgroundColor: "#f0fdf4",
    borderColor: "#22c55e"
  },
  evidenceChoiceIcon: {
    color: "#0f172a",
    fontSize: typography.caption,
    fontWeight: "900",
    width: 54
  },
  evidenceChoiceBody: {
    flex: 1,
    gap: 2
  },
  evidenceChoiceTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  evidenceChoiceSub: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700"
  },
  evidenceChoiceArrow: {
    color: "#94a3b8",
    fontSize: 18,
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
  }
});
