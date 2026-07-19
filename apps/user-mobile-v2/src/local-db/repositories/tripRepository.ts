import type {
  CreateTripInput,
  TripCalculationMode,
  TripDistanceSource,
  TripDraft,
  TripStatus,
  UpdateTripInput,
  VehicleType
} from "@/features/trips/types";
import type { SyncStatus } from "@/features/expenses/types";
import { getDatabase } from "@/local-db/database";
import { enqueueSyncItem } from "@/local-db/repositories/syncQueueRepository";
import { createId } from "@/utils/ids";
import { nowIso } from "@/utils/time";

type TripRow = {
  calculation_mode: TripCalculationMode | null;
  claim_id: string | null;
  created_at: string;
  deleted_at: string | null;
  destination_text: string | null;
  device_id: string;
  distance_source: TripDistanceSource | null;
  ended_at: string | null;
  final_distance_m: number | null;
  gps_distance_m: number | null;
  id: string;
  notes: string | null;
  odometer_distance_m: number | null;
  odometer_end_evidence_uri: string | null;
  odometer_mode: string | null;
  odometer_start_evidence_uri: string | null;
  origin_text: string | null;
  route_option_label: string | null;
  selected_route_distance_m: number | null;
  started_at: string;
  status: TripStatus;
  stopped_at: string | null;
  sync_status: SyncStatus;
  updated_at: string;
  vehicle_type: VehicleType | null;
};

export async function listTrips() {
  const database = await getDatabase();
  const rows = await database.getAllAsync<TripRow>(
    `SELECT *
      FROM trips
      WHERE deleted_at IS NULL
      ORDER BY started_at DESC;`
  );

  return rows.map(mapTripRow);
}

export async function getTrip(tripId: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<TripRow>(
    `SELECT *
      FROM trips
      WHERE id = ?
        AND deleted_at IS NULL;`,
    [tripId]
  );

  return row ? mapTripRow(row) : null;
}

export async function createTrip(input: CreateTripInput, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const distanceSource = getDistanceSource(input.calculationMode);
  const distanceM = input.distanceM ?? null;
  const isGpsDraft = input.calculationMode === "gps_tracking";
  const trip: TripDraft = {
    calculationMode: input.calculationMode,
    claimId: null,
    createdAt: timestamp,
    deletedAt: null,
    destinationText: input.destinationText ?? null,
    deviceId,
    distanceSource: isGpsDraft ? null : distanceSource,
    endedAt: isGpsDraft ? null : input.startedAt ?? timestamp,
    finalDistanceM: isGpsDraft ? null : distanceM,
    gpsDistanceM: input.calculationMode === "gps_tracking" ? distanceM : null,
    id: createId("trip"),
    notes: input.notes ?? null,
    odometerDistanceM: input.calculationMode === "odometer" ? distanceM : null,
    odometerEndEvidenceUri: input.endEvidenceUri ?? null,
    odometerMode: input.calculationMode === "odometer" ? "OVERRIDE" : null,
    odometerStartEvidenceUri: input.startEvidenceUri ?? null,
    originText: input.originText ?? null,
    routeOptionLabel: input.routeOptionLabel ?? null,
    selectedRouteDistanceM:
      input.calculationMode === "selected_route" ? distanceM : null,
    startedAt: input.startedAt ?? timestamp,
    status: isGpsDraft ? "draft" : "final",
    stoppedAt: isGpsDraft ? null : input.startedAt ?? timestamp,
    syncStatus: "pending",
    updatedAt: timestamp,
    vehicleType: input.vehicleType
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `INSERT INTO trips (
        id, claim_id, status, started_at, stopped_at, final_distance_m,
        distance_source, vehicle_type, sync_status, created_at, updated_at,
        deleted_at, device_id, calculation_mode, origin_text,
        destination_text, ended_at, odometer_mode, odometer_distance_m,
        selected_route_distance_m, gps_distance_m, notes,
        odometer_start_evidence_uri, odometer_end_evidence_uri,
        route_option_label
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        trip.id,
        trip.claimId,
        trip.status,
        trip.startedAt,
        trip.stoppedAt,
        trip.finalDistanceM,
        trip.distanceSource,
        trip.vehicleType,
        trip.syncStatus,
        trip.createdAt,
        trip.updatedAt,
        trip.deletedAt,
        trip.deviceId,
        trip.calculationMode,
        trip.originText,
        trip.destinationText,
        trip.endedAt,
        trip.odometerMode,
        trip.odometerDistanceM,
        trip.selectedRouteDistanceM,
        trip.gpsDistanceM,
        trip.notes,
        trip.odometerStartEvidenceUri,
        trip.odometerEndEvidenceUri,
        trip.routeOptionLabel
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "trip",
        entityId: trip.id,
        operation: "create",
        payload: JSON.stringify(trip)
      },
      database
    );
  });

  return trip;
}

export async function stopGpsTrip(tripId: string, distanceM: number, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE trips
        SET status = ?,
            stopped_at = ?,
            ended_at = ?,
            final_distance_m = ?,
            gps_distance_m = ?,
            distance_source = ?,
            sync_status = ?,
            updated_at = ?
        WHERE id = ?;`,
      [
        "final",
        timestamp,
        timestamp,
        distanceM,
        distanceM,
        "gps",
        "pending",
        timestamp,
        tripId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "trip",
        entityId: tripId,
        operation: "update",
        payload: JSON.stringify({ id: tripId, distanceM, deviceId, stoppedAt: timestamp })
      },
      database
    );
  });

  return getTrip(tripId);
}

export async function softDeleteTrip(tripId: string, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE trips
        SET sync_status = ?,
            deleted_at = ?,
            updated_at = ?
        WHERE id = ?
          AND deleted_at IS NULL;`,
      ["deleted", timestamp, timestamp, tripId]
    );

    await enqueueSyncItem(
      {
        entityType: "trip",
        entityId: tripId,
        operation: "delete",
        payload: JSON.stringify({
          id: tripId,
          deletedAt: timestamp,
          deviceId
        })
      },
      database
    );
  });

  return { deletedAt: timestamp, id: tripId };
}

export async function updateTrip(input: UpdateTripInput, deviceId: string) {
  const database = await getDatabase();
  const timestamp = nowIso();
  const existing = await getTrip(input.tripId);

  if (!existing || existing.status === "draft") {
    return null;
  }

  const distanceM = input.distanceM ?? existing.finalDistanceM;
  const updatedTrip: TripDraft = {
    ...existing,
    destinationText: input.destinationText ?? existing.destinationText,
    endedAt: input.startedAt ?? existing.endedAt,
    finalDistanceM: distanceM,
    notes: input.notes ?? existing.notes,
    odometerDistanceM:
      existing.calculationMode === "odometer"
        ? distanceM
        : existing.odometerDistanceM,
    odometerEndEvidenceUri: input.removeEndEvidence
      ? null
      : existing.odometerEndEvidenceUri,
    odometerStartEvidenceUri: input.removeStartEvidence
      ? null
      : existing.odometerStartEvidenceUri,
    originText: input.originText ?? existing.originText,
    routeOptionLabel: input.routeOptionLabel ?? existing.routeOptionLabel,
    selectedRouteDistanceM:
      existing.calculationMode === "selected_route"
        ? distanceM
        : existing.selectedRouteDistanceM,
    startedAt: input.startedAt ?? existing.startedAt,
    stoppedAt: input.startedAt ?? existing.stoppedAt,
    syncStatus: "pending",
    updatedAt: timestamp,
    vehicleType: input.vehicleType ?? existing.vehicleType
  };

  await database.withTransactionAsync(async () => {
    await database.runAsync(
      `UPDATE trips
        SET started_at = ?,
            stopped_at = ?,
            ended_at = ?,
            final_distance_m = ?,
            odometer_distance_m = ?,
            odometer_start_evidence_uri = ?,
            odometer_end_evidence_uri = ?,
            selected_route_distance_m = ?,
            origin_text = ?,
            destination_text = ?,
            vehicle_type = ?,
            route_option_label = ?,
            notes = ?,
            sync_status = 'pending',
            updated_at = ?
        WHERE id = ?
          AND status = 'final'
          AND deleted_at IS NULL;`,
      [
        updatedTrip.startedAt,
        updatedTrip.stoppedAt,
        updatedTrip.endedAt,
        updatedTrip.finalDistanceM,
        updatedTrip.odometerDistanceM,
        updatedTrip.odometerStartEvidenceUri,
        updatedTrip.odometerEndEvidenceUri,
        updatedTrip.selectedRouteDistanceM,
        updatedTrip.originText,
        updatedTrip.destinationText,
        updatedTrip.vehicleType,
        updatedTrip.routeOptionLabel,
        updatedTrip.notes,
        timestamp,
        input.tripId
      ]
    );

    await enqueueSyncItem(
      {
        entityType: "trip",
        entityId: input.tripId,
        operation: "update",
        payload: JSON.stringify({
          id: input.tripId,
          destinationText: updatedTrip.destinationText,
          distanceM: updatedTrip.finalDistanceM,
          notes: updatedTrip.notes,
          odometerEndEvidenceUri: updatedTrip.odometerEndEvidenceUri,
          odometerStartEvidenceUri: updatedTrip.odometerStartEvidenceUri,
          originText: updatedTrip.originText,
          routeOptionLabel: updatedTrip.routeOptionLabel,
          startedAt: updatedTrip.startedAt,
          updatedAt: timestamp,
          vehicleType: updatedTrip.vehicleType,
          deviceId
        })
      },
      database
    );
  });

  return updatedTrip;
}

function getDistanceSource(
  mode: TripCalculationMode
): TripDistanceSource | null {
  if (mode === "gps_tracking") {
    return "gps";
  }

  if (mode === "odometer") {
    return "odometer_override";
  }

  return "selected_route";
}

function mapTripRow(row: TripRow): TripDraft {
  return {
    calculationMode: row.calculation_mode ?? "selected_route",
    claimId: row.claim_id,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    destinationText: row.destination_text,
    deviceId: row.device_id,
    distanceSource: row.distance_source,
    endedAt: row.ended_at ?? row.stopped_at,
    finalDistanceM: row.final_distance_m,
    gpsDistanceM: row.gps_distance_m,
    id: row.id,
    notes: row.notes,
    odometerDistanceM: row.odometer_distance_m,
    odometerEndEvidenceUri: row.odometer_end_evidence_uri,
    odometerMode: row.odometer_mode,
    odometerStartEvidenceUri: row.odometer_start_evidence_uri,
    originText: row.origin_text,
    routeOptionLabel: row.route_option_label,
    selectedRouteDistanceM: row.selected_route_distance_m,
    startedAt: row.started_at,
    status: row.status,
    stoppedAt: row.stopped_at,
    syncStatus: row.sync_status,
    updatedAt: row.updated_at,
    vehicleType: row.vehicle_type ?? "car"
  };
}
