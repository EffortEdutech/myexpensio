// apps/user/lib/haversine.ts
// Pure Haversine implementation.
// Input:  array of {lat, lng} points
// Output: total distance in METERS
//
// Used by /api/trips/[id]/stop to compute gps_distance_m from trip_points.
// No external dependencies — zero cost, fully deterministic.

const EARTH_RADIUS_M = 6_371_000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Distance between two lat/lng points in meters */
export function haversineMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a))
}

/** Total path distance from an ordered array of points in meters */
export function totalDistanceMeters(
  points: Array<{ lat: number; lng: number }>
): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineMeters(
      points[i].lat,  points[i].lng,
      points[i + 1].lat, points[i + 1].lng
    )
  }
  return total
}
