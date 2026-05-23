import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateTripInput, UpdateTripInput } from "@/features/trips/types";
import { tripQueryKeys } from "@/features/trips/hooks/useTrips";
import {
  createTrip,
  softDeleteTrip,
  stopGpsTrip,
  updateTrip
} from "@/local-db/repositories/tripRepository";
import { useDeviceStore } from "@/state/deviceStore";
import { syncQueryKeys } from "@/sync/hooks/usePendingSyncItems";
import { syncSummaryQueryKey } from "@/sync/hooks/useSyncQueueSummary";

function useInvalidateTrips() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: tripQueryKeys.list });
    void queryClient.invalidateQueries({ queryKey: ["trips"] });
    void queryClient.invalidateQueries({ queryKey: syncQueryKeys.pendingItems });
    void queryClient.invalidateQueries({ queryKey: syncSummaryQueryKey });
  };
}

export function useCreateTrip() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTrips();

  return useMutation({
    mutationFn: (input: CreateTripInput) => createTrip(input, deviceId),
    onSuccess: invalidate
  });
}

export function useStopGpsTrip() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTrips();

  return useMutation({
    mutationFn: (input: { distanceM: number; tripId: string }) =>
      stopGpsTrip(input.tripId, input.distanceM, deviceId),
    onSuccess: invalidate
  });
}

export function useSoftDeleteTrip() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTrips();

  return useMutation({
    mutationFn: (tripId: string) => softDeleteTrip(tripId, deviceId),
    onSuccess: invalidate
  });
}

export function useUpdateTrip() {
  const deviceId = useDeviceStore((state) => state.deviceId);
  const invalidate = useInvalidateTrips();

  return useMutation({
    mutationFn: (input: UpdateTripInput) => updateTrip(input, deviceId),
    onSuccess: invalidate
  });
}
