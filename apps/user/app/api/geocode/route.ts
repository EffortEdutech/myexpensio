// apps/user/app/api/geocode/route.ts
// GET /api/geocode?q=<address>
//
// Server-side proxy to Nominatim (OpenStreetMap geocoder).
// Runs server-side so we can set the required User-Agent header
// and avoid CORS issues from the browser.
//
// Nominatim usage policy:
//   - Must include meaningful User-Agent
//   - Max 1 request/second (enforced by client debounce, 400ms)
//   - No bulk geocoding
//   - Free, no API key
//
// Returns: [{ display_name, lat, lon, place_id }]

import { type NextRequest, NextResponse } from 'next/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 3) {
    return err('VALIDATION_ERROR', 'Query must be at least 3 characters.', 400)
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q',            q)
  url.searchParams.set('format',       'json')
  url.searchParams.set('limit',        '5')
  url.searchParams.set('countrycodes', 'my')          // Malaysia first
  url.searchParams.set('addressdetails', '0')

  try {
    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim policy: identify your app + contact
        'User-Agent':   'myexpensio/1.0 (mileage-claim-saas; effort.myexpensio@gmail.com)',
        'Accept':        'application/json',
        'Referer':       'https://myexpensio.vercel.app',
      },
      // Nominatim is fast — 5s timeout is generous
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      console.error('[GET /api/geocode] Nominatim error:', res.status, res.statusText)
      return err('UPSTREAM_ERROR', 'Geocoding service unavailable.', 502)
    }

    const data = await res.json() as Array<{
      place_id:     number
      display_name: string
      lat:          string
      lon:          string
      type:         string
    }>

    // Return only what the frontend needs
    const results = data.map(d => ({
      place_id:     d.place_id,
      display_name: d.display_name,
      lat:          parseFloat(d.lat),
      lon:          parseFloat(d.lon),
    }))

    return NextResponse.json({ results })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    console.error('[GET /api/geocode] fetch error:', msg)
    return err('SERVER_ERROR', 'Failed to reach geocoding service.', 500)
  }
}
