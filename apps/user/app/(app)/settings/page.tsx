'use client'
// apps/user/app/(app)/settings/page.tsx
// Rates configuration — mileage, meal (per session + full day), lodging, per diem.
//
// Per diem rate (new): one org-wide daily allowance rate.
// Admin sets it here → auto-fills when user adds a PER_DIEM claim item.
// User can always override the rate in the claim item form.

import { useState, useEffect } from 'react'

export default function SettingsPage() {
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [effFrom,  setEffFrom]  = useState<string | null>(null)

  const [mileage,  setMileage]  = useState('0.60')
  const [morning,  setMorning]  = useState('20.00')
  const [noon,     setNoon]     = useState('30.00')
  const [evening,  setEvening]  = useState('30.00')
  const [fullDay,  setFullDay]  = useState('60.00')
  const [lodging,  setLodging]  = useState('120.00')
  const [perdiem,  setPerdiem]  = useState('0.00')    // ← new

  useEffect(() => {
    fetch('/api/settings/rates')
      .then(r => r.json())
      .then(j => {
        const r = j.rate
        setMileage(f2(r.mileage_rate_per_km))
        setMorning(f2(r.meal_rate_morning))
        setNoon(   f2(r.meal_rate_noon))
        setEvening(f2(r.meal_rate_evening))
        setFullDay(f2(r.meal_rate_full_day))
        setLodging(f2(r.lodging_rate_default))
        setPerdiem(f2(r.perdiem_rate_myr))
        setEffFrom(r.effective_from ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const f2  = (v: unknown) => { const n = Number(v); return isNaN(n) ? '' : n.toFixed(2) }
  const num = (val: string, set: (v: string) => void) => {
    if (val === '' || /^\d*\.?\d*$/.test(val)) set(val)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null); setSaved(false)
    const res = await fetch('/api/settings/rates', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mileage_rate_per_km:  parseFloat(mileage)  || 0.60,
        meal_rate_morning:    parseFloat(morning)   || 20.00,
        meal_rate_noon:       parseFloat(noon)      || 30.00,
        meal_rate_evening:    parseFloat(evening)   || 30.00,
        meal_rate_full_day:   parseFloat(fullDay)   || 60.00,
        lodging_rate_default: parseFloat(lodging)   || 120.00,
        perdiem_rate_myr:     parseFloat(perdiem)   || 0,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error?.message ?? 'Failed to save.'); return }
    setEffFrom(json.rate?.effective_from ?? null)
    setSaved(true)
    setTimeout(() => setSaved(false), 3500)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a' }} />
    </div>
  )

  return (
    <div style={S.page}>
      <h1 style={S.pageTitle}>Settings</h1>
      <form onSubmit={handleSave} style={S.form}>

        {/* ── MILEAGE ──────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🚗</span>
            <div>
              <div style={S.cardTitle}>Mileage Rate</div>
              <div style={S.cardSub}>Per kilometre driven</div>
            </div>
          </div>
          <RateRow label="Rate per km" suffix="/km" value={mileage} onChange={v => num(v, setMileage)} />
        </div>

        {/* ── MEAL ─────────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🍽️</span>
            <div>
              <div style={S.cardTitle}>Meal Rates</div>
              <div style={S.cardSub}>Fixed-rate amounts when no receipt</div>
            </div>
          </div>

          <div style={S.groupLabel}>Meal Rate — Per Session</div>
          <RateRow label="🌅 Morning  (Breakfast)" suffix="/session" value={morning} onChange={v => num(v, setMorning)} />
          <div style={S.rowDiv} />
          <RateRow label="🌤 Noon  (Lunch)"        suffix="/session" value={noon}    onChange={v => num(v, setNoon)}    />
          <div style={S.rowDiv} />
          <RateRow label="🌙 Evening  (Dinner)"    suffix="/session" value={evening} onChange={v => num(v, setEvening)} />

          <div style={S.sep} />

          <div style={S.groupLabel}>Meal Rate — Full Day</div>
          <RateRow label="☀️ Full Day  (all sessions)" suffix="/day" value={fullDay} onChange={v => num(v, setFullDay)} />
        </div>

        {/* ── LODGING ──────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>🏨</span>
            <div>
              <div style={S.cardTitle}>Lodging Rate</div>
              <div style={S.cardSub}>Per night when no receipt provided</div>
            </div>
          </div>
          <RateRow label="Rate per night" suffix="/night" value={lodging} onChange={v => num(v, setLodging)} />
        </div>

        {/* ── PER DIEM ─────────────────────────────────────────────── */}
        <div style={S.card}>
          <div style={S.cardHead}>
            <span style={S.cardIcon}>📅</span>
            <div>
              <div style={S.cardTitle}>Per Diem Allowance</div>
              <div style={S.cardSub}>Daily travel allowance — auto-fills in claim</div>
            </div>
          </div>
          <RateRow label="Daily allowance rate" suffix="/day" value={perdiem} onChange={v => num(v, setPerdiem)} />
          <div style={{ marginTop: 10, padding: '8px 10px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, fontSize: 11, color: '#0369a1', lineHeight: 1.6 }}>
            💡 Set your org's standard daily rate here. This pre-fills when adding a Per Diem item to a claim. The user can still change it per-claim if needed. Set to 0 if not applicable.
          </div>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}
        {saved && <div style={S.successBox}>✓ Rates saved — new claims will use these rates.</div>}

        {effFrom && (
          <p style={S.effNote}>
            Current rates effective from{' '}
            <strong>{new Date(effFrom).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>.
            {' '}Saving creates a new version effective today.
          </p>
        )}

        <button type="submit" disabled={saving} style={{ ...S.btnSave, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Rates'}
        </button>
      </form>
    </div>
  )
}

function RateRow({ label, suffix, value, onChange }: {
  label: string; suffix: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div style={S.rateRow}>
      <span style={S.rateLabel}>{label}</span>
      <div style={S.rateRight}>
        <span style={S.ratePre}>MYR</span>
        <input value={value} onChange={e => onChange(e.target.value)} inputMode="decimal" style={S.rateInput} />
        <span style={S.rateSuf}>{suffix}</span>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 },
  pageTitle:  { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  form:       { display: 'flex', flexDirection: 'column', gap: 12 },
  card:       { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, paddingTop: 14, paddingBottom: 16, paddingLeft: 16, paddingRight: 16, display: 'flex', flexDirection: 'column' },
  cardHead:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 },
  cardIcon:   { fontSize: 22 },
  cardTitle:  { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  cardSub:    { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  groupLabel: { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 10, marginTop: 4 },
  rateRow:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 5, paddingBottom: 5 },
  rateLabel:  { fontSize: 13, color: '#374151' },
  rateRight:  { display: 'flex', alignItems: 'center', gap: 6 },
  ratePre:    { fontSize: 12, color: '#64748b', fontWeight: 600 },
  rateInput:  { width: 76, paddingTop: 8, paddingBottom: 8, paddingLeft: 10, paddingRight: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, fontWeight: 700, color: '#0f172a', WebkitTextFillColor: '#0f172a', outline: 'none', backgroundColor: '#fff', textAlign: 'right' as const },
  rateSuf:    { fontSize: 12, color: '#94a3b8', minWidth: 56 },
  rowDiv:     { height: 1, backgroundColor: '#f8fafc', marginTop: 2, marginBottom: 2 },
  sep:        { height: 1, backgroundColor: '#e2e8f0', marginTop: 14, marginBottom: 14 },
  errorBox:   { paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  successBox: { paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 },
  effNote:    { fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.6 },
  btnSave:    { paddingTop: 14, paddingBottom: 14, paddingLeft: 20, paddingRight: 20, backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
}
