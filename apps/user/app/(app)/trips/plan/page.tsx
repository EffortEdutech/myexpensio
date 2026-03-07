'use client'
// apps/user/app/(app)/trips/plan/page.tsx
//
// Plan Trip — origin/destination → route alternatives → select → save trip.
//
// Gating behaviour:
//   FREE  → 2 route-calcs/month enforced server-side.
//           Usage bar shown on mount so user knows their status BEFORE submitting.
//           LIMIT_REACHED → LimitReached panel with GPS fallback CTA.
//   PRO   → Unlimited. "Pro — Unlimited" badge shown.
//   ADMIN → Unlimited bypass. "Admin — Unlimited" badge shown.

import { useState, useEffect } from 'react'
import { useRouter }           from 'next/navigation'
import Link                    from 'next/link'

type RouteAlt = {
  route_id:   string
  distance_m: number
  duration_s: number
  summary:    string
}

type UsageInfo = {
  tier:         'FREE' | 'PRO'
  is_admin:     boolean
  period_start: string
  period_end:   string
  routes_used:  number
  routes_limit: number | null
}

type Step = 'input' | 'alternatives' | 'selecting' | 'limit_reached'

const fmtKm  = (m: number) => (m / 1000).toFixed(2) + ' km'
const fmtMin = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}
function fmtMonthEnd(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PlanTripPage() {
  const router = useRouter()

  const [step,         setStep]         = useState<Step>('input')
  const [origin,       setOrigin]       = useState('')
  const [destination,  setDestination]  = useState('')
  const [alts,         setAlts]         = useState<RouteAlt[]>([])
  const [usage,        setUsage]        = useState<UsageInfo | null>(null)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [usageLoading, setUsageLoading] = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // ── Load usage on mount ───────────────────────────────────────────────────

  useEffect(() => {
    async function loadUsage() {
      try {
        const res  = await fetch('/api/usage')
        const json = await res.json()
        if (res.ok) setUsage(json as UsageInfo)
      } catch { /* non-critical */ }
      finally  { setUsageLoading(false) }
    }
    loadUsage()
  }, [])

  // ── Get routes ────────────────────────────────────────────────────────────

  async function handleGetRoutes(e: React.FormEvent) {
    e.preventDefault()
    if (!origin.trim() || !destination.trim()) { setError('Enter both origin and destination.'); return }
    setError(null); setLoading(true)

    const res  = await fetch('/api/routes/alternatives', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ origin_text: origin.trim(), destination_text: destination.trim(), travel_mode: 'DRIVING' }),
    })
    const json = await res.json()
    setLoading(false)

    if (res.status === 429 && json.error?.code === 'LIMIT_REACHED') { setStep('limit_reached'); return }
    if (!res.ok) { setError(json.error?.message ?? 'Failed to get routes.'); return }

    setAlts(json.alternatives ?? [])
    if (json.usage) setUsage(prev => prev ? { ...prev, ...json.usage } : json.usage)
    setStep('alternatives')
  }

  // ── Select route ──────────────────────────────────────────────────────────

  async function handleSelect(alt: RouteAlt) {
    if (loading) return
    setSelectedId(alt.route_id); setLoading(true); setError(null); setStep('selecting')

    const cr = await fetch('/api/trips', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ calculation_mode: 'SELECTED_ROUTE', origin_text: origin.trim(), destination_text: destination.trim() }),
    })
    const cj = await cr.json()
    if (!cr.ok) { setError(cj.error?.message ?? 'Failed to create trip.'); setStep('alternatives'); setLoading(false); return }

    const sr = await fetch('/api/routes/select', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ trip_id: cj.trip.id, route_id: alt.route_id, distance_m: alt.distance_m, summary: alt.summary }),
    })
    const sj = await sr.json()
    if (!sr.ok) { setError(sj.error?.message ?? 'Failed to save route.'); setStep('alternatives'); setLoading(false); return }

    router.push(`/trips/${cj.trip.id}`)
  }

  const isUnlimited = !usage || usage.is_admin || usage.tier === 'PRO' || usage.routes_limit === null
  const limit       = usage?.routes_limit ?? 2
  const isAtLimit   = !isUnlimited && (usage?.routes_used ?? 0) >= limit
  const isNearLimit = !isUnlimited && !isAtLimit && (usage?.routes_used ?? 0) >= limit - 1

  return (
    <div style={S.page}>

      <div style={S.titleRow}>
        <Link href="/trips" style={S.backLink}>← Trips</Link>
        <h1 style={S.title}>Plan a Trip</h1>
      </div>

      {/* Usage widget */}
      <UsageWidget usage={usage} loading={usageLoading}
        isUnlimited={isUnlimited} isAtLimit={isAtLimit} isNearLimit={isNearLimit} />

      {/* Input form */}
      {step !== 'limit_reached' && (
        <form onSubmit={handleGetRoutes} style={S.form}>
          <Field label="From">
            <input value={origin} onChange={e => setOrigin(e.target.value)}
              placeholder="e.g. Kuala Lumpur City Centre" style={S.input}
              disabled={loading || isAtLimit} />
          </Field>
          <Field label="To">
            <input value={destination} onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Shah Alam" style={S.input}
              disabled={loading || isAtLimit} />
          </Field>
          {error && <div style={S.errorBox}>{error}</div>}
          <button type="submit"
            style={{ ...S.btnPrimary, opacity: (loading || isAtLimit) ? 0.55 : 1 }}
            disabled={loading || isAtLimit}>
            {loading && step === 'input' ? '⏳ Getting routes…' : '🗺 Get Routes'}
          </button>
        </form>
      )}

      {/* Alternatives */}
      {(step === 'alternatives' || step === 'selecting') && alts.length > 0 && (
        <div style={S.altSection}>
          <p style={S.altTitle}>Choose a route</p>
          {alts.map(alt => {
            const isSel = selectedId === alt.route_id
            return (
              <button key={alt.route_id} onClick={() => handleSelect(alt)} disabled={loading}
                style={{ ...S.altCard, borderColor: isSel ? '#0f172a' : '#e2e8f0',
                  backgroundColor: isSel ? '#f8fafc' : '#fff', opacity: loading && !isSel ? 0.45 : 1 }}>
                <div style={S.altRow}>
                  <span style={S.altSummary}>{alt.summary}</span>
                  <span style={{ fontSize: 13, color: isSel && loading ? '#2563eb' : '#64748b', fontWeight: 500 }}>
                    {isSel && loading ? 'Saving…' : 'Select →'}
                  </span>
                </div>
                <div style={S.altStats}>
                  <span style={S.altDist}>{fmtKm(alt.distance_m)}</span>
                  <span style={{ color: '#cbd5e1' }}>·</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>{fmtMin(alt.duration_s)}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Limit reached */}
      {step === 'limit_reached' && (
        <LimitReachedPanel
          periodEnd={usage?.period_end}
          onUseGps={() => router.push('/trips/start')}
          onBack={() => setStep('input')} />
      )}

    </div>
  )
}

// ── UsageWidget ───────────────────────────────────────────────────────────────

function UsageWidget({ usage, loading, isUnlimited, isAtLimit, isNearLimit }:
  { usage: UsageInfo | null; loading: boolean; isUnlimited: boolean; isAtLimit: boolean; isNearLimit: boolean }) {

  if (loading) return <div style={S.usageSkeleton} />

  if (usage?.is_admin) return (
    <div style={{ ...S.usageBadge, backgroundColor: '#fdf4ff', borderColor: '#e9d5ff', color: '#7c3aed' }}>
      🛡 Admin — Unlimited route calculations
    </div>
  )

  if (usage?.tier === 'PRO') return (
    <div style={{ ...S.usageBadge, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
      ✦ Pro — Unlimited route calculations
    </div>
  )

  if (!usage) return null

  const used     = usage.routes_used
  const lim      = usage.routes_limit ?? 2
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
      <div style={S.barTrack}>
        <div style={{ ...S.barFill, width: `${pct}%`, backgroundColor: barColor }} />
      </div>
      {isAtLimit && (
        <p style={{ margin: 0, fontSize: 12, color: '#dc2626', fontWeight: 500 }}>
          Limit reached — use GPS Tracking or upgrade to Pro.
        </p>
      )}
      {isNearLimit && !isAtLimit && (
        <p style={{ margin: 0, fontSize: 12, color: '#d97706' }}>
          {lim - used} calculation{lim - used !== 1 ? 's' : ''} remaining this month.
        </p>
      )}
    </div>
  )
}

// ── LimitReachedPanel ─────────────────────────────────────────────────────────

function LimitReachedPanel({ periodEnd, onUseGps, onBack }:
  { periodEnd?: string; onUseGps: () => void; onBack: () => void }) {
  return (
    <div style={S.limitBox}>
      <span style={{ fontSize: 44 }}>🔒</span>
      <p style={S.limitTitle}>Monthly Route Limit Reached</p>
      <p style={S.limitText}>
        You've used your 2 free route calculations for this month.
        {periodEnd && <> Resets on <strong>{fmtMonthEnd(periodEnd)}</strong>.</>}
      </p>
      <div style={S.limitActions}>
        <button onClick={onUseGps} style={S.btnPrimary}>📍 Use GPS Tracking instead</button>
        <div style={S.upgradeHint}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Need more route calculations?</span>
          <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Upgrade to Pro — coming soon</span>
        </div>
        <button onClick={onBack} style={S.btnGhost}>← Back</button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
      {children}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 },
  titleRow:   { display: 'flex', flexDirection: 'column', gap: 4 },
  title:      { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  backLink:   { fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  usageSkeleton: { height: 52, borderRadius: 10, backgroundColor: '#f1f5f9' },
  usageBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
    borderWidth: 1, borderStyle: 'solid',
  },
  usageBox:   { display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', borderRadius: 10, borderWidth: 1, borderStyle: 'solid' },
  usageRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  barTrack:   { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  barFill:    { height: '100%', borderRadius: 3, transition: 'width 0.3s ease' },
  form:       { display: 'flex', flexDirection: 'column', gap: 14 },
  input:      { paddingTop: 11, paddingBottom: 11, paddingLeft: 14, paddingRight: 14, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#0f172a', WebkitTextFillColor: '#0f172a', outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box', width: '100%' },
  errorBox:   { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  btnPrimary: { padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },
  altSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  altTitle:   { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 },
  altCard:    { display: 'flex', flexDirection: 'column', gap: 6, width: '100%', backgroundColor: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' },
  altRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  altSummary: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  altStats:   { display: 'flex', alignItems: 'center', gap: 6 },
  altDist:    { fontSize: 15, fontWeight: 800, color: '#0f172a' },
  limitBox:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '32px 20px', textAlign: 'center', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 16 },
  limitTitle: { fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 },
  limitText:  { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.7, maxWidth: 300 },
  limitActions:{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', alignItems: 'center' },
  upgradeHint:{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 16px', backgroundColor: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: 10, width: '100%' },
  btnGhost:   { padding: '10px 0', backgroundColor: 'transparent', border: 'none', fontSize: 13, color: '#64748b', cursor: 'pointer' },
}
