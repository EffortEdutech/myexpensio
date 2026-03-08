// apps/user/app/api/reverse-geocode/route.ts
// GET /api/reverse-geocode?lat=<lat>&lng=<lng>
//
// Server-side proxy to Nominatim reverse geocoder.
// Converts a lat/lng coordinate into a human-readable address.
// Runs server-side to satisfy Nominatim's User-Agent policy.
//
// Returns: { display_name, short_name, lat, lon }

import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  if (!lat || !lng) {
    return err('VALIDATION_ERROR', 'lat and lng are required.', 400)
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  if (isNaN(latNum) || isNaN(lngNum)) {
    return err('VALIDATION_ERROR', 'lat and lng must be valid numbers.', 400)
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse')
  url.searchParams.set('lat',    lat)
  url.searchParams.set('lon',    lng)
  url.searchParams.set('format', 'json')
  url.searchParams.set('zoom',   '16')    // street-level detail
  url.searchParams.set('addressdetails', '1')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'myexpensio/1.0 (mileage-claim-saas; effort.myexpensio@gmail.com)',
        'Accept':     'application/json',
        'Referer':    'https://myexpensio.vercel.app',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.error('[GET /api/reverse-geocode] Nominatim error:', res.status)
      return err('UPSTREAM_ERROR', 'Reverse geocoding service unavailable.', 502)
    }

    const data = await res.json() as {
      place_id?:    number
      display_name?: string
      lat?:          string
      lon?:          string
      address?: {
        road?:       string
        suburb?:     string
        city?:       string
        town?:       string
        state?:      string
        country?:    string
      }
      error?: string
    }

    if (data.error || !data.display_name) {
      return err('NOT_FOUND', 'No address found for these coordinates.', 404)
    }

    // Build a short name: "Road, Suburb, City" — more readable than full display_name
    const a = data.address ?? {}
    const parts = [
      a.road,
      a.suburb,
      a.city ?? a.town,
      a.state,
    ].filter(Boolean)

    const short_name = parts.length > 0
      ? parts.slice(0, 3).join(', ')
      : data.display_name.split(',').slice(0, 2).join(',').trim()

    return NextResponse.json({
      display_name: data.display_name,
      short_name,
      lat: latNum,
      lon: lngNum,
    })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[GET /api/reverse-geocode] fetch error:', msg)
    return err('SERVER_ERROR', 'Failed to reach geocoding service.', 500)
  }
}
