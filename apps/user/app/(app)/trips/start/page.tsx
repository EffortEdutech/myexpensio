'use client'
// apps/user/app/(app)/trips/start/page.tsx
//
// TWO FLOWS:
//
// A) NEW TRIP  (?resume param absent)
//   1. Request GPS permission → get first fix → show accuracy
//   2. User taps "Start Trip" → POST /api/trips → begin tracking
//   3. Trip row is NEVER created unless GPS ready + user confirms
//
// B) RESUME  (?resume=<trip_id>)
//   1. Load existing DRAFT trip from server
//   2. Request GPS → get first fix → go straight to tracking
//   3. No new trip row created — uses existing trip_id

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type GpsPoint = {
  seq:         number
  lat:         number
  lng:         number
  accuracy_m:  number
  recorded_at: string
}

type TrackingState =
  | 'requesting'   // getting GPS permission + first fix
  | 'ready'        // GPS acquired, awaiting user confirm (NEW flow only)
  | 'creating'     // POSTing /api/trips (NEW flow only)
  | 'tracking'     // live recording
  | 'stopping'     // flushing + calling /stop
  | 'denied'       // GPS permission refused
  | 'error'

const FLUSH_INTERVAL_MS = 30_000
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

function accuracyLabel(acc: number | null): { text: string; color: string; good: boolean } {
  if (acc === null) return { text: 'Acquiring…',                 color: '#94a3b8', good: false }
  if (acc <= 10)    return { text: `Good (±${acc.toFixed(0)}m)`, color: '#16a34a', good: true  }
  if (acc <= 30)    return { text: `Fair (±${acc.toFixed(0)}m)`, color: '#d97706', good: true  }
  return              { text: `Weak (±${acc.toFixed(0)}m)`, color: '#dc2626', good: false }
}

export default function StartTripPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const resumeId     = searchParams.get('resume') // null = new trip

  const [state,          setState]          = useState<TrackingState>('requesting')
  const [tripId,         setTripId]         = useState<string | null>(resumeId)
  const [elapsed,        setElapsed]        = useState(0)
  const [pointCount,     setPointCount]     = useState(0)
  const [liveAccuracy,   setLiveAccuracy]   = useState<number | null>(null)
  const [approxDistance, setApproxDistance] = useState(0)
  const [statusMsg,      setStatusMsg]      = useState('')
  const [isOnline,       setIsOnline]       = useState(true)

  const pointsQueue = useRef<GpsPoint[]>([])
  const seqRef      = useRef(0)
  const watchId     = useRef<number | null>(null)
  const preWatchId  = useRef<number | null>(null)
  const flushTimer  = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPoint   = useRef<{ lat: number; lng: number } | null>(null)
  const distanceRef = useRef(0)
  const firstPosRef = useRef<GeolocationPosition | null>(null)

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

  // ── Flush queue to server ──────────────────────────────────────────────
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
      pointsQueue.current = [...batch, ...pointsQueue.current]
    }
  }, [])

  // ── Stop trip ──────────────────────────────────────────────────────────
  const stopTrip = useCallback(async () => {
    if (!tripId) return
    setState('stopping')
    setStatusMsg('Saving your trip…')
    if (watchId.current !== null)  navigator.geolocation.clearWatch(watchId.current)
    if (flushTimer.current)        clearInterval(flushTimer.current)
    if (tickTimer.current)         clearInterval(tickTimer.current)
    await flush(tripId)
    const res = await fetch(`/api/trips/${tripId}/stop`, { method: 'POST' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setStatusMsg(json.error?.message ?? 'Failed to save trip. Please try again.')
      setState('error')
      return
    }
    router.push(`/trips/${tripId}`)
  }, [tripId, flush, router])

  // ── Begin live tracking (called after trip_id is confirmed) ───────────
  const beginTracking = useCallback((id: string, firstPos: GeolocationPosition) => {
    setState('tracking')
    tickTimer.current = setInterval(() => setElapsed(e => e + 1), 1000)

    const { latitude: lat, longitude: lng, accuracy } = firstPos.coords
    seqRef.current = 1
    prevPoint.current = { lat, lng }
    setLiveAccuracy(accuracy)
    pointsQueue.current.push({
      seq: 1, lat, lng,
      accuracy_m:  accuracy,
      recorded_at: new Date(firstPos.timestamp).toISOString(),
    })
    setPointCount(1)

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords
        seqRef.current += 1
        setLiveAccuracy(acc)
        if (prevPoint.current) {
          const d = haversine(prevPoint.current.lat, prevPoint.current.lng, latitude, longitude)
          distanceRef.current += d
          setApproxDistance(distanceRef.current)
        }
        prevPoint.current = { lat: latitude, lng: longitude }
        pointsQueue.current.push({
          seq:         seqRef.current,
          lat:         latitude,
          lng:         longitude,
          accuracy_m:  acc,
          recorded_at: new Date(pos.timestamp).toISOString(),
        })
        setPointCount(seqRef.current)
      },
      (posErr) => {
        if (posErr.code === posErr.PERMISSION_DENIED) setState('denied')
        else { setState('error'); setStatusMsg('GPS signal lost.') }
      },
      WATCH_OPTIONS
    )

    flushTimer.current = setInterval(() => flush(id), FLUSH_INTERVAL_MS)
  }, [flush])

  // ── NEW TRIP: user confirms → create trip row → begin tracking ─────────
  const confirmStart = useCallback(async () => {
    if (!firstPosRef.current) return
    setState('creating')
    setStatusMsg('Starting trip…')

    if (preWatchId.current !== null) {
      navigator.geolocation.clearWatch(preWatchId.current)
      preWatchId.current = null
    }

    const res = await fetch('/api/trips', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ calculation_mode: 'GPS_TRACKING' }),
    })

    if (!res.ok) {
      setStatusMsg('Failed to start trip. Please try again.')
      setState('error')
      return
    }

    const { trip } = await res.json()
    setTripId(trip.id)
    beginTracking(trip.id, firstPosRef.current)
  }, [beginTracking])

  // ── Cancel before tracking (no trip row exists yet) ────────────────────
  const cancelBeforeStart = useCallback(() => {
    if (preWatchId.current !== null) {
      navigator.geolocation.clearWatch(preWatchId.current)
      preWatchId.current = null
    }
    router.push('/trips')
  }, [router])

  // ── RESUME: go back to trip list (trip still in DB as DRAFT) ──────────
  const leaveResume = useCallback(() => {
    router.push('/trips')
  }, [router])

  // ── Init: request GPS, get first fix ──────────────────────────────────
  useEffect(() => {
    let cancelled = false

    if (!navigator.geolocation) {
      setState('denied')
      setStatusMsg('Your browser does not support GPS tracking.')
      return
    }

    preWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return
        firstPosRef.current = pos
        setLiveAccuracy(pos.coords.accuracy)

        if (resumeId) {
          // RESUME: once we have a fix, go straight to tracking
          // Stop pre-watcher, begin tracking with existing trip_id
          if (preWatchId.current !== null) {
            navigator.geolocation.clearWatch(preWatchId.current)
            preWatchId.current = null
          }
          beginTracking(resumeId, pos)
        } else {
          // NEW: show ready screen, wait for user confirm
          setState(prev => prev === 'requesting' ? 'ready' : prev)
        }
      },
      (posErr) => {
        if (cancelled) return
        if (posErr.code === posErr.PERMISSION_DENIED) setState('denied')
        else { setState('error'); setStatusMsg('Could not access GPS. Check your device settings.') }
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    )

    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      cancelled = true
      if (preWatchId.current !== null) { navigator.geolocation.clearWatch(preWatchId.current); preWatchId.current = null }
      if (watchId.current !== null)    navigator.geolocation.clearWatch(watchId.current)
      if (flushTimer.current)          clearInterval(flushTimer.current)
      if (tickTimer.current)           clearInterval(tickTimer.current)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const acc = accuracyLabel(liveAccuracy)

  return (
    <div style={S.page}>

      {!isOnline && (
        <div style={S.offlineBanner}>
          📶 Offline — GPS points queued locally ({pointsQueue.current.length} pending)
        </div>
      )}

      {/* REQUESTING — waiting for GPS fix */}
      {state === 'requesting' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>{resumeId ? 'Re-acquiring GPS…' : 'Acquiring GPS…'}</p>
          <p style={S.subMsg}>Please allow location access when prompted.</p>
          <button onClick={resumeId ? leaveResume : cancelBeforeStart} style={S.btnSecondary}>
            Cancel
          </button>
        </div>
      )}

      {/* READY — GPS locked, user must confirm (NEW flow only) */}
      {state === 'ready' && (
        <div style={S.center}>
          <div style={S.bigIcon}>📍</div>
          <p style={S.msg}>GPS Ready</p>
          <div style={{ ...S.accuracyBadge, borderColor: acc.color, color: acc.color }}>
            <span style={{ ...S.accuracyDot, backgroundColor: acc.color }} />
            {acc.text}
          </div>
          {!acc.good && (
            <p style={S.subMsg}>Signal is weak. You can wait for better signal or proceed anyway.</p>
          )}
          <p style={S.subMsg}>Trip recording starts only after you tap Start Trip.</p>
          <div style={S.actions}>
            <button onClick={confirmStart} style={S.btnStart}>▶ Start Trip</button>
            <button onClick={cancelBeforeStart} style={S.btnCancel}>Cancel</button>
          </div>
        </div>
      )}

      {/* CREATING — POSTing trip row */}
      {state === 'creating' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>{statusMsg}</p>
        </div>
      )}

      {/* TRACKING — live recording */}
      {state === 'tracking' && (
        <>
          <div style={S.statusPill}>
            <span style={S.statusDot} />
            {resumeId ? 'Resumed · Recording' : 'Recording'}
          </div>
          <div style={S.timerBlock}>
            <div style={S.timerValue}>{fmtDuration(elapsed)}</div>
            <div style={S.timerLabel}>elapsed</div>
          </div>
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
          <div style={S.accuracyRow}>
            <span style={{ ...S.accuracyDot, backgroundColor: acc.color }} />
            <span style={{ ...S.accuracyText, color: acc.color }}>{acc.text}</span>
          </div>
          <p style={S.privacyNote}>📍 Location is only tracked while this screen is open.</p>
          <div style={S.actions}>
            <button onClick={stopTrip} style={S.btnStop}>■ Stop Trip</button>
          </div>
        </>
      )}

      {/* STOPPING */}
      {state === 'stopping' && (
        <div style={S.center}>
          <div style={S.spinner} />
          <p style={S.msg}>{statusMsg || 'Saving…'}</p>
        </div>
      )}

      {/* DENIED */}
      {state === 'denied' && (
        <div style={S.center}>
          <div style={S.bigIcon}>📍</div>
          <p style={S.msg}>Location access denied</p>
          <p style={S.subMsg}>Enable location access in your browser or device settings, then try again.</p>
          <button onClick={() => router.push('/trips')} style={S.btnSecondary}>Back to Trips</button>
        </div>
      )}

      {/* ERROR */}
      {state === 'error' && (
        <div style={S.center}>
          <div style={S.bigIcon}>⚠️</div>
          <p style={S.msg}>{statusMsg || 'Something went wrong'}</p>
          <button onClick={() => router.push('/trips')} style={S.btnSecondary}>Back to Trips</button>
        </div>
      )}

    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:          { display:'flex', flexDirection:'column', alignItems:'center', gap:24, paddingTop:24, minHeight:'calc(100vh - 130px)', textAlign:'center', fontFamily:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  offlineBanner: { width:'100%', backgroundColor:'#fef3c7', border:'1px solid #fcd34d', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#92400e', fontWeight:500 },
  center:        { display:'flex', flexDirection:'column', alignItems:'center', gap:14, paddingTop:60 },
  spinner:       { width:40, height:40, borderRadius:'50%', border:'3px solid #e2e8f0', borderTop:'3px solid #0f172a', animation:'spin 0.8s linear infinite' },
  bigIcon:       { fontSize:48 },
  msg:           { fontSize:18, fontWeight:700, color:'#0f172a', margin:0 },
  subMsg:        { fontSize:13, color:'#64748b', margin:0, maxWidth:280, lineHeight:1.6 },
  accuracyBadge: { display:'flex', alignItems:'center', gap:6, border:'1.5px solid', borderRadius:20, padding:'5px 14px', fontSize:13, fontWeight:600 },
  accuracyRow:   { display:'flex', alignItems:'center', gap:6 },
  accuracyDot:   { width:8, height:8, borderRadius:'50%', flexShrink:0, display:'inline-block' },
  accuracyText:  { fontSize:13, fontWeight:500 },
  statusPill:    { display:'flex', alignItems:'center', gap:8, backgroundColor:'#fef2f2', border:'1.5px solid #fecaca', borderRadius:20, padding:'6px 16px', fontSize:13, fontWeight:700, color:'#dc2626' },
  statusDot:     { width:10, height:10, borderRadius:'50%', backgroundColor:'#dc2626', boxShadow:'0 0 0 3px rgba(220,38,38,0.25)', animation:'pulse 1.5s ease infinite' },
  timerBlock:    { marginTop:8 },
  timerValue:    { fontSize:64, fontWeight:800, color:'#0f172a', lineHeight:1, letterSpacing:'-2px' },
  timerLabel:    { fontSize:13, color:'#94a3b8', marginTop:4 },
  statsRow:      { display:'flex', alignItems:'center', backgroundColor:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, overflow:'hidden', width:'100%', maxWidth:280 },
  stat:          { flex:1, padding:'16px 0' },
  statValue:     { fontSize:22, fontWeight:800, color:'#0f172a' },
  statLabel:     { fontSize:11, color:'#94a3b8', marginTop:2 },
  statDivider:   { width:1, backgroundColor:'#e2e8f0', alignSelf:'stretch' },
  privacyNote:   { fontSize:11, color:'#94a3b8', margin:0 },
  actions:       { display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:320, marginTop:8 },
  btnStart:      { padding:'16px', backgroundColor:'#16a34a', color:'#fff', border:'none', borderRadius:12, fontSize:17, fontWeight:700, cursor:'pointer', letterSpacing:'0.5px' },
  btnStop:       { padding:'16px', backgroundColor:'#dc2626', color:'#fff', border:'none', borderRadius:12, fontSize:17, fontWeight:700, cursor:'pointer', letterSpacing:'0.5px' },
  btnCancel:     { padding:'12px', backgroundColor:'transparent', color:'#94a3b8', border:'1px solid #e2e8f0', borderRadius:12, fontSize:14, cursor:'pointer' },
  btnSecondary:  { padding:'12px 24px', backgroundColor:'#f1f5f9', color:'#0f172a', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
}
