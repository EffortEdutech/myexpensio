'use client'
// apps/user/app/(app)/dev/gps-sim/page.tsx
// ⚠️  DEV-ONLY — GPS Simulator for laptop testing.
//     Remove this route (or add middleware guard) before production.
//
// What it does:
//   - Patches navigator.geolocation with a fake watchPosition
//   - Replays a pre-baked Kuala Lumpur route (KLCC → KL Sentral, ~5.8 km)
//   - Emits one GPS point every [speed] seconds, simulating a real drive
//   - Creates a real GPS_TRACKING trip via /api/trips
//   - Posts real points to /api/trips/[id]/points in batches
//   - Stops and finalises via /api/trips/[id]/stop
//   - Redirects to /trips/[id] so you can verify the full trip detail page
//
// Speed modes:
//   Slow   → 1 point / 4s  (like a real drive, ~28 min total)
//   Normal → 1 point / 2s  (~14 min)
//   Fast   → 1 point / 0.5s (~3.5 min — best for quick testing)
//   Turbo  → 1 point / 0.1s (~28 sec — instant result)

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Pre-baked KL Route: KLCC → KL Sentral (28 waypoints, ~5.8 km) ──────────
// Coordinates follow Jalan Ampang → Jalan P. Ramlee → Jalan Sultan Ismail
// → Jalan Maharajalela → KL Sentral area.
// Slight lat/lng jitter added to each point for realistic GPS scatter.

const KL_ROUTE_WAYPOINTS: Array<{ lat: number; lng: number }> = [
  { lat: 3.15790, lng: 101.71210 }, // 01 KLCC / Petronas Towers
  { lat: 3.15720, lng: 101.71105 }, // 02 Jalan Ampang
  { lat: 3.15648, lng: 101.70998 }, // 03
  { lat: 3.15570, lng: 101.70888 }, // 04 Jalan P. Ramlee junction
  { lat: 3.15488, lng: 101.70775 }, // 05
  { lat: 3.15402, lng: 101.70660 }, // 06 Jalan Sultan Ismail
  { lat: 3.15315, lng: 101.70548 }, // 07
  { lat: 3.15228, lng: 101.70435 }, // 08
  { lat: 3.15138, lng: 101.70322 }, // 09 Near Bukit Bintang
  { lat: 3.15045, lng: 101.70208 }, // 10
  { lat: 3.14952, lng: 101.70092 }, // 11
  { lat: 3.14858, lng: 101.69978 }, // 12 Jalan Imbi
  { lat: 3.14762, lng: 101.69862 }, // 13
  { lat: 3.14665, lng: 101.69745 }, // 14
  { lat: 3.14568, lng: 101.69628 }, // 15 Jalan Maharajalela
  { lat: 3.14470, lng: 101.69512 }, // 16
  { lat: 3.14372, lng: 101.69395 }, // 17
  { lat: 3.14272, lng: 101.69278 }, // 18
  { lat: 3.14172, lng: 101.69162 }, // 19
  { lat: 3.14070, lng: 101.69048 }, // 20
  { lat: 3.13968, lng: 101.68935 }, // 21 Approaching KL Sentral
  { lat: 3.13865, lng: 101.68822 }, // 22
  { lat: 3.13762, lng: 101.68712 }, // 23
  { lat: 3.13658, lng: 101.68602 }, // 24
  { lat: 3.13555, lng: 101.68495 }, // 25
  { lat: 3.13452, lng: 101.68390 }, // 26
  { lat: 3.13352, lng: 101.68288 }, // 27
  { lat: 3.13258, lng: 101.68190 }, // 28 KL Sentral
]

// Add realistic GPS jitter (±5–15m scatter)
function jitter(val: number, rangeDeg = 0.00008): number {
  return val + (Math.random() - 0.5) * rangeDeg
}

function buildRoute() {
  return KL_ROUTE_WAYPOINTS.map(p => ({
    lat: jitter(p.lat),
    lng: jitter(p.lng),
    accuracy: 6 + Math.random() * 12,   // 6–18m accuracy
  }))
}

// ── Speed presets ────────────────────────────────────────────────────────────

const SPEEDS = [
  { label: 'Slow',   ms: 4000, desc: '~2 min' },
  { label: 'Normal', ms: 2000, desc: '~1 min' },
  { label: 'Fast',   ms:  500, desc: '~15 sec' },
  { label: 'Turbo',  ms:  100, desc: '~3 sec' },
]

// ── Haversine (inline — no import needed in client component) ────────────────

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6_371_000
  const dL = ((lat2 - lat1) * Math.PI) / 180
  const dN = ((lng2 - lng1) * Math.PI) / 180
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos((lat1 * Math.PI) / 180) *
             Math.cos((lat2 * Math.PI) / 180) *
             Math.sin(dN / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// ── Component ────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'creating' | 'simulating' | 'stopping' | 'done' | 'error'

function fmtKm(m: number) { return (m / 1000).toFixed(3) + ' km' }

export default function GpsSimPage() {
  const router = useRouter()

  const [phase,       setPhase]       = useState<Phase>('idle')
  const [speedIdx,    setSpeedIdx]    = useState(2)          // default: Fast
  const [tripId,      setTripId]      = useState<string | null>(null)
  const [pointIdx,    setPointIdx]    = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [distM,       setDistM]       = useState(0)
  const [currentPos,  setCurrentPos]  = useState<{ lat: number; lng: number } | null>(null)
  const [log,         setLog]         = useState<string[]>([])
  const [errMsg,      setErrMsg]      = useState<string | null>(null)

  const routeRef    = useRef<Array<{ lat: number; lng: number; accuracy: number }>>([])
  const queueRef    = useRef<Array<{ seq: number; lat: number; lng: number; accuracy_m: number; recorded_at: string }>>([])
  const seqRef      = useRef(0)
  const distRef     = useRef(0)
  const simTimer    = useRef<ReturnType<typeof setInterval> | null>(null)
  const flushTimer  = useRef<ReturnType<typeof setInterval> | null>(null)
  const tripIdRef   = useRef<string | null>(null)

  function addLog(msg: string) {
    setLog(l => [`[${new Date().toLocaleTimeString('en-MY')}] ${msg}`, ...l].slice(0, 30))
  }

  // ── Flush queued points to server ─────────────────────────────────────────
  async function flushPoints(id: string) {
    if (queueRef.current.length === 0) return
    const batch = [...queueRef.current]
    queueRef.current = []
    try {
      const res  = await fetch(`/api/trips/${id}/points`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ points: batch }),
      })
      const json = await res.json()
      addLog(`↑ Flushed ${batch.length} pts → accepted:${json.accepted} deduped:${json.deduped}`)
    } catch {
      queueRef.current = [...batch, ...queueRef.current]
      addLog('⚠ Flush failed — points re-queued')
    }
  }

  // ── Start simulation ──────────────────────────────────────────────────────
  async function handleStart() {
    setErrMsg(null)
    setLog([])
    setDistM(0)
    setPointIdx(0)
    distRef.current = 0
    seqRef.current  = 0

    // Build fresh route with jitter
    const route = buildRoute()
    routeRef.current = route
    setTotalPoints(route.length)

    setPhase('creating')
    addLog('Creating GPS_TRACKING trip…')

    const res  = await fetch('/api/trips', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ calculation_mode: 'GPS_TRACKING' }),
    })
    const json = await res.json()

    if (!res.ok) {
      setErrMsg(json.error?.message ?? 'Failed to create trip.')
      setPhase('error')
      return
    }

    const id = json.trip.id
    setTripId(id)
    tripIdRef.current = id
    addLog(`Trip created: ${id.slice(0, 8)}…`)
    setPhase('simulating')

    // Emit GPS points at chosen interval
    let idx = 0
    simTimer.current = setInterval(async () => {
      if (idx >= route.length) {
        clearInterval(simTimer.current!)
        return
      }

      const pt    = route[idx]
      const prev  = idx > 0 ? route[idx - 1] : null
      const dInc  = prev ? haversineM(prev.lat, prev.lng, pt.lat, pt.lng) : 0

      distRef.current += dInc
      seqRef.current  += 1

      const point = {
        seq:         seqRef.current,
        lat:         pt.lat,
        lng:         pt.lng,
        accuracy_m:  pt.accuracy,
        recorded_at: new Date().toISOString(),
      }

      queueRef.current.push(point)
      setPointIdx(idx + 1)
      setDistM(distRef.current)
      setCurrentPos({ lat: pt.lat, lng: pt.lng })

      addLog(`pt ${String(seqRef.current).padStart(2, '0')} (${pt.lat.toFixed(5)}, ${pt.lng.toFixed(5)}) +${dInc.toFixed(0)}m`)

      idx++

      // Auto-flush every 5 points (faster than production 30s for test speed)
      if (seqRef.current % 5 === 0) {
        await flushPoints(id)
      }
    }, SPEEDS[speedIdx].ms)
  }

  // ── Stop simulation ───────────────────────────────────────────────────────
  async function handleStop() {
    if (simTimer.current)  clearInterval(simTimer.current)
    if (flushTimer.current) clearInterval(flushTimer.current)

    const id = tripIdRef.current
    if (!id) { setPhase('error'); setErrMsg('No trip ID — did start fail?'); return }

    setPhase('stopping')
    addLog('Flushing remaining points…')
    await flushPoints(id)

    addLog('Calling /stop…')
    const res  = await fetch(`/api/trips/${id}/stop`, { method: 'POST' })
    const json = await res.json()

    if (!res.ok) {
      setErrMsg(json.error?.message ?? 'Stop failed.')
      setPhase('error')
      addLog(`✗ Stop error: ${json.error?.message}`)
      return
    }

    const finalDist = json.trip?.final_distance_m
    addLog(`✓ Trip FINAL — final_distance_m: ${finalDist ? fmtKm(finalDist) : '—'}`)
    setPhase('done')
    setTimeout(() => router.push(`/trips/${id}`), 1200)
  }

  // Auto-stop when all points emitted
  useEffect(() => {
    if (phase === 'simulating' && pointIdx > 0 && pointIdx >= totalPoints) {
      addLog('All points emitted — stopping automatically…')
      handleStop()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointIdx, totalPoints, phase])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (simTimer.current)   clearInterval(simTimer.current)
      if (flushTimer.current) clearInterval(flushTimer.current)
    }
  }, [])

  const progress = totalPoints > 0 ? Math.round((pointIdx / totalPoints) * 100) : 0
  const speed    = SPEEDS[speedIdx]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>

      {/* ── Dev warning ──────────────────────────────────────────────── */}
      <div style={S.devBanner}>
        ⚠️ DEV TOOL — GPS Simulator — Remove before production
      </div>

      <h1 style={S.title}>GPS Simulator</h1>
      <p style={S.subtitle}>KLCC → KL Sentral · {KL_ROUTE_WAYPOINTS.length} waypoints · ~5.8 km</p>

      {/* ── Speed selector ───────────────────────────────────────────── */}
      <div style={S.speedRow}>
        <span style={S.speedLabel}>Speed:</span>
        {SPEEDS.map((s, i) => (
          <button
            key={s.label}
            onClick={() => setSpeedIdx(i)}
            disabled={phase === 'simulating' || phase === 'stopping'}
            style={{
              ...S.speedBtn,
              backgroundColor: speedIdx === i ? '#0f172a' : '#f1f5f9',
              color:           speedIdx === i ? '#fff'    : '#374151',
            }}
          >
            {s.label}
            <span style={S.speedDesc}>{s.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Live stats ───────────────────────────────────────────────── */}
      <div style={S.statsGrid}>
        <StatBox label="Point" value={`${pointIdx} / ${totalPoints}`} />
        <StatBox label="Distance" value={fmtKm(distM)} highlight />
        <StatBox label="Progress" value={`${progress}%`} />
        <StatBox
          label="Position"
          value={currentPos
            ? `${currentPos.lat.toFixed(5)}, ${currentPos.lng.toFixed(5)}`
            : '—'}
          small
        />
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div style={S.progressTrack}>
        <div style={{ ...S.progressFill, width: `${progress}%` }} />
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {errMsg && <div style={S.errorBox}>✗ {errMsg}</div>}

      {/* ── Actions ──────────────────────────────────────────────────── */}
      <div style={S.actions}>
        {(phase === 'idle' || phase === 'error') && (
          <button onClick={handleStart} style={S.btnStart}>
            ▶ Start Simulation
          </button>
        )}

        {phase === 'creating' && (
          <button disabled style={{ ...S.btnStart, opacity: 0.6 }}>
            Creating trip…
          </button>
        )}

        {phase === 'simulating' && (
          <>
            <button onClick={handleStop} style={S.btnStop}>
              ■ Stop & Save Trip
            </button>
            <p style={S.hint}>Trip will auto-save when all points are emitted.</p>
          </>
        )}

        {phase === 'stopping' && (
          <button disabled style={{ ...S.btnStop, opacity: 0.6 }}>
            Saving…
          </button>
        )}

        {phase === 'done' && (
          <div style={S.doneBox}>
            ✓ Trip saved — redirecting to trip detail…
          </div>
        )}
      </div>

      {/* ── Trip ID ──────────────────────────────────────────────────── */}
      {tripId && (
        <div style={S.tripIdBox}>
          Trip ID: <code style={S.code}>{tripId}</code>
        </div>
      )}

      {/* ── Console log ──────────────────────────────────────────────── */}
      <div style={S.logBox}>
        <div style={S.logHeader}>Console</div>
        {log.length === 0
          ? <div style={S.logEmpty}>Waiting…</div>
          : log.map((l, i) => <div key={i} style={S.logLine}>{l}</div>)
        }
      </div>

    </div>
  )
}

function StatBox({ label, value, highlight, small }: {
  label: string; value: string; highlight?: boolean; small?: boolean
}) {
  return (
    <div style={S.statBox}>
      <div style={S.statLabel}>{label}</div>
      <div style={{
        ...S.statValue,
        fontSize:   small ? 11 : highlight ? 20 : 16,
        color:      highlight ? '#16a34a' : '#0f172a',
        fontWeight: highlight ? 800 : 700,
        wordBreak:  'break-all',
      }}>
        {value}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    display:       'flex',
    flexDirection: 'column',
    gap:           14,
    paddingBottom: 60,
    fontFamily:    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  devBanner: {
    backgroundColor: '#fef3c7',
    border:          '1.5px solid #f59e0b',
    borderRadius:    8,
    padding:         '10px 14px',
    fontSize:        13,
    fontWeight:      700,
    color:           '#92400e',
    textAlign:       'center',
  },
  title:    { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  speedRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    flexWrap:   'wrap',
  },
  speedLabel: { fontSize: 13, fontWeight: 600, color: '#374151' },
  speedBtn: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    padding:       '6px 14px',
    borderRadius:  8,
    border:        'none',
    cursor:        'pointer',
    fontSize:      13,
    fontWeight:    700,
    gap:           2,
  },
  speedDesc:  { fontSize: 9, fontWeight: 400, opacity: 0.7 },
  statsGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 10,
  },
  statBox: {
    backgroundColor: '#fff',
    border:          '1px solid #e2e8f0',
    borderRadius:    10,
    padding:         '12px 14px',
  },
  statLabel: { fontSize: 11, color: '#94a3b8', marginBottom: 4, fontWeight: 500 },
  statValue: { fontVariantNumeric: 'tabular-nums' },
  progressTrack: {
    height:          8,
    backgroundColor: '#f1f5f9',
    borderRadius:    4,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#16a34a',
    borderRadius:    4,
    transition:      'width 0.3s ease',
  },
  errorBox: {
    padding:         '10px 12px',
    backgroundColor: '#fef2f2',
    border:          '1px solid #fecaca',
    borderRadius:    8,
    fontSize:        13,
    color:           '#dc2626',
    fontWeight:      500,
  },
  actions: {
    display:       'flex',
    flexDirection: 'column',
    gap:           8,
  },
  btnStart: {
    padding:         '14px',
    backgroundColor: '#16a34a',
    color:           '#fff',
    border:          'none',
    borderRadius:    10,
    fontSize:        16,
    fontWeight:      700,
    cursor:          'pointer',
  },
  btnStop: {
    padding:         '14px',
    backgroundColor: '#dc2626',
    color:           '#fff',
    border:          'none',
    borderRadius:    10,
    fontSize:        16,
    fontWeight:      700,
    cursor:          'pointer',
  },
  hint: { fontSize: 12, color: '#94a3b8', margin: 0, textAlign: 'center' },
  doneBox: {
    padding:         '14px',
    backgroundColor: '#f0fdf4',
    border:          '1.5px solid #bbf7d0',
    borderRadius:    10,
    fontSize:        15,
    fontWeight:      700,
    color:           '#16a34a',
    textAlign:       'center',
  },
  tripIdBox: {
    fontSize:        12,
    color:           '#64748b',
    backgroundColor: '#f8fafc',
    padding:         '8px 12px',
    borderRadius:    8,
    border:          '1px solid #e2e8f0',
    wordBreak:       'break-all',
  },
  code: {
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
    fontSize:   12,
  },
  logBox: {
    backgroundColor: '#0f172a',
    borderRadius:    10,
    padding:         14,
    maxHeight:       280,
    overflowY:       'auto',
    display:         'flex',
    flexDirection:   'column',
    gap:             3,
  },
  logHeader: {
    fontSize:      11,
    fontWeight:    700,
    color:         '#475569',
    marginBottom:  6,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  logEmpty: { fontSize: 12, color: '#475569', fontStyle: 'italic' },
  logLine:  {
    fontSize:   11,
    color:      '#94a3b8',
    fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
    lineHeight: 1.5,
  },
}
