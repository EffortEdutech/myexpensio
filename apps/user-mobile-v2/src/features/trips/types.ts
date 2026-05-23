import type { SyncStatus } from "@/features/expenses/types";

export type TripStatus = "draft" | "final";
export type TripCalculationMode = "gps_tracking" | "selected_route" | "odometer";
export type TripDistanceSource = "gps" | "selected_route" | "odometer_override";
export type VehicleType = "car" | "motorcycle";

export type TripDraft = {
  calculationMode: TripCalculationMode;
  claimId: string | null;
  createdAt: string;
  deletedAt: string | null;
  destinationText: string | null;
  deviceId: string;
  distanceSource: TripDistanceSource | null;
  endedAt: string | null;
  finalDistanceM: number | null;
  gpsDistanceM: number | null;
  id: string;
  notes: string | null;
  odometerDistanceM: number | null;
  odometerEndEvidenceUri: string | null;
  odometerMode: string | null;
  odometerStartEvidenceUri: string | null;
  originText: string | null;
  routeOptionLabel: string | null;
  selectedRouteDistanceM: number | null;
  startedAt: string;
  status: TripStatus;
  stoppedAt: string | null;
  syncStatus: SyncStatus;
  updatedAt: string;
  vehicleType: VehicleType;
};

export type CreateTripInput = {
  calculationMode: TripCalculationMode;
  destinationText?: string | null;
  distanceM?: number | null;
  endEvidenceUri?: string | null;
  notes?: string | null;
  originText?: string | null;
  routeOptionLabel?: string | null;
  startedAt?: string;
  startEvidenceUri?: string | null;
  vehicleType: VehicleType;
};
