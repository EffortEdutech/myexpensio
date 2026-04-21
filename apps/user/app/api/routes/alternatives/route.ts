import { createClient } from '@/lib/supabase/server'
import { getActiveOrg } from '@/lib/org'
import { type NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import {
  incrementUsageCounter,
  limitForCounter,
  loadTierAndEntitlements,
  periodKeyForCurrentMonth,
  readUsageCounters,
} from '@/lib/usage-limits'

type OsrmRoute = {
  distance: number
  duration: number
  geometry: { type: 'LineString'; coordinates: [number, number][] }
  legs: Array<{ summary: string; steps: unknown[] }>
}

type RouteAlternative = {
  route_id: string
  distance_m: number
  duration_s: number
  summary: string
  geometry: { type: 'LineString'; coordinates: [number, number][] }
}

const OSRM_PROFILE: Record<string, string> = {
  DRIVING: 'driving',
  CYCLING: 'cycling',
  WALKING: 'foot',
}

function err(code: string, message: string, status: number, details?: object) {
  return NextResponse.json({ error: { code, message, ...(details ? { details } : {}) } }, { status })
}

function hashCoord(lat: number, lng: number): string {
  return createHash('sha256').update(`${lat.toFixed(4)},${lng.toFixed(4)}`).digest('hex').slice(0, 16)
}

function routeLabel(index: number, distanceM: number): string {
  const labels = ['Fastest route', 'Alternative route', 'Scenic route']
  return labels[index] ?? `Route ${index + 1} (${(distanceM / 1000).toFixed(1)} km)`
}

async function fetchOsrmRoutes(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  profile: string,
): Promise<RouteAlternative[]> {
  const coords = `${originLng},${originLat};${destLng},${destLat}`
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson&alternatives=3&steps=false`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'myexpensio/1.0 (effort.myexpensio@gmail.com)' },
    signal: AbortSignal.timeout(10_000),
  })

  if (!res.ok) throw new Error(`OSRM ${res.status}: ${res.statusText}`)

  const json = (await res.json()) as { code: string; routes?: OsrmRoute[] }
  if (json.code !== 'Ok' || !json.routes?.length) throw new Error(`OSRM returned code: ${json.code}`)

  return json.routes.map((r, i) => ({
    route_id: `osrm_${i}`,
    distance_m: Math.round(r.distance),
    duration_s: Math.round(r.duration),
    summary: r.legs[0]?.summary?.trim() || routeLabel(i, r.distance),
    geometry: r.geometry,
  }))
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const org = await getActiveOrg()
  if (!org) return err('NO_ORG', 'No organisation found.', 400)

  const body = await request.json().catch(() => ({})) as {
    origin_text?: string
    origin_lat?: number
    origin_lng?: number
    destination_text?: string
    destination_lat?: number
    destination_lng?: number
    travel_mode?: string
  }

  const {
    origin_text,
    origin_lat,
    origin_lng,
    destination_text,
    destination_lat,
    destination_lng,
    travel_mode = 'DRIVING',
  } = body

  if (!origin_text || !destination_text) {
    return err('VALIDATION_ERROR', 'origin_text and destination_text are required.', 400)
  }

  if (origin_lat == null || origin_lng == null || destination_lat == null || destination_lng == null) {
    return err('VALIDATION_ERROR', 'Coordinates required: origin_lat/lng, destination_lat/lng.', 400)
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = ['SUPER_ADMIN', 'SUPPORT'].includes(callerProfile?.role ?? '')
  const { entitlements } = await loadTierAndEntitlements(supabase, org.org_id, isAdmin)
  const routesLimit = limitForCounter(entitlements, 'routes_calls')

  const profile = OSRM_PROFILE[travel_mode] ?? 'driving'
  const origin_hash = hashCoord(origin_lat, origin_lng)
  const dest_hash = hashCoord(destination_lat, destination_lng)

  const { data: cached } = await supabase
    .from('routes_cache')
    .select('response_payload')
    .eq('origin_hash', origin_hash)
    .eq('destination_hash', dest_hash)
    .eq('travel_mode', travel_mode)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const periodKey = periodKeyForCurrentMonth()
  const counters = await readUsageCounters(supabase, org.org_id, periodKey)
  const currentUsage = counters.routes_calls

  if (cached?.response_payload) {
    return NextResponse.json({
      cached: true,
      alternatives: cached.response_payload,
      usage: {
        routes_used: currentUsage,
        routes_limit: routesLimit,
        limit_label: entitlements.limit_label,
        limit_preset: entitlements.limit_preset,
      },
    })
  }

  if (routesLimit !== null && currentUsage >= routesLimit) {
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10)

    return err(
      'LIMIT_REACHED',
      `You've reached your route calculation limit${entitlements.limit_label ? ` (${entitlements.limit_label})` : ''}.`,
      429,
      {
        limit: routesLimit,
        used: currentUsage,
        period_end: periodEnd,
        label: entitlements.limit_label,
        preset: entitlements.limit_preset,
      },
    )
  }

  let alternatives: RouteAlternative[]
  try {
    alternatives = await fetchOsrmRoutes(origin_lat, origin_lng, destination_lat, destination_lng, profile)
  } catch (e: unknown) {
    console.error('[POST /api/routes/alternatives] OSRM:', (e as Error).message)
    return err('UPSTREAM_ERROR', 'Routing service unavailable. Please try again.', 502)
  }

  let updatedUsage = currentUsage
  try {
    updatedUsage = await incrementUsageCounter(supabase, org.org_id, 'routes_calls', periodKey)
  } catch (e: unknown) {
    console.error('[POST /api/routes/alternatives] usage update:', e)
    return err('SERVER_ERROR', 'Failed to record route calculation usage.', 500)
  }

  await supabase.from('routes_cache').insert({
    origin_hash,
    destination_hash: dest_hash,
    travel_mode,
    request_payload: { origin_text, destination_text, origin_lat, origin_lng, destination_lat, destination_lng },
    response_payload: alternatives,
    expires_at: new Date(Date.now() + 86_400_000).toISOString(),
  })

  return NextResponse.json({
    cached: false,
    alternatives,
    usage: {
      routes_used: updatedUsage,
      routes_limit: routesLimit,
      limit_label: entitlements.limit_label,
      limit_preset: entitlements.limit_preset,
    },
  })
}
