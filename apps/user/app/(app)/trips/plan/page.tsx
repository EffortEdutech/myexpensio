'use client'
// apps/user/app/(app)/trips/plan/page.tsx
//
// Mileage Calculator — utility to calculate route distance for a trip on a specific date.
//
// Flow:
//   1. Set trip date (defaults to today)
//   2. Tap map or search → set origin + destination pins
//   3. "Calculate Route" → OSRM returns real alternatives drawn on map
//   4. Select a route → distance confirmed
//   5a. "Add to My Trips" → saves FINAL trip with chosen date + distance → trip detail
//   5b. "Discard"         → nothing saved → back to trips list
//
// Gating: FREE=2/month | ADMIN=unlimited | PRO=unlimited
//
// NEW:
//   - Origin and Destination each support “Use Current Position”
//   - Checks browser geolocation permission where available
//   - If location is disabled/denied, shows a clear message asking user to enable location first

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link          from 'next/link'
import dynamic       from 'next/dynamic'
import type { LatLng, RouteAlternativeMapData } from '@/components/RouteMap'

const RouteMap = dynamic(() => import('@/components/RouteMap'), {
  ssr:     false,
  loading: () => <div style={S.mapPlaceholder}>🗺 Loading map…</div>,
})

// ── Types ──────────────────────────────────────────────────────────────────

type GeocodeSuggestion = {
  place_id:     number
  display_name: string
  lat:          number
  lon:          number
}

type RouteAlt = RouteAlternativeMapData

type UsageInfo = {
  tier:         'FREE' | 'PRO'
  is_admin:     boolean
  period_start: string
  period_end:   string
  routes_used:  number
  routes_limit: number | null
}

type LocationValue = {
  text: string
  lat:  number
  lng:  number
}

type Step = 'input' | 'alternatives' | 'confirming' | 'limit_reached'
type LocationTarget = 'origin' | 'dest'

// ── Helpers ────────────────────────────────────────────────────────────────

const fmtKm  = (m: number) => (m / 1000).toFixed(2) + ' km'
const fmtMin = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}
const fmtMonthEnd = (iso: string) =>
  new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })

const todayISO = () => new Date().toISOString().slice(0, 10)

function geolocationErrorMessage(error: GeolocationPositionError | { code?: number; message?: string }) {
  if (error?.code === 1) {
    return 'Location is not enabled. Please enable location permission in your browser or device settings first.'
  }
  if (error?.code === 2) {
    return 'Current position is unavailable right now. Please try again in an open area.'
  }
  if (error?.code === 3) {
    return 'Getting current position timed out. Please try again.'
  }
  return error?.message || 'Unable to get current position right now.'
}

// ── AddressInput ───────────────────────────────────────────────────────────

function AddressInput({
  label,
  pinEmoji,
  value,
  disabled,
  isLocating,
  onUseCurrentLocation,
  onSelect,
  onClear,
}: {
  label:                string
  pinEmoji:             string
  value:                LocationValue | null
  disabled:             boolean
  isLocating:           boolean
  onUseCurrentLocation: () => void
  onSelect:             (loc: LocationValue) => void
  onClear:              () => void
}) {
  const [query,       setQuery]       = useState(value?.text ?? '')
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const [searching,   setSearching]   = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(value?.text ?? '') }, [value])

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return }
    setSearching(true)
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (res.ok) { setSuggestions(json.results ?? []); setOpen(true) }
    } catch {
      // ignore search failure here
    } finally {
      setSearching(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    if (!q) {
      onClear()
      setSuggestions([])
      setOpen(false)
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(q), 400)
  }

  const shortName = (name: string) => name.split(',').slice(0, 2).join(',').trim()

  return (
    <div style={{ position: 'relative' }}>
      <div style={S.inputLabelRow}>
        <label style={{ ...S.label, marginBottom: 0 }}><span style={{ marginRight: 5 }}>{pinEmoji}</span>{label}</label>
        <button
          type="button"
          onClick={onUseCurrentLocation}
          disabled={disabled || isLocating}
          style={{ ...S.btnUseCurrent, opacity: disabled || isLocating ? 0.55 : 1 }}
        >
          {isLocating ? '⏳ Getting location…' : '📍 Use Current Position'}
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder="Search or tap map…"
          disabled={disabled}
          style={{ ...S.input, borderColor: value ? '#16a34a' : '#d1d5db' }}
          autoComplete="off"
        />
        {(searching || isLocating) && <span style={S.inputRight}>⏳</span>}
        {value && !searching && !isLocating && (
          <button onClick={e => { e.preventDefault(); onClear(); setQuery('') }} style={S.clearBtn} tabIndex={-1}>✕</button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={S.dropdown}>
          {suggestions.map(s => (
            <button
              key={s.place_id}
              type="button"
              onMouseDown={() => {
                setSuggestions([])
                setOpen(false)
                onSelect({ text: s.display_name, lat: s.lat, lng: s.lon })
              }}
              style={S.dropdownItem}
            >
              <span style={S.dropdownMain}>{shortName(s.display_name)}</span>
              <span style={S.dropdownSub}>{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── UsageWidget ────────────────────────────────────────────────────────────

function UsageWidget({ usage, loading, isUnlimited, isAtLimit, isNearLimit }: {
  usage: UsageInfo | null; loading: boolean
  isUnlimited: boolean; isAtLimit: boolean; isNearLimit: boolean
}) {
  if (loading) return <div style={S.usageSkeleton} />
  if (usage?.is_admin) return (
    <div style={{ ...S.usageBadge, backgroundColor: '#fdf4ff', borderColor: '#e9d5ff', color: '#7c3aed' }}>
      🛡 Admin — Unlimited calculations
    </div>
  )
  if (usage?.tier === 'PRO') return (
    <div style={{ ...S.usageBadge, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
      ✦ Pro — Unlimited calculations
    </div>
  )
  if (!usage) return null

  const used = usage.routes_used, lim = usage.routes_limit ?? 2
  const pct      = Math.min(100, Math.round((used / lim) * 100))
  const barColor = isAtLimit ? '#dc2626' : isNearLimit ? '#d97706' : '#0f172a'
  const bgColor  = isAtLimit ? '#fef2f2' : isNearLimit ? '#fffbeb' : '#f8fafc'
  const bdColor  = isAtLimit ? '#fecaca' : isNearLimit ? '#fde68a' : '#e2e8f0'

  return (
    <div style={{ ...S.usageBox, backgroundColor: bgColor, borderColor: bdColor }}>
      <div style={S.usageRow}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Route calculations</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>{used} / {lim} this month</span>
      </div>
      <div style={S.barTrack}><div style={{ ...S.barFill, width: `${pct}%`, backgroundColor: barColor }} /></div>
      {isAtLimit   && <p style={{ margin: 0, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>Limit reached — use GPS Tracking or upgrade to Pro.</p>}
      {isNearLimit && !isAtLimit && <p style={{ margin: 0, fontSize: 12, color: '#d97706' }}>{lim - used} calculation{lim - used !== 1 ? 's' : ''} remaining this month.</p>}
    </div>
  )
}

// ── LimitReachedPanel ──────────────────────────────────────────────────────

function LimitReachedPanel({ periodEnd, onUseGps, onBack }: {
  periodEnd?: string; onUseGps: () => void; onBack: () => void
}) {
  return (
    <div style={S.limitBox}>
      <span style={{ fontSize: 44 }}>🔒</span>
      <p style={S.limitTitle}>Monthly Calculation Limit Reached</p>
      <p style={S.limitText}>
        You've used your 2 free route calculations this month.
        {periodEnd && <> Resets on <strong>{fmtMonthEnd(periodEnd)}</strong>.</>}
      </p>
      <div style={S.limitActions}>
        <button onClick={onUseGps} style={S.btnPrimary}>📍 Use GPS Tracking instead</button>
        <div style={S.upgradeHint}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Need unlimited calculations?</span>
          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Upgrade to Pro — coming soon</span>
        </div>
        <button onClick={onBack} style={S.btnGhost}>← Back</button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function MileageCalculatorPage() {
  const router = useRouter()

  const [step,            setStep]          = useState<Step>('input')
  const [tripDate,        setTripDate]      = useState(todayISO())
  const [tripTime,        setTripTime]      = useState('08:00')
  const [origin,          setOrigin]        = useState<LocationValue | null>(null)
  const [destination,     setDestination]   = useState<LocationValue | null>(null)
  const [alts,            setAlts]          = useState<RouteAlt[]>([])
  const [selectedIndex,   setSelectedIndex] = useState<number | null>(null)
  const [usage,           setUsage]         = useState<UsageInfo | null>(null)
  const [loading,         setLoading]       = useState(false)
  const [usageLoading,    setUsageLoading]  = useState(true)
  const [error,           setError]         = useState<string | null>(null)
  const [geocoding,       setGeocoding]     = useState<LocationTarget | null>(null)
  const [locatingTarget,  setLocatingTarget]= useState<LocationTarget | null>(null)

  useEffect(() => {
    fetch('/api/usage').then(r => r.json())
      .then(j => setUsage(j as UsageInfo)).catch(() => {})
      .finally(() => setUsageLoading(false))
  }, [])

  const isUnlimited = !usage || usage.is_admin || usage.tier === 'PRO' || usage.routes_limit === null
  const limit       = usage?.routes_limit ?? 2
  const isAtLimit   = !isUnlimited && (usage?.routes_used ?? 0) >= limit
  const isNearLimit = !isUnlimited && !isAtLimit && (usage?.routes_used ?? 0) >= limit - 1

  // ── Reverse geocode ────────────────────────────────────────────────────────

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res  = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
      const json = await res.json()
      return json.short_name ?? json.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    } catch {
      return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    }
  }

  async function getCurrentPositionFor(target: LocationTarget) {
    setError(null)

    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError('Location is not supported in this browser or device.')
      return
    }

    setLocatingTarget(target)

    try {
      const navWithPermissions = navigator as Navigator & {
        permissions?: {
          query: (descriptor: { name: 'geolocation' }) => Promise<{ state: PermissionState }>
        }
      }

      if (navWithPermissions.permissions?.query) {
        try {
          const status = await navWithPermissions.permissions.query({ name: 'geolocation' })
          if (status.state === 'denied') {
            setError('Location is not enabled. Please enable location permission in your browser or device settings first.')
            setLocatingTarget(null)
            return
          }
        } catch {
          // Some browsers do not fully support this query. Fall through to getCurrentPosition.
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        })
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude

      setGeocoding(target)
      const text = await reverseGeocode(lat, lng)
      const nextValue = { text, lat, lng }

      if (target === 'origin') {
        setOrigin(nextValue)
      } else {
        setDestination(nextValue)
      }

      setAlts([])
      setSelectedIndex(null)
      if (step === 'alternatives') setStep('input')
    } catch (e: unknown) {
      setError(geolocationErrorMessage(e as GeolocationPositionError))
    } finally {
      setLocatingTarget(null)
      setGeocoding(null)
    }
  }

  // ── Map pin handlers ───────────────────────────────────────────────────────

  const handleOriginSet = useCallback(async (ll: LatLng) => {
    setError(null)
    setGeocoding('origin')
    const text = await reverseGeocode(ll[0], ll[1])
    setOrigin({ text, lat: ll[0], lng: ll[1] })
    setAlts([])
    setSelectedIndex(null)
    if (step === 'alternatives') setStep('input')
    setGeocoding(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const handleDestSet = useCallback(async (ll: LatLng) => {
    setError(null)
    setGeocoding('dest')
    const text = await reverseGeocode(ll[0], ll[1])
    setDestination({ text, lat: ll[0], lng: ll[1] })
    setAlts([])
    setSelectedIndex(null)
    if (step === 'alternatives') setStep('input')
    setGeocoding(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // ── Calculate routes ───────────────────────────────────────────────────────

  async function handleCalculate(e: React.FormEvent) {
    e.preventDefault()
    if (!origin || !destination) {
      setError('Set both origin and destination — tap the map, search, or use current position.')
      return
    }
    setError(null)
    setLoading(true)

    const res  = await fetch('/api/routes/alternatives', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        origin_text:      origin.text,      origin_lat:       origin.lat,      origin_lng:       origin.lng,
        destination_text: destination.text, destination_lat:  destination.lat, destination_lng:  destination.lng,
        travel_mode:      'DRIVING',
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (res.status === 429 && json.error?.code === 'LIMIT_REACHED') { setStep('limit_reached'); return }
    if (!res.ok) { setError(json.error?.message ?? 'Failed to calculate route.'); return }

    setAlts(json.alternatives ?? [])
    setSelectedIndex(0)
    if (json.usage) setUsage(prev => prev ? { ...prev, ...json.usage } : json.usage)
    setStep('alternatives')
  }

  // ── Add to trips ───────────────────────────────────────────────────────────

  async function handleAddToTrips() {
    if (selectedIndex === null || !origin || !destination) return
    const alt = alts[selectedIndex]
    setLoading(true)
    setError(null)
    setStep('confirming')

    try {
      const localDateTimeStr = `${tripDate}T${tripTime}:00`
      const startedAt = new Date(localDateTimeStr).toISOString()

      const cr = await fetch('/api/trips', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          calculation_mode: 'SELECTED_ROUTE',
          origin_text:      origin.text,
          destination_text: destination.text,
          started_at:       startedAt,
        }),
      })
      const cj = await cr.json()

      if (!cr.ok) {
        setError(cj.error?.message ?? 'Failed to create trip. Please try again.')
        setStep('alternatives')
        setLoading(false)
        return
      }

      if (!cj.trip?.id) {
        setError('Trip was created but returned no ID. Please check My Trips.')
        setStep('alternatives')
        setLoading(false)
        return
      }

      const sr = await fetch('/api/routes/select', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          trip_id:    cj.trip.id,
          route_id:   alt.route_id,
          distance_m: alt.distance_m,
          duration_s: alt.duration_s,
          summary:    alt.summary,
        }),
      })
      const sj = await sr.json()

      if (!sr.ok) {
        setError(sj.error?.message ?? 'Route saved but finalisation failed. Trip is in My Trips as Draft.')
        setStep('alternatives')
        setLoading(false)
        return
      }

      router.push(`/trips/${cj.trip.id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unexpected error. Please try again.'
      setError(msg)
      setStep('alternatives')
      setLoading(false)
    }
  }

  function handleDiscard() {
    router.push('/trips')
  }

  const originLatLng: LatLng | null = origin      ? [origin.lat,      origin.lng]      : null
  const destLatLng:   LatLng | null = destination ? [destination.lat, destination.lng] : null
  const mapMode     = step === 'alternatives' || step === 'confirming' ? 'routing' : 'pinning'
  const canCalculate = !!origin && !!destination && !isAtLimit && !loading && !geocoding && !locatingTarget

  return (
    <div style={S.page}>
      <div style={S.titleRow}>
        <Link href="/trips" style={S.backLink}>← My Trips</Link>
        <h1 style={S.title}>Mileage Calculator</h1>
        <p style={S.subtitle}>Calculate route distance and save it as a trip record.</p>
      </div>

      <UsageWidget usage={usage} loading={usageLoading}
        isUnlimited={isUnlimited} isAtLimit={isAtLimit} isNearLimit={isNearLimit} />

      {step === 'limit_reached' && (
        <LimitReachedPanel
          periodEnd={usage?.period_end}
          onUseGps={() => router.push('/trips/start')}
          onBack={() => setStep('input')}
        />
      )}

      <div>
        <label style={S.label}>📅 Trip Date &amp; Time</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="date"
            value={tripDate}
            max={todayISO()}
            onChange={e => setTripDate(e.target.value)}
            disabled={loading}
            style={{ ...S.input, flex: 2 }}
          />
          <input
            type="time"
            value={tripTime}
            onChange={e => setTripTime(e.target.value)}
            disabled={loading}
            style={{ ...S.input, flex: 1, paddingRight: 14 }}
          />
        </div>
      </div>

      {step !== 'limit_reached' && (
        <RouteMap
          mode={mapMode}
          originLatLng={originLatLng}
          destLatLng={destLatLng}
          routes={alts}
          selectedIndex={selectedIndex}
          onOriginSet={handleOriginSet}
          onDestSet={handleDestSet}
          onRouteClick={i => setSelectedIndex(i)}
        />
      )}

      {step !== 'limit_reached' && (
        <form onSubmit={handleCalculate} style={S.form}>
          <AddressInput
            label="Origin"
            pinEmoji="🟢"
            value={origin}
            disabled={loading}
            isLocating={locatingTarget === 'origin'}
            onUseCurrentLocation={() => getCurrentPositionFor('origin')}
            onSelect={loc => {
              setError(null)
              setOrigin(loc)
              setAlts([])
              setSelectedIndex(null)
              if (step === 'alternatives') setStep('input')
            }}
            onClear={() => {
              setOrigin(null)
              setAlts([])
              setSelectedIndex(null)
              setStep('input')
            }}
          />
          {geocoding === 'origin' && <p style={S.geocodingHint}>📍 Resolving address…</p>}

          <AddressInput
            label="Destination"
            pinEmoji="🔴"
            value={destination}
            disabled={loading}
            isLocating={locatingTarget === 'dest'}
            onUseCurrentLocation={() => getCurrentPositionFor('dest')}
            onSelect={loc => {
              setError(null)
              setDestination(loc)
              setAlts([])
              setSelectedIndex(null)
              if (step === 'alternatives') setStep('input')
            }}
            onClear={() => {
              setDestination(null)
              setAlts([])
              setSelectedIndex(null)
              setStep('input')
            }}
          />
          {geocoding === 'dest' && <p style={S.geocodingHint}>📍 Resolving address…</p>}

          {error && <div style={S.errorBox}>{error}</div>}

          <button
            type="submit"
            style={{ ...S.btnCalculate, opacity: canCalculate ? 1 : 0.45 }}
            disabled={!canCalculate}
          >
            {loading && step === 'input' ? '⏳ Calculating…' : '📐 Calculate Route'}
          </button>
        </form>
      )}

      {(step === 'alternatives' || step === 'confirming') && alts.length > 0 && (
        <div style={S.resultsSection}>
          <p style={S.resultsTitle}>Route Options</p>
          <p style={S.resultsHint}>Select a route — tap a card or tap the line on the map</p>

          {alts.map((alt, i) => {
            const isSel = i === selectedIndex
            return (
              <button
                key={alt.route_id}
                type="button"
                onClick={() => setSelectedIndex(i)}
                disabled={loading}
                style={{ ...S.altCard, borderColor: isSel ? '#2563eb' : '#e2e8f0', backgroundColor: isSel ? '#eff6ff' : '#fff' }}
              >
                {isSel && <span style={S.altBadge}>✓ Selected</span>}
                <span style={S.altSummary}>{alt.summary}</span>
                <div style={S.altStats}>
                  <span style={S.altDist}>{fmtKm(alt.distance_m)}</span>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{fmtMin(alt.duration_s)}</span>
                </div>
              </button>
            )
          })}

          {selectedIndex !== null && (
            <div style={S.actionRow}>
              <button
                type="button"
                onClick={handleAddToTrips}
                disabled={loading}
                style={{ ...S.btnAdd, opacity: loading ? 0.55 : 1 }}
              >
                {step === 'confirming' ? '⏳ Saving…' : `✅ Add to My Trips — ${fmtKm(alts[selectedIndex].distance_m)}`}
              </button>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={loading}
                style={S.btnDiscard}
              >
                ✕ Discard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 },
  titleRow:     { display: 'flex', flexDirection: 'column', gap: 4 },
  title:        { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle:     { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 },
  backLink:     { fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },

  usageSkeleton:{ height: 52, borderRadius: 10, backgroundColor: '#f1f5f9' },
  usageBadge:   { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, borderWidth: 1, borderStyle: 'solid' },
  usageBox:     { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 10, borderWidth: 1, borderStyle: 'solid' },
  usageRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  barTrack:     { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },

  mapPlaceholder:{ height: 360, backgroundColor: '#f1f5f9', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#94a3b8', border: '1.5px solid #e2e8f0' },

  form:         { display: 'flex', flexDirection: 'column', gap: 12 },
  inputLabelRow:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5, flexWrap: 'wrap' },
  label:        { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 },
  input:        { width: '100%', paddingTop: 11, paddingBottom: 11, paddingLeft: 14, paddingRight: 38, border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', WebkitTextFillColor: '#0f172a', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box' },
  btnUseCurrent:{ padding: '7px 10px', backgroundColor: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  inputRight:   { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, pointerEvents: 'none' },
  clearBtn:     { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', padding: '2px 4px', lineHeight: 1 },
  geocodingHint:{ margin: '-6px 0 0', fontSize: 12, color: '#64748b' },
  errorBox:     { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  btnCalculate: { padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },

  dropdown:     { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.10)', zIndex: 999, overflow: 'hidden', marginTop: 4 },
  dropdownItem: { display: 'flex', flexDirection: 'column', gap: 2, width: '100%', padding: '10px 14px', border: 'none', borderBottom: '1px solid #f8fafc', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left' },
  dropdownMain: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  dropdownSub:  { fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  resultsSection:{ display: 'flex', flexDirection: 'column', gap: 8 },
  resultsTitle: { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  resultsHint:  { fontSize: 12, color: '#94a3b8', margin: '-4px 0 0' },
  altCard:      { display: 'flex', flexDirection: 'column', gap: 6, width: '100%', border: '2px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s, background-color 0.15s', position: 'relative' },
  altBadge:     { position: 'absolute', top: 10, right: 12, fontSize: 11, fontWeight: 700, color: '#2563eb', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: 6 },
  altSummary:   { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  altStats:     { display: 'flex', alignItems: 'center', gap: 6 },
  altDist:      { fontSize: 16, fontWeight: 800, color: '#0f172a' },

  actionRow:    { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 },
  btnAdd:       { padding: '14px 20px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },
  btnDiscard:   { padding: '12px 20px', backgroundColor: '#fff', color: '#64748b', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },

  limitBox:     { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 20px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 16 },
  limitTitle:   { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 },
  limitText:    { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.7, maxWidth: 300 },
  limitActions: { display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' },
  upgradeHint:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 16px', backgroundColor: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, width: '100%' },
  btnPrimary:   { padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },
  btnGhost:     { padding: '10px 0', backgroundColor: 'transparent', border: 'none', fontSize: 13, color: '#64748b', cursor: 'pointer' },
}
