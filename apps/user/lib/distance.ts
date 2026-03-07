// apps/user/lib/distance.ts
// Implements the LOCKED Doc 09 final_distance_m derivation.
// Called server-side before every trip finalization write.
// Returns the official distance + source, or throws on invalid input.

export type DistanceSource = 'GPS' | 'SELECTED_ROUTE' | 'ODOMETER_OVERRIDE'
export type OdometerMode   = 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE'

export type DistanceDerivationInput = {
  calculation_mode:           'GPS_TRACKING' | 'SELECTED_ROUTE'
  gps_distance_m?:            number | null
  selected_route_distance_m?: number | null
  odometer_mode:              OdometerMode
  odometer_distance_m?:       number | null
}

export type DistanceDerivationResult = {
  final_distance_m: number
  distance_source:  DistanceSource
}

/**
 * Derive final_distance_m and distance_source per Doc 09 locked rules.
 * Throws a descriptive string on validation failure — caller converts to 400.
 */
export function deriveDistance(
  input: DistanceDerivationInput
): DistanceDerivationResult {
  const {
    calculation_mode,
    gps_distance_m,
    selected_route_distance_m,
    odometer_mode,
    odometer_distance_m,
  } = input

  // ── Rule 1: OVERRIDE — odometer wins over everything ──────────────────
  if (odometer_mode === 'OVERRIDE') {
    if (!odometer_distance_m || odometer_distance_m <= 0) {
      throw new Error(
        'odometer_distance_m is required and must be > 0 when odometer_mode is OVERRIDE.'
      )
    }
    return { final_distance_m: odometer_distance_m, distance_source: 'ODOMETER_OVERRIDE' }
  }

  // ── Rule 2: SELECTED_ROUTE ─────────────────────────────────────────────
  if (calculation_mode === 'SELECTED_ROUTE') {
    if (!selected_route_distance_m || selected_route_distance_m <= 0) {
      throw new Error(
        'selected_route_distance_m is required and must be > 0 for SELECTED_ROUTE mode.'
      )
    }
    return { final_distance_m: selected_route_distance_m, distance_source: 'SELECTED_ROUTE' }
  }

  // ── Rule 3: GPS_TRACKING ───────────────────────────────────────────────
  if (calculation_mode === 'GPS_TRACKING') {
    if (!gps_distance_m || gps_distance_m <= 0) {
      throw new Error(
        'gps_distance_m is required and must be > 0 for GPS_TRACKING mode. ' +
        'Did the trip record any GPS points?'
      )
    }
    return { final_distance_m: gps_distance_m, distance_source: 'GPS' }
  }

  throw new Error(`Invalid calculation_mode: ${calculation_mode}`)
}

/** Display helper: meters → "12.34 km" */
export function fmtKm(meters: number | null | undefined): string {
  if (meters == null) return '—'
  return (meters / 1000).toFixed(2) + ' km'
}
