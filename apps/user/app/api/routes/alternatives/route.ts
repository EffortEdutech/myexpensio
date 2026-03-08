// apps/user/app/api/routes/alternatives/route.ts
// POST /api/routes/alternatives
//
// Returns real route alternatives via OSRM (OpenStreetMap routing).
// OSRM public demo: router.project-osrm.org — free, no API key.
//
// Request body:
//   origin_text        string  — human-readable label (stored on trip)
//   origin_lat         number  — geocoded latitude
//   origin_lng         number  — geocoded longitude
//   destination_text   string  — human-readable label
//   destination_lat    number  — geocoded latitude
//   destination_lng    number  — geocoded longitude
//   travel_mode?       string  — 'DRIVING' (default)
//
// Response alternatives include GeoJSON geometry for Leaflet map drawing.
// Gating: FREE = 2/month (server-side), ADMIN bypass, PRO bypass.

import { createClient }                  from '@/lib/supabase/server'
import { getActiveOrg }                  from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'
import { createHash }                    from 'crypto'

type OsrmRoute = {
  distance: number
  duration: number
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  legs:     Array<{ summary: string; steps: unknown[] }>
}

type RouteAlternative = {
  route_id:   string
  distance_m: number
  duration_s: number
  summary:    string
  geometry:   { type: 'LineString'; coordinates: [number, number][] }
}

const OSRM_PROFILE: Record<string, string> = {
  DRIVING: 'driving', CYCLING: 'cycling', WALKING: 'foot',
}

function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status }
  )
}

function hashCoord(lat: number, lng: number): string {
  return createHash('sha256')
    .update(`${lat.toFixed(4)},${lng.toFixed(4)}`)
    .digest('hex').slice(0, 16)
}

function routeLabel(index: number, distanceM: number): string {
  const labels = ['Fastest route', 'Alternative route', 'Scenic route']
  return labels[index] ?? `Route ${index + 1} (${(distanceM / 1000).toFixed(1)} km)`
}

async function fetchOsrmRoutes(
  originLat: number, originLng: number,
  destLat:   number, destLng:   number,
  profile:   string,
): Promise<RouteAlternative[]> {
  // OSRM uses lng,lat order (reversed from standard)
  const coords = `${originLng},${originLat};${destLng},${destLat}`
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}`
            + `?overview=full&geometries=geojson&alternatives=3&steps=false`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'myexpensio/1.0 (effort.myexpensio@gmail.com)' },
    signal:  AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`OSRM ${res.status}: ${res.statusText}`)

  const json = await res.json() as { code: string; routes?: OsrmRoute[] }
  if (json.code !== 'Ok' || !json.routes?.length) {
    throw new Error(`OSRM returned code: ${json.code}`)
  }

  return json.routes.map((r, i) => ({
    route_id:   `osrm_${i}`,
    distance_m: Math.round(r.distance),
    duration_s: Math.round(r.duration),
    summary:    r.legs[0]?.summary?.trim() || routeLabel(i, r.distance),
    geometry:   r.geometry,
  }))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    origin_text?:      string;  origin_lat?:  number;  origin_lng?:  number
    destination_text?: string;  destination_lat?: number; destination_lng?: number
    travel_mode?:      string
  }

  const {
    origin_text, origin_lat, origin_lng,
    destination_text, destination_lat, destination_lng,
    travel_mode = 'DRIVING',
  } = body

  if (!origin_text || !destination_text)
    return err('VALIDATION_ERROR', 'origin_text and destination_text are required.', 400)
  if (origin_lat == null || origin_lng == null || destination_lat == null || destination_lng == null)
    return err('VALIDATION_ERROR', 'Coordinates required: origin_lat/lng, destination_lat/lng.', 400)

  const profile     = OSRM_PROFILE[travel_mode] ?? 'driving'
  const origin_hash = hashCoord(origin_lat, origin_lng)
  const dest_hash   = hashCoord(destination_lat, destination_lng)

  // ADMIN bypass
  const { data: callerProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = callerProfile?.role === 'ADMIN'

  // Cache check — no quota consumed on hit
  const { data: cached } = await supabase
    .from('routes_cache')
    .select('response_payload')
    .eq('origin_hash',      origin_hash)
    .eq('destination_hash', dest_hash)
    .eq('travel_mode',      travel_mode)
    .gt('expires_at',       new Date().toISOString())
    .order('created_at',    { ascending: false })
    .limit(1).maybeSingle()

  if (cached?.response_payload) {
    const usage = await getUsage(supabase, org.org_id, isAdmin)
    return NextResponse.json({ cached: true, alternatives: cached.response_payload, usage })
  }

  // Free tier gate
  if (!isAdmin) {
    const { data: allowed, error: limitErr } = await supabase
      .rpc('increment_routes_usage', { p_org_id: org.org_id })

    if (limitErr) {
      console.error('[POST /api/routes/alternatives] increment_routes_usage:', limitErr.message)
      return err('SERVER_ERROR', 'Failed to check usage limits.', 500)
    }

    if (allowed === false) {
      const periodEnd = new Date(
        new Date().getFullYear(), new Date().getMonth() + 1, 0
      ).toISOString().slice(0, 10)
      return err('LIMIT_REACHED',
        "You've used your 2 free route calculations for this month.",
        429, { limit: 2, used: 2, period_end: periodEnd })
    }
  }

  // Call OSRM
  let alternatives: RouteAlternative[]
  try {
    alternatives = await fetchOsrmRoutes(
      origin_lat, origin_lng, destination_lat, destination_lng, profile
    )
  } catch (e: unknown) {
    console.error('[POST /api/routes/alternatives] OSRM:', (e as Error).message)
    return err('UPSTREAM_ERROR', 'Routing service unavailable. Please try again.', 502)
  }

  // Cache 24h
  await supabase.from('routes_cache').insert({
    origin_hash, destination_hash: dest_hash, travel_mode,
    request_payload:  { origin_text, destination_text, origin_lat, origin_lng, destination_lat, destination_lng },
    response_payload: alternatives,
    expires_at:       new Date(Date.now() + 86_400_000).toISOString(),
  })

  const usage = await getUsage(supabase, org.org_id, isAdmin)
  return NextResponse.json({ cached: false, alternatives, usage })
}

async function getUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  org_id: string, isAdmin: boolean,
) {
  const key = new Date().toISOString().slice(0, 7) + '-01'
  const { data } = await supabase
    .from('usage_counters').select('routes_calls')
    .eq('org_id', org_id).eq('period_start', key).maybeSingle()
  return { routes_used: data?.routes_calls ?? 0, routes_limit: isAdmin ? null : 2 }
}
