'use client'
// apps/user/app/(app)/trips/[id]/page.tsx
// Trip Detail page — clean, readable layout.
//
// Sections:
//   1. Header     — back link + status badge
//   2. Hero card  — big distance + source badge
//   3. Route card — origin → destination
//   4. Breakdown  — date, end/arrival (hidden for odometer), distances
//   5. Odometer   — photos (odometer trip: photo viewer only, no mode selector)
//                  (GPS/Route trips: full NONE/EVIDENCE_ONLY/OVERRIDE selector)
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
  ODOMETER_OVERRIDE: 'Odometer Trip',
}
const SRC_COLOR: Record<string, string> = {
  GPS:               '#16a34a',
  SELECTED_ROUTE:    '#2563eb',
  ODOMETER_OVERRIDE: '#ca8a04',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtDT(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function shortAddr(full: string | null): string {
  if (!full) return '—'
  const parts = full.split(',').map(p => p.trim()).filter(Boolean)
  return parts.slice(0, 2).join(', ')
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoRow({ label, value, accent, last }: {
  label: string; value: string; accent?: boolean; last?: boolean
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '9px 0',
      borderBottom: last ? 'none' : '1px solid #f1f5f9',
    }}>
      <span style={{ fontSize: 13, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: accent ? 700 : 500, color: accent ? '#0f172a' : '#374151', textAlign: 'right', maxWidth: '60%' }}>
        {value}
      </span>
    </div>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
      {children}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TripDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const router    = useRouter()

  const [trip,         setTrip]         = useState<Trip | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [saving,       setSaving]       = useState(false)
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [showDel,      setShowDel]      = useState(false)
  const [delErr,       setDelErr]       = useState<string | null>(null)

  // Odometer edit state (only for GPS/Route trips — odometer trips are immutable)
  const [odoMode,      setOdoMode]      = useState<'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE'>('NONE')
  const [odoDistKm,    setOdoDistKm]    = useState('')
  const [odoStartUrl,  setOdoStartUrl]  = useState<string | null>(null)
  const [odoEndUrl,    setOdoEndUrl]    = useState<string | null>(null)
  const [notes,        setNotes]        = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
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

  const isFinal      = trip.status === 'FINAL'
  const isDraft      = trip.status === 'DRAFT'
  const isRoute      = trip.calculation_mode === 'SELECTED_ROUTE'
  const isGps        = trip.calculation_mode === 'GPS_TRACKING'
  // ── NEW: odometer trip flag ─────────────────────────────────────────────
  const isOdometer   = trip.distance_source === 'ODOMETER_OVERRIDE'

  const srcColor   = SRC_COLOR[trip.distance_source ?? ''] ?? '#64748b'
  const srcLabel   = SRC_LABEL[trip.distance_source ?? ''] ?? trip.distance_source ?? '—'

  const originShort = shortAddr(trip.origin_text)
  const destShort   = shortAddr(trip.destination_text)

  // ── CHANGE 1: "Est. Arrival" hidden for odometer trips ──────────────────
  // Odometer trips use ended_at = started_at (point-in-time entry).
  // Showing it as "Est. Arrival" is misleading — hide the row entirely.
  const endLabel = isRoute && !isOdometer ? 'Est. Arrival' : 'End'

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

            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 18, lineHeight: 1.2, flexShrink: 0 }}>🟢</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{originShort}</div>
                {trip.origin_text && trip.origin_text !== originShort && (
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>{trip.origin_text}</div>
                )}
              </div>
            </div>

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

          <InfoRow label="Date" value={fmtDT(trip.started_at)} />

          {/* ── CHANGE 1: Hide end/arrival row for odometer trips ───────── */}
          {/* Odometer trips: ended_at = started_at (not a duration).       */}
          {/* GPS trips: show "End". Route trips: show "Est. Arrival".      */}
          {!isOdometer && (
            <InfoRow label={endLabel} value={fmtDT(trip.ended_at)} />
          )}

          {trip.gps_distance_m            != null && (
            <InfoRow label="GPS Distance"   value={fmtKm(trip.gps_distance_m)} />
          )}
          {/* Odometer trips: skip selected_route_distance_m (same as odometer_distance_m, redundant) */}
          {trip.selected_route_distance_m != null && !isOdometer && (
            <InfoRow label="Route Distance" value={fmtKm(trip.selected_route_distance_m)} />
          )}
          {/* Odometer trips: skip odometer_distance_m too — it equals final_distance_m */}
          {trip.odometer_distance_m       != null && !isOdometer && (
            <InfoRow label="Odometer Distance" value={fmtKm(trip.odometer_distance_m)} />
          )}
          {isGps && (
            <InfoRow label="GPS Points" value={String(trip.point_count)} />
          )}
          {isFinal && trip.final_distance_m != null && (
            <InfoRow label="Official Distance" value={fmtKm(trip.final_distance_m)} accent last />
          )}
        </div>
      </SectionCard>

      {/* ── Odometer section ───────────────────────────────────────────── */}
      {/* ── CHANGE 2: Odometer trips — photo viewer only, no mode selector */}
      {/* GPS/Route trips — full editable NONE/EVIDENCE_ONLY/OVERRIDE      */}
      {isOdometer ? (
        // Odometer Trip: always show both photo slots — user can add/replace after creation
        <SectionCard>
          <div style={{ padding: '14px 18px' }}>
            <SectionTitle>Odometer Photos</SectionTitle>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
              Attach start and end odometer readings as audit evidence.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ReceiptUploader
                key={`odo-start-${odoStartUrl ?? 'empty'}`}
                label="📷 Start Reading"
                purpose="ODOMETER"
                storagePath={odoStartUrl}
                onUploaded={path => handlePhotoUploaded('odometer_start_url', path)}
                enableScan={true}
              />
              <ReceiptUploader
                key={`odo-end-${odoEndUrl ?? 'empty'}`}
                label="📷 End Reading"
                purpose="ODOMETER"
                storagePath={odoEndUrl}
                onUploaded={path => handlePhotoUploaded('odometer_end_url', path)}
                enableScan={true}
              />
            </div>
          </div>
        </SectionCard>
      ) : (
        // GPS / Route Trip: full odometer evidence editor
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
                    onChange={() => { setOdoMode(m); if (m !== 'OVERRIDE') setOdoDistKm('') }}
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
                      style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 15, outline: 'none', color: '#0f172a' }}
                    />
                  </div>
                )}

                <ReceiptUploader
                  key={`odo-start-${odoStartUrl ?? 'empty'}`}
                  label="📷 Start Reading"
                  purpose="ODOMETER"
                  storagePath={odoStartUrl}
                  onUploaded={path => handlePhotoUploaded('odometer_start_url', path)}
                  enableScan={true}
                />
                <ReceiptUploader
                  key={`odo-end-${odoEndUrl ?? 'empty'}`}
                  label="📷 End Reading"
                  purpose="ODOMETER"
                  storagePath={odoEndUrl}
                  onUploaded={path => handlePhotoUploaded('odometer_end_url', path)}
                  enableScan={true}
                />
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Notes ──────────────────────────────────────────────────────── */}
      <SectionCard>
        <div style={{ padding: '14px 18px' }}>
          <SectionTitle>Notes</SectionTitle>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Client visit, site inspection…"
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#0f172a', lineHeight: 1.5 }}
          />
        </div>
      </SectionCard>

      {/* ── Error / Save message ───────────────────────────────────────── */}
      {error   && <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>{error}</div>}
      {saveMsg && <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#15803d', fontWeight: 600 }}>{saveMsg}</div>}

      {/* ── Actions ────────────────────────────────────────────────────── */}
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
        <Link href={`/trips/start?resume=${trip.id}`}
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
