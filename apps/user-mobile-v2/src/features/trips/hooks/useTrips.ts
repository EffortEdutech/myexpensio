import { useQuery } from "@tanstack/react-query";

import { getTrip, listTrips } from "@/local-db/repositories/tripRepository";

export const tripQueryKeys = {
  detail: (tripId: string | null) => ["trips", "detail", tripId] as const,
  list: ["trips", "list"] as const
};

export function useTrips() {
  return useQuery({
    queryFn: listTrips,
    queryKey: tripQueryKeys.list
  });
}

export function useTrip(tripId: string | null) {
  return useQuery({
    enabled: Boolean(tripId),
    queryFn: () => (tripId ? getTrip(tripId) : Promise.resolve(null)),
    queryKey: tripQueryKeys.detail(tripId)
  });
}
