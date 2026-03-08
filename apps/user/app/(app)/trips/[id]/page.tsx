'use client'
// apps/user/app/(app)/trips/[id]/page.tsx
// Trip Detail page — clean, readable layout.
//
// Sections:
//   1. Header     — back link + status badge
//   2. Hero card  — big distance + source badge
//   3. Route card — origin → destination (short names) + date/time
//   4. Breakdown  — start, est. arrival / end, route distance, official
//   5. Odometer   — evidence / override (editable)
//   6. Notes      — free text (editable)
//   7. Actions    — Save, Add to Claim, Resume GPS, Delete

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fmtKm } from '@/lib/distance'
import { ReceiptUploader } from '@/components/ReceiptUploader'

// ── Types ──────────────────────────────────────────────────────────────────

type Trip = {
  id:                        string
  status:                    string
  calculation_mode:          string
  started_at:                string
  ended_at:                  string | null
  origin_text:               string | null
  destination_text:          string | null
  gps_distance_m:            number | null
  selected_route_distance_m: number | null
  odometer_distance_m:       number | null
  odometer_mode:             string
  odometer_start_url:        string | null
  odometer_end_url:          string | null
  final_distance_m:          number | null
  distance_source:           string | null
  notes:                     string | null
  point_count:               number
}

// ── Constants ──────────────────────────────────────────────────────────────

const SRC_LABEL: Record<string, string> = {
  GPS:               'GPS Tracking',
  SELECTED_ROUTE:    'Route Calculation',
  ODOMETER_OVERRIDE: 'Odometer Override',
}
const SRC_COLOR: Record<string, string> = {
  GPS:               '#16a34a',
  SELECTED_ROUTE:    '#2563eb',
  ODOMETER_OVERRIDE: '#ca8a04',
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Format ISO as "Mon, 03 Mar 2026 · 10:00 am" */
function fmtDT(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/** Shorten a full Nominatim address to "Road, City" */
function shortAddr(full: string | null): string {
  if (!full) return '—'
  const parts = full.split(',').map(p => p.trim()).filter(Boolean)
  // First 2 meaningful parts
  return parts.slice(0, 2).join(', ')
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ label, value, accent, last }: {
  label: string; value: string; accent?: boolean; last?: boolean
}) {
  return (
    <div style={{
      display:        'flex',
      justifyContent: 'space-between',
      alignItems:     'baseline',
      padding:        '9px 0',
      borderBottom:   last ? 'none' : '1px solid #f1f5f9',
      gap:            12,
    }}>
      <span style={{ fontSize: 13, color: '#64748b', flexShrink: 0 }}>{label}</span>
      <span style={{
        fontSize:   13,
        fontWeight: accent ? 800 : 500,
        color:      accent ? '#0f172a' : '#374151',
        textAlign:  'right',
        wordBreak:  'break-word',
      }}>{value}</span>
    </div>
  )
}

function SectionCard({ children, noPad }: { children: React.ReactNode; noPad?: boolean }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border:          '1px solid #e2e8f0',
      borderRadius:    14,
      padding:         noPad ? 0 : '16px 18px',
      overflow:        'hidden',
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </p>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [trip,     setTrip]     = useState<Trip | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [delErr,   setDelErr]   = useState<string | null>(null)
  const [showDel,  setShowDel]  = useState(false)

  // Editable fields
  const [notes,       setNotes]       = useState('')
  const [odoMode,     setOdoMode]     = useState<'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE'>('NONE')
  const [odoDistKm,   setOdoDistKm]   = useState('')
  const [odoStartUrl, setOdoStartUrl] = useState<string | null>(null)
  const [odoEndUrl,   setOdoEndUrl]   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const res  = await fetch(`/api/trips/${id}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message ?? 'Trip not found.'); setLoading(false); return }
      const t: Trip = json.trip
      setTrip(t)
      setNotes(t.notes ?? '')
      setOdoMode((t.odometer_mode ?? 'NONE') as 'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE')
      setOdoDistKm(t.odometer_distance_m ? (t.odometer_distance_m / 1000).toFixed(2) : '')
      setOdoStartUrl(t.odometer_start_url ?? null)
      setOdoEndUrl(t.odometer_end_url     ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handlePhotoUploaded(field: 'odometer_start_url' | 'odometer_end_url', path: string | null) {
    if (field === 'odometer_start_url') setOdoStartUrl(path)
    else                                setOdoEndUrl(path)
    try {
      await fetch(`/api/trips/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: path }),
      })
    } catch { /* non-critical */ }
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaveMsg(null)
    const odoDistM = odoDistKm ? parseFloat(odoDistKm) * 1000 : null
    if (odoMode === 'OVERRIDE' && (!odoDistM || odoDistM <= 0)) {
      setError('Odometer distance is required when Override is selected.')
      setSaving(false); return
    }
    const res  = await fetch(`/api/trips/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notes || null, odometer_mode: odoMode, odometer_distance_m: odoDistM }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error?.message ?? 'Failed to save.'); return }
    setTrip(json.trip)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(null), 2500)
  }

  async function handleDelete() {
    setDeleting(true); setDelErr(null)
    const res  = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    const json = await res.json()
    setDeleting(false)
    if (!res.ok) { setDelErr(json.error?.message ?? 'Failed to delete.'); setShowDel(false); return }
    router.push('/trips')
  }

  // ── Loading / Error states ─────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
  if (error && !trip) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '48px 16px' }}>
      <p style={{ fontSize: 15, color: '#dc2626', fontWeight: 600, margin: 0 }}>{error}</p>
      <Link href="/trips" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>← Back to Trips</Link>
    </div>
  )
  if (!trip) return null

  const isFinal    = trip.status === 'FINAL'
  const isDraft    = trip.status === 'DRAFT'
  const isRoute    = trip.calculation_mode === 'SELECTED_ROUTE'
  const isGps      = trip.calculation_mode === 'GPS_TRACKING'
  const srcColor   = SRC_COLOR[trip.distance_source ?? ''] ?? '#64748b'
  const srcLabel   = SRC_LABEL[trip.distance_source ?? ''] ?? trip.distance_source ?? '—'

  const originShort = shortAddr(trip.origin_text)
  const destShort   = shortAddr(trip.destination_text)

  // End label differs by mode
  const endLabel = isRoute ? 'Est. Arrival' : 'End'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 48 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/trips" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
          ← My Trips
        </Link>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
          backgroundColor: isDraft ? '#fef2f2' : '#f0fdf4',
          color:           isDraft ? '#dc2626' : '#16a34a',
          letterSpacing:   '0.04em',
        }}>
          {isDraft ? '● IN PROGRESS' : '✓ FINAL'}
        </span>
      </div>

      {/* ── Hero — official distance ────────────────────────────────────── */}
      {isFinal && trip.final_distance_m != null && (
        <SectionCard>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 20px 20px', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Official Distance
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: '#0f172a', letterSpacing: '-3px', lineHeight: 1 }}>
              {fmtKm(trip.final_distance_m)}
            </div>
            <div style={{
              marginTop: 4, fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20,
              backgroundColor: srcColor + '18', color: srcColor,
            }}>
              {srcLabel}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Route info ─────────────────────────────────────────────────── */}
      {(trip.origin_text || trip.destination_text) && (
        <SectionCard>
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <SectionTitle>Route</SectionTitle>

            {/* Origin */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>🟢</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{originShort}</div>
                {trip.origin_text && trip.origin_text !== originShort && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{trip.origin_text}</div>
                )}
              </div>
            </div>

            {/* Dashed connector */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 18, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ width: 1, height: 20, borderLeft: '2px dashed #cbd5e1' }} />
              </div>
              {trip.final_distance_m != null && (
                <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                  {fmtKm(trip.final_distance_m)}
                </span>
              )}
            </div>

            {/* Destination */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>🔴</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{destShort}</div>
                {trip.destination_text && trip.destination_text !== destShort && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{trip.destination_text}</div>
                )}
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Breakdown ──────────────────────────────────────────────────── */}
      <SectionCard>
        <div style={{ padding: '14px 18px' }}>
          <SectionTitle>Trip Details</SectionTitle>

          <InfoRow label="Date"  value={fmtDT(trip.started_at)} />
          <InfoRow label={endLabel} value={fmtDT(trip.ended_at)} />

          {trip.gps_distance_m            != null && (
            <InfoRow label="GPS Distance"   value={fmtKm(trip.gps_distance_m)} />
          )}
          {trip.selected_route_distance_m != null && (
            <InfoRow label="Route Distance" value={fmtKm(trip.selected_route_distance_m)} />
          )}
          {trip.odometer_distance_m       != null && (
            <InfoRow label="Odometer"       value={fmtKm(trip.odometer_distance_m)} />
          )}
          {isGps && (
            <InfoRow label="GPS Points"     value={String(trip.point_count)} />
          )}
          {isFinal && trip.final_distance_m != null && (
            <InfoRow label="Official Distance" value={fmtKm(trip.final_distance_m)} accent last />
          )}
        </div>
      </SectionCard>

      {/* ── Odometer ───────────────────────────────────────────────────── */}
      <SectionCard>
        <div style={{ padding: '14px 18px' }}>
          <SectionTitle>Odometer Evidence</SectionTitle>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
            Attach odometer readings as supporting evidence, or override the official distance.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(['NONE', 'EVIDENCE_ONLY', 'OVERRIDE'] as const).map(m => (
              <label key={m} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                <input type="radio" name="odo_mode" value={m}
                  checked={odoMode === m}
                  onChange={() => { setOdoMode(m); if (m === 'NONE') setOdoDistKm('') }}
                  style={{ marginTop: 2, accentColor: '#0f172a' }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    {m === 'NONE'          && 'Not used'}
                    {m === 'EVIDENCE_ONLY' && 'Evidence only'}
                    {m === 'OVERRIDE'      && 'Override official distance'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>
                    {m === 'NONE'          && 'No odometer data attached'}
                    {m === 'EVIDENCE_ONLY' && 'Attach photos for audit trail — does not change distance'}
                    {m === 'OVERRIDE'      && 'Use odometer reading as the official distance'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {(odoMode === 'EVIDENCE_ONLY' || odoMode === 'OVERRIDE') && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {odoMode === 'OVERRIDE' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
                    Odometer Distance (km) <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="text" inputMode="decimal" value={odoDistKm}
                    onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setOdoDistKm(v) }}
                    placeholder="e.g. 52.40"
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#fff', color: '#0f172a', WebkitTextFillColor: '#0f172a', boxSizing: 'border-box' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>📷 Start Reading</p>
                  <ReceiptUploader storagePath={odoStartUrl}
                    onUploaded={p => handlePhotoUploaded('odometer_start_url', p || null)}
                    purpose="ODOMETER" label="Start" />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 6px' }}>📷 End Reading</p>
                  <ReceiptUploader storagePath={odoEndUrl}
                    onUploaded={p => handlePhotoUploaded('odometer_end_url', p || null)}
                    purpose="ODOMETER" label="End" />
                </div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      <SectionCard>
        <div style={{ padding: '14px 18px' }}>
          <SectionTitle>Notes</SectionTitle>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Client meeting at HQ, site visit"
            rows={3}
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', backgroundColor: '#fff', color: '#0f172a', WebkitTextFillColor: '#0f172a', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 }}
          />
        </div>
      </SectionCard>

      {/* ── Error / Save confirmation ───────────────────────────────────── */}
      {error   && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}
      {saveMsg && <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 }}>{saveMsg}</div>}

      {/* ── Primary actions ─────────────────────────────────────────────── */}
      <button onClick={handleSave} disabled={saving}
        style={{ padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.65 : 1 }}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      {isFinal && trip.final_distance_m && (
        <Link href={`/claims?action=new&trip_id=${trip.id}`}
          style={{ padding: '13px 20px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center' }}>
          📋 Add to Claim
        </Link>
      )}

      {isDraft && isGps && (
        <Link href="/trips/start"
          style={{ padding: '13px 20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
          🔴 Trip in Progress — Return to Tracker
        </Link>
      )}

      {/* ── Delete / Cancel ─────────────────────────────────────────────── */}
      {delErr && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{delErr}</div>}

      {!showDel ? (
        <button onClick={() => setShowDel(true)} disabled={deleting}
          style={{ padding: '11px 20px', backgroundColor: 'transparent', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
          {isDraft ? '✕ Cancel Trip' : '🗑 Delete Trip'}
        </button>
      ) : (
        <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 }}>
            {isDraft
              ? 'Cancel this trip? The GPS recording will be permanently discarded.'
              : 'Delete this trip? This cannot be undone.'}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleDelete} disabled={deleting}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.65 : 1 }}>
              {deleting ? 'Deleting…' : isDraft ? 'Yes, Cancel' : 'Yes, Delete'}
            </button>
            <button onClick={() => { setShowDel(false); setDelErr(null) }} disabled={deleting}
              style={{ flex: 1, padding: '11px 0', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Keep Trip
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
