'use client'
// apps/user/app/(app)/trips/start/page.tsx
// GPS Active Trip screen.
//
// Flow:
//   1. On mount → POST /api/trips (GPS_TRACKING) → get trip_id
//   2. Request Geolocation permission
//   3. watchPosition loop → queue points locally → flush to /api/trips/[id]/points every 30s
//   4. "Stop Trip" → flush remaining → POST /api/trips/[id]/stop → redirect to /trips/[id]
//   5. "Cancel" → DELETE trip (set status CANCELLED — not implemented in DB, just redirect)
//
// Offline resilience: points accumulate in local array; flush retries on reconnect.
// Browser Geolocation API only — no external SDK needed (zero cost).

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type GpsPoint = {
  seq:         number
  lat:         number
  lng:         number
  accuracy_m:  number
  recorded_at: string
}

type TrackingState =
  | 'init'           // creating trip row
  | 'requesting'     // asking for GPS permission
  | 'tracking'       // live GPS
  | 'stopping'       // flushing + calling /stop
  | 'denied'         // permission refused
  | 'error'          // unrecoverable

const FLUSH_INTERVAL_MS  = 30_000   // flush batch every 30 seconds
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout:            15_000,
  maximumAge:         5_000,
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function fmtKm(meters: number): string {
  return (meters / 1000).toFixed(2) + ' km'
}

function accuracyLabel(acc: number | null): { text: string; color: string } {
  if (acc === null) return { text: 'Acquiring…', color: '#94a3b8' }
  if (acc <= 10)    return { text: `Good (±${acc.toFixed(0)}m)`,  color: '#16a34a' }
  if (acc <= 30)    return { text: `Fair (±${acc.toFixed(0)}m)`,  color: '#d97706' }
  return              { text: `Weak (±${acc.toFixed(0)}m)`,  color: '#dc2626' }
}

export default function StartTripPage() {
  const router = useRouter()

  const [state,      setState]      = useState<TrackingState>('init')
  const [tripId,     setTripId]     = useState<string | null>(null)
  const [elapsed,    setElapsed]    = useState(0)
  const [pointCount, setPointCount] = useState(0)
  const [liveAccuracy, setLiveAccuracy] = useState<number | null>(null)
  const [approxDistance, setApproxDistance] = useState(0)
  const [statusMsg,  setStatusMsg]  = useState('')
  const [isOnline,   setIsOnline]   = useState(true)

  // Refs — mutable across renders without causing re-renders
  const pointsQueue  = useRef<GpsPoint[]>([])
  const seqRef       = useRef(0)
  const watchId      = useRef<number | null>(null)
  const flushTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickTimer    = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPoint    = useRef<{ lat: number; lng: number } | null>(null)
  const distanceRef  = useRef(0)

  // ── Haversine inline (for live distance display — no import in client) ──
  function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R  = 6_371_000
    const dL = ((lat2 - lat1) * Math.PI) / 180
    const dN = ((lng2 - lng1) * Math.PI) / 180
    const a  = Math.sin(dL / 2) ** 2 +
               Math.cos((lat1 * Math.PI) / 180) *
               Math.cos((lat2 * Math.PI) / 180) *
               Math.sin(dN / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }

  // ── Flush queue to server ─────────────────────────────────────────────
  const flush = useCallback(async (id: string) => {
    if (pointsQueue.current.length === 0) return
    const batch = [...pointsQueue.current]
    pointsQueue.current = []

    try {
      await fetch(`/api/trips/${id}/points`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ points: batch }),
      })
    } catch {
      // Network error — put points back at front of queue
      pointsQueue.current = [...batch, ...pointsQueue.current]
    }
  }, [])

  // ── Stop trip ─────────────────────────────────────────────────────────
  const stopTrip = useCallback(async () => {
    if (!tripId) return
    setState('stopping')
    setStatusMsg('Saving your trip…')

    // Stop watching
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
    if (flushTimer.current) clearInterval(flushTimer.current)
    if (tickTimer.current)  clearInterval(tickTimer.current)

    // Final flush
    await flush(tripId)

    // Finalize on server
    const res = await fetch(`/api/trips/${tripId}/stop`, { method: 'POST' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setStatusMsg(json.error?.message ?? 'Failed to save trip. Please try again.')
      setState('error')
      return
    }

    router.push(`/trips/${tripId}`)
  }, [tripId, flush, router])

  // ── Init: create trip row, then request GPS ───────────────────────────
  useEffect(() => {
    let cancelled = false

    async function init() {
      // 1. Create trip row
      const res = await fetch('/api/trips', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ calculation_mode: 'GPS_TRACKING' }),
      })

      if (!res.ok || cancelled) {
        setState('error')
        setStatusMsg('Failed to start trip. Please try again.')
        return
      }

      const { trip } = await res.json()
      if (cancelled) return
      setTripId(trip.id)
      setState('requesting')

      // 2. Request geolocation
      if (!navigator.geolocation) {
        setState('denied')
        setStatusMsg('Your browser does not support GPS tracking.')
        return
      }

      navigator.geolocation.getCurrentPosition(
        () => {
          if (cancelled) return
          setState('tracking')

          // Start elapsed timer
          tickTimer.current = setInterval(() => {
            setElapsed(e => e + 1)
          }, 1000)

          // Start GPS watch
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude: lat, longitude: lng, accuracy } = pos.coords
              seqRef.current += 1
              setLiveAccuracy(accuracy)

              // Accumulate local distance estimate
              if (prevPoint.current) {
                const d = haversine(prevPoint.current.lat, prevPoint.current.lng, lat, lng)
                distanceRef.current += d
                setApproxDistance(distanceRef.current)
              }
              prevPoint.current = { lat, lng }

              // Queue point
              pointsQueue.current.push({
                seq:         seqRef.current,
                lat,
                lng,
                accuracy_m:  accuracy,
                recorded_at: new Date().toISOString(),
              })
              setPointCount(seqRef.current)
            },
            (err) => {
              if (err.code === err.PERMISSION_DENIED) setState('denied')
              else { setState('error'); setStatusMsg('GPS signal lost. Please check your settings.') }
            },
            WATCH_OPTIONS
          )

          // Start periodic flush
          flushTimer.current = setInterval(() => {
            flush(trip.id)
          }, FLUSH_INTERVAL_MS)
        },
        (err) => {
          if (cancelled) return
          if (err.code === err.PERMISSION_DENIED) setState('denied')
          else { setState('error'); setStatusMsg('Could not access GPS.') }
        },
        { enableHighAccuracy: true, timeout: 10_000 }
      )
    }

    init()

    // Online / offline detection
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      cancelled = true
      if (watchId.current !== null)  navigator.geolocation.clearWatch(watchId.current)
      if (flushTimer.current)        clearInterval(flushTimer.current)
      if (tickTimer.current)         clearInterval(tickTimer.current)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const acc = accuracyLabel(liveAccuracy)

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* Offline banner */}
      {!isOnline && (
        <div style={S.offlineBanner}>
          📶 Offline — GPS points queued locally ({pointsQueue.current.length} pending)
        </div>
      )}

      {/* ── INIT ── */}
      {state === 'init' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>Starting trip…</p>
        </div>
      )}

      {/* ── REQUESTING ── */}
      {state === 'requesting' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>Requesting GPS permission…</p>
          <p style={S.subMsg}>Please allow location access when prompted.</p>
        </div>
      )}

      {/* ── DENIED ── */}
      {state === 'denied' && (
        <div style={S.center}>
          <div style={S.bigIcon}>📍</div>
          <p style={S.msg}>Location access denied</p>
          <p style={S.subMsg}>
            Please enable location access in your browser settings, then try again.
          </p>
          <button onClick={() => router.push('/trips')} style={S.btnSecondary}>
            Back to Trips
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state === 'error' && (
        <div style={S.center}>
          <div style={S.bigIcon}>⚠️</div>
          <p style={S.msg}>{statusMsg || 'Something went wrong'}</p>
          <button onClick={() => router.push('/trips')} style={S.btnSecondary}>
            Back to Trips
          </button>
        </div>
      )}

      {/* ── STOPPING ── */}
      {state === 'stopping' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>{statusMsg || 'Saving…'}</p>
        </div>
      )}

      {/* ── TRACKING ── */}
      {state === 'tracking' && (
        <>
          {/* Status pill */}
          <div style={S.statusPill}>
            <span style={S.statusDot} />
            Recording
          </div>

          {/* Big elapsed timer */}
          <div style={S.timerBlock}>
            <div style={S.timerValue}>{fmtDuration(elapsed)}</div>
            <div style={S.timerLabel}>elapsed</div>
          </div>

          {/* Stats row */}
          <div style={S.statsRow}>
            <div style={S.stat}>
              <div style={S.statValue}>{fmtKm(approxDistance)}</div>
              <div style={S.statLabel}>estimated</div>
            </div>
            <div style={S.statDivider} />
            <div style={S.stat}>
              <div style={S.statValue}>{pointCount}</div>
              <div style={S.statLabel}>GPS points</div>
            </div>
          </div>

          {/* Accuracy */}
          <div style={S.accuracyRow}>
            <span style={{ ...S.accuracyDot, backgroundColor: acc.color }} />
            <span style={{ ...S.accuracyText, color: acc.color }}>{acc.text}</span>
          </div>

          {/* Privacy note */}
          <p style={S.privacyNote}>
            📍 Location is only tracked while this screen is open.
          </p>

          {/* Actions */}
          <div style={S.actions}>
            <button onClick={stopTrip} style={S.btnStop}>
              ■ Stop Trip
            </button>
            <button
              onClick={() => router.push('/trips')}
              style={S.btnCancel}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            24,
    paddingTop:     24,
    minHeight:      'calc(100vh - 130px)',
    textAlign:      'center',
    fontFamily:     '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  offlineBanner: {
    width:           '100%',
    backgroundColor: '#fef3c7',
    border:          '1px solid #fcd34d',
    borderRadius:    8,
    padding:         '10px 14px',
    fontSize:        13,
    color:           '#92400e',
    fontWeight:      500,
  },
  center: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           12,
    paddingTop:    60,
  },
  spinner: {
    width:       40,
    height:      40,
    borderRadius:'50%',
    border:      '3px solid #e2e8f0',
    borderTop:   '3px solid #0f172a',
    animation:   'spin 0.8s linear infinite',
  },
  bigIcon: { fontSize: 48 },
  msg:     { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 },
  subMsg:  { fontSize: 13, color: '#64748b', margin: 0, maxWidth: 280, lineHeight: 1.6 },
  statusPill: {
    display:         'flex',
    alignItems:      'center',
    gap:             8,
    backgroundColor: '#fef2f2',
    border:          '1.5px solid #fecaca',
    borderRadius:    20,
    padding:         '6px 16px',
    fontSize:        13,
    fontWeight:      700,
    color:           '#dc2626',
  },
  statusDot: {
    width:           10,
    height:          10,
    borderRadius:    '50%',
    backgroundColor: '#dc2626',
    boxShadow:       '0 0 0 3px rgba(220,38,38,0.25)',
    animation:       'pulse 1.5s ease infinite',
  },
  timerBlock: { marginTop: 8 },
  timerValue: { fontSize: 64, fontWeight: 800, color: '#0f172a', lineHeight: 1, letterSpacing: '-2px' },
  timerLabel: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  statsRow: {
    display:         'flex',
    alignItems:      'center',
    gap:             0,
    backgroundColor: '#f8fafc',
    border:          '1px solid #e2e8f0',
    borderRadius:    12,
    overflow:        'hidden',
    width:           '100%',
    maxWidth:        280,
  },
  stat:       { flex: 1, padding: '16px 0' },
  statValue:  { fontSize: 22, fontWeight: 800, color: '#0f172a' },
  statLabel:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  statDivider:{ width: 1, backgroundColor: '#e2e8f0', alignSelf: 'stretch' },
  accuracyRow:{ display: 'flex', alignItems: 'center', gap: 6 },
  accuracyDot:{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  accuracyText:{ fontSize: 13, fontWeight: 500 },
  privacyNote:{ fontSize: 11, color: '#94a3b8', margin: 0 },
  actions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    width:         '100%',
    maxWidth:      320,
    marginTop:     8,
  },
  btnStop: {
    padding:         '16px',
    backgroundColor: '#dc2626',
    color:           '#fff',
    border:          'none',
    borderRadius:    12,
    fontSize:        17,
    fontWeight:      700,
    cursor:          'pointer',
    letterSpacing:   '0.5px',
  },
  btnCancel: {
    padding:         '12px',
    backgroundColor: 'transparent',
    color:           '#94a3b8',
    border:          '1px solid #e2e8f0',
    borderRadius:    12,
    fontSize:        14,
    cursor:          'pointer',
  },
  btnSecondary: {
    padding:         '12px 24px',
    backgroundColor: '#f1f5f9',
    color:           '#0f172a',
    border:          'none',
    borderRadius:    10,
    fontSize:        14,
    fontWeight:      600,
    cursor:          'pointer',
  },
}
