'use client'
// apps/user/app/(app)/trips/[id]/page.tsx
// Trip Detail / Summary page.
// Loads trip data, shows all distance fields, allows:
//   - Adding/editing notes
//   - Setting odometer mode (NONE / EVIDENCE_ONLY / OVERRIDE)
//   - Entering odometer distance (required for OVERRIDE)
//   - "Add to Claim" button → navigates to /claims?action=new&trip_id=<id>
//
// Uses client-side fetching so the page can update after PATCH without
// a full server round-trip.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { fmtKm } from '@/lib/distance'
import { ReceiptUploader } from '@/components/ReceiptUploader'

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

const SOURCE_LABEL: Record<string, string> = {
  GPS:               'GPS Tracking',
  SELECTED_ROUTE:    'Selected Route',
  ODOMETER_OVERRIDE: 'Odometer Override',
}
const SOURCE_COLOR: Record<string, string> = {
  GPS: '#16a34a', SELECTED_ROUTE: '#2563eb', ODOMETER_OVERRIDE: '#ca8a04',
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={S.row}>
      <span style={S.rowLabel}>{label}</span>
      <span style={{ ...S.rowValue, fontWeight: highlight ? 800 : 500, color: highlight ? '#0f172a' : '#374151' }}>
        {value}
      </span>
    </div>
  )
}

export default function TripDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [trip,         setTrip]         = useState<Trip | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [saveMsg,      setSaveMsg]      = useState<string | null>(null)
  const [deleting,     setDeleting]     = useState(false)
  const [deleteError,  setDeleteError]  = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Editable fields
  const [notes,        setNotes]        = useState('')
  const [odoMode,      setOdoMode]      = useState<'NONE' | 'EVIDENCE_ONLY' | 'OVERRIDE'>('NONE')
  const [odoDistKm,    setOdoDistKm]    = useState('')    // user types KM, we convert to m on save
  const [odoStartUrl,  setOdoStartUrl]  = useState<string | null>(null)
  const [odoEndUrl,    setOdoEndUrl]    = useState<string | null>(null)

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

  // ── Photo upload handlers (auto-save immediately on upload) ──────────────
  // Photos are persisted independently of the Save Changes button so the
  // user does not lose a successful upload if they navigate away.

  async function handlePhotoUploaded(field: 'odometer_start_url' | 'odometer_end_url', path: string | null) {
    if (field === 'odometer_start_url') setOdoStartUrl(path)
    else                                setOdoEndUrl(path)

    try {
      await fetch(`/api/trips/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [field]: path }),
      })
      // Ignore response — UI already updated optimistically via state
    } catch {
      // Non-critical: photo is already in Storage; PATCH can be retried on next Save
    }
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaveMsg(null)

    const odoDistM = odoDistKm ? parseFloat(odoDistKm) * 1000 : null

    if (odoMode === 'OVERRIDE' && (!odoDistM || odoDistM <= 0)) {
      setError('Odometer distance is required when Override is selected.')
      setSaving(false); return
    }

    const res  = await fetch(`/api/trips/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        notes:               notes || null,
        odometer_mode:       odoMode,
        odometer_distance_m: odoDistM,
      }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) { setError(json.error?.message ?? 'Failed to save.'); return }
    setTrip(json.trip)
    setSaveMsg('Saved ✓')
    setTimeout(() => setSaveMsg(null), 2000)
  }

  async function handleDelete() {
    setDeleting(true); setDeleteError(null)
    const res  = await fetch(`/api/trips/${id}`, { method: 'DELETE' })
    const json = await res.json()
    setDeleting(false)
    if (!res.ok) {
      setDeleteError(json.error?.message ?? 'Failed to delete trip.')
      setShowDeleteConfirm(false)
      return
    }
    router.push('/trips')
  }

  if (loading) return <div style={S.center}><div style={S.spinner} /></div>
  if (error && !trip) return (
    <div style={S.center}>
      <p style={S.errText}>{error}</p>
      <Link href="/trips" style={S.backLink}>← Back to Trips</Link>
    </div>
  )
  if (!trip) return null

  const isFinal   = trip.status === 'FINAL'
  const isDraft   = trip.status === 'DRAFT'
  const srcColor  = SOURCE_COLOR[trip.distance_source ?? ''] ?? '#64748b'
  const srcLabel  = SOURCE_LABEL[trip.distance_source ?? ''] ?? trip.distance_source ?? '—'

  return (
    <div style={S.page}>

      {/* ── Status header ─────────────────────────────────────────────── */}
      <div style={S.header}>
        <Link href="/trips" style={S.backLink}>← Trips</Link>
        <span style={{ ...S.statusBadge, backgroundColor: isDraft ? '#fef2f2' : '#f0fdf4',
          color: isDraft ? '#dc2626' : '#16a34a' }}>
          {isDraft ? '🔴 In Progress' : '✓ Final'}
        </span>
      </div>

      {/* ── Trip title ───────────────────────────────────────────────── */}
      <h1 style={S.tripTitle}>
        {trip.origin_text && trip.destination_text
          ? `${trip.origin_text} → ${trip.destination_text}`
          : trip.calculation_mode === 'GPS_TRACKING' ? 'GPS Trip' : 'Planned Trip'
        }
      </h1>

      {/* ── Official distance card ───────────────────────────────────── */}
      {isFinal && (
        <div style={{ ...S.distCard, borderColor: srcColor + '44' }}>
          <div style={S.distValue}>{fmtKm(trip.final_distance_m)}</div>
          <div style={S.distSub}>Official distance</div>
          <div style={{ ...S.srcBadge, backgroundColor: srcColor + '18', color: srcColor }}>
            {srcLabel}
          </div>
        </div>
      )}

      {/* ── Distance breakdown ──────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.cardTitle}>Distance Breakdown</p>
        <Row label="Start"             value={fmtDateTime(trip.started_at)} />
        <Row label="End"               value={fmtDateTime(trip.ended_at)} />
        {trip.gps_distance_m             != null && <Row label="GPS Distance"      value={fmtKm(trip.gps_distance_m)} />}
        {trip.selected_route_distance_m  != null && <Row label="Route Distance"    value={fmtKm(trip.selected_route_distance_m)} />}
        {trip.odometer_distance_m        != null && <Row label="Odometer Distance" value={fmtKm(trip.odometer_distance_m)} />}
        {isFinal && <Row label="Official (final)" value={fmtKm(trip.final_distance_m)} highlight />}
        {trip.calculation_mode === 'GPS_TRACKING' && (
          <Row label="GPS Points" value={String(trip.point_count)} />
        )}
      </div>

      {/* ── Odometer section (editable even after FINAL) ─────────────── */}
      <div style={S.card}>
        <p style={S.cardTitle}>Odometer Evidence</p>
        <p style={S.cardHint}>
          Attach odometer readings as supporting evidence, or override the official distance.
        </p>

        <div style={S.radioGroup}>
          {(['NONE', 'EVIDENCE_ONLY', 'OVERRIDE'] as const).map(m => (
            <label key={m} style={S.radioLabel}>
              <input
                type="radio"
                name="odo_mode"
                value={m}
                checked={odoMode === m}
                onChange={() => { setOdoMode(m); if (m === 'NONE') setOdoDistKm('') }}
              />
              <span style={S.radioText}>
                {m === 'NONE'           && 'Not used'}
                {m === 'EVIDENCE_ONLY'  && 'Evidence only (attach readings / photos)'}
                {m === 'OVERRIDE'       && 'Override official distance with odometer'}
              </span>
            </label>
          ))}
        </div>

        {(odoMode === 'EVIDENCE_ONLY' || odoMode === 'OVERRIDE') && (
          <>
            {/* ── Distance input ──────────────────────────────────── */}
            <div style={{ ...S.field, marginTop: 12 }}>
              <label style={S.label}>
                Odometer distance (km) {odoMode === 'OVERRIDE' && <span style={{ color: '#dc2626' }}>*</span>}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={odoDistKm}
                onChange={e => {
                  const v = e.target.value
                  if (v === '' || /^\d*\.?\d*$/.test(v)) setOdoDistKm(v)
                }}
                placeholder="e.g. 52.40"
                style={S.input}
              />
            </div>

            {/* ── Photo uploads ────────────────────────────────────── */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ ...S.cardHint, margin: 0 }}>
                📸 Attach odometer photos as supporting evidence for this trip.
              </p>

              {/* Start photo */}
              <div style={S.field}>
                <label style={S.label}>📷 Start Odometer Reading</label>
                <p style={{ margin: '2px 0 8px', fontSize: 11, color: '#94a3b8' }}>
                  Photo of odometer at the beginning of the trip
                </p>
                <ReceiptUploader
                  storagePath={odoStartUrl}
                  onUploaded={path => handlePhotoUploaded('odometer_start_url', path || null)}
                  purpose="ODOMETER"
                  label="Start Reading"
                />
              </div>

              {/* End photo */}
              <div style={S.field}>
                <label style={S.label}>📷 End Odometer Reading</label>
                <p style={{ margin: '2px 0 8px', fontSize: 11, color: '#94a3b8' }}>
                  Photo of odometer at the end of the trip
                </p>
                <ReceiptUploader
                  storagePath={odoEndUrl}
                  onUploaded={path => handlePhotoUploaded('odometer_end_url', path || null)}
                  purpose="ODOMETER"
                  label="End Reading"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Notes ───────────────────────────────────────────────────── */}
      <div style={S.card}>
        <p style={S.cardTitle}>Notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Client meeting at Shah Alam"
          rows={3}
          style={S.textarea}
        />
      </div>

      {/* ── Save + error ─────────────────────────────────────────────── */}
      {error && <div style={S.errorBox}>{error}</div>}
      {saveMsg && <div style={S.saveMsg}>{saveMsg}</div>}

      <button onClick={handleSave} style={{ ...S.btnSave, opacity: saving ? 0.65 : 1 }} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>

      {/* ── Add to claim ─────────────────────────────────────────────── */}
      {isFinal && trip.final_distance_m && (
        <Link href={`/claims?action=new&trip_id=${trip.id}`} style={S.btnClaim}>
          📋 Add to Claim
        </Link>
      )}

      {/* ── Resume GPS if DRAFT ──────────────────────────────────────── */}
      {isDraft && trip.calculation_mode === 'GPS_TRACKING' && (
        <Link href="/trips/start" style={S.btnResume}>
          🔴 Trip in progress — return to tracker
        </Link>
      )}

      {/* ── Delete / Cancel trip ─────────────────────────────────────────── */}
      {deleteError && <div style={S.errorBox}>{deleteError}</div>}

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={S.btnDelete}
          disabled={deleting}
        >
          {isDraft ? '✕ Cancel Trip' : '🗑 Delete Trip'}
        </button>
      ) : (
        <div style={S.confirmBox}>
          <p style={S.confirmText}>
            {isDraft
              ? 'Cancel this trip? The GPS recording will be permanently discarded.'
              : 'Delete this trip? This cannot be undone.'}
          </p>
          <div style={S.confirmRow}>
            <button
              onClick={handleDelete}
              style={{ ...S.btnConfirmDelete, opacity: deleting ? 0.65 : 1 }}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : isDraft ? 'Yes, Cancel Trip' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => { setShowDeleteConfirm(false); setDeleteError(null) }}
              style={S.btnConfirmCancel}
              disabled={deleting}
            >
              Keep Trip
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 40 },
  center:     { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 },
  spinner:    { width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backLink:   { fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  statusBadge:{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 12 },
  tripTitle:  { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 },
  distCard:   { backgroundColor: '#fff', border: '2px solid', borderRadius: 14, padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 },
  distValue:  { fontSize: 48, fontWeight: 800, color: '#0f172a', letterSpacing: '-2px', lineHeight: 1 },
  distSub:    { fontSize: 13, color: '#64748b' },
  srcBadge:   { fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 12, marginTop: 4 },
  card:       { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px' },
  cardTitle:  { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 10px' },
  cardHint:   { fontSize: 12, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.5 },
  row:        { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid #f1f5f9' },
  rowLabel:   { fontSize: 13, color: '#64748b' },
  rowValue:   { fontSize: 13 },
  radioGroup: { display: 'flex', flexDirection: 'column', gap: 10 },
  radioLabel: { display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' },
  radioText:  { fontSize: 13, color: '#374151', lineHeight: 1.5 },
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:      { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#fff', color: '#0f172a', WebkitTextFillColor: '#0f172a' },
  textarea:   { padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, outline: 'none', backgroundColor: '#fff', color: '#0f172a', WebkitTextFillColor: '#0f172a', resize: 'vertical', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.5 },
  errorBox:   { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  saveMsg:    { padding: '10px 12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 13, color: '#16a34a', fontWeight: 600 },
  btnSave:    { padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  btnClaim:   { padding: '13px 20px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: 700, textAlign: 'center' },
  btnResume:  { padding: '13px 20px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700, textAlign: 'center' },
  errText:     { fontSize: 15, color: '#dc2626', fontWeight: 600, margin: 0 },
  btnDelete:   {
    padding: '11px 20px', backgroundColor: 'transparent',
    color: '#dc2626', border: '1.5px solid #fecaca',
    borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginTop: 8,
  },
  confirmBox:  {
    padding: '16px', backgroundColor: '#fef2f2',
    border: '1.5px solid #fecaca', borderRadius: 12,
    display: 'flex', flexDirection: 'column' as const, gap: 12,
  },
  confirmText: { margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 },
  confirmRow:  { display: 'flex', gap: 10 },
  btnConfirmDelete: {
    flex: 1, padding: '11px 0', backgroundColor: '#dc2626',
    color: '#fff', border: 'none', borderRadius: 8,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
  btnConfirmCancel: {
    flex: 1, padding: '11px 0', backgroundColor: '#fff',
    color: '#374151', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
}
