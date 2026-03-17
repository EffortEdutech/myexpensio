'use client'
// apps/user/app/(app)/trips/odometer/page.tsx
//
// Odometer Trip — record a trip by direct odometer reading.
//
// Flow:
//   1. Fill: date/time, origin, destination, odometer km
//   2. Optionally capture start + end odometer photos
//   3. Submit → POST /api/trips (SELECTED_ROUTE, with finalize+odometer body)
//      The API creates the trip AND immediately finalizes it in one request.
//   4. Redirect to /trips/:id
//
// No route API call is made → zero route quota consumption.
// distance_source will be ODOMETER_OVERRIDE, final_distance_m = user input.

import { useState, useCallback } from 'react'
import { useRouter }             from 'next/navigation'
import Link                      from 'next/link'
import { ReceiptUploader }           from '@/components/ReceiptUploader'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export default function OdometerTripPage() {
  const router = useRouter()

  const [tripDate,    setTripDate]    = useState(todayISO())
  const [tripTime,    setTripTime]    = useState(nowHHMM())
  const [origin,      setOrigin]      = useState('')
  const [destination, setDestination] = useState('')
  const [odoDistKm,   setOdoDistKm]   = useState('')
  const [startUrl,    setStartUrl]    = useState<string | null>(null)
  const [endUrl,      setEndUrl]      = useState<string | null>(null)
  const [notes,       setNotes]       = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const odoKm   = parseFloat(odoDistKm)
  const isValid = !!tripDate && !!origin.trim() && !!destination.trim()
                  && odoDistKm !== '' && !isNaN(odoKm) && odoKm > 0

  const handleSubmit = useCallback(async () => {
    setError(null)
    if (!isValid) return

    setSaving(true)
    try {
      // Single POST — create + finalize in one shot using the extended route
      const started_at = `${tripDate}T${tripTime}:00+08:00`

      const res  = await fetch('/api/trips', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calculation_mode:     'SELECTED_ROUTE',
          origin_text:          origin.trim(),
          destination_text:     destination.trim(),
          started_at,
          // Odometer fields — when all three are provided the API creates
          // the trip as FINAL immediately (no route quota used)
          odometer_mode:        'OVERRIDE',
          odometer_distance_m:  odoKm * 1000,
          odometer_start_url:   startUrl ?? null,
          odometer_end_url:     endUrl   ?? null,
          notes:                notes.trim() || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to save trip.')
        setSaving(false)
        return
      }

      router.push(`/trips/${json.trip.id}`)
    } catch {
      setError('Network error. Please try again.')
      setSaving(false)
    }
  }, [isValid, tripDate, tripTime, origin, destination, odoKm, startUrl, endUrl, notes, router])

  return (
    <div style={S.page}>

      {/* Header */}
      <div>
        <Link href="/trips" style={S.back}>← My Trips</Link>
        <h1 style={S.title}>Odometer Trip</h1>
        <p style={S.subtitle}>Record a trip by odometer reading. No route calculation needed — does not use your monthly quota.</p>
      </div>

      {/* Date & Time */}
      <div style={S.card}>
        <p style={S.sec}>📅 Date & Time</p>
        <div style={S.row}>
          <div style={{ flex: 2 }}>
            <label style={S.lbl}>Date</label>
            <input type="date" value={tripDate} max={todayISO()}
              onChange={e => setTripDate(e.target.value)} style={S.inp} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.lbl}>Time</label>
            <input type="time" value={tripTime}
              onChange={e => setTripTime(e.target.value)} style={{ ...S.inp, paddingRight: 8 }} />
          </div>
        </div>
      </div>

      {/* Route */}
      <div style={S.card}>
        <p style={S.sec}>🗺 Route</p>
        <div style={{ marginBottom: 14 }}>
          <label style={S.lbl}>🟢 Origin</label>
          <input type="text" value={origin}
            onChange={e => setOrigin(e.target.value)}
            placeholder="e.g. Ayer Keroh, Melaka" style={S.inp} />
        </div>
        <div>
          <label style={S.lbl}>🔴 Destination</label>
          <input type="text" value={destination}
            onChange={e => setDestination(e.target.value)}
            placeholder="e.g. Putrajaya, Selangor" style={S.inp} />
        </div>
      </div>

      {/* Odometer Distance */}
      <div style={S.card}>
        <p style={S.sec}>🔢 Odometer Distance (km)</p>
        <label style={S.lbl}>Distance <span style={{ color: '#dc2626' }}>*</span></label>
        <input
          type="text" inputMode="decimal" value={odoDistKm}
          onChange={e => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setOdoDistKm(v) }}
          placeholder="e.g. 52.40"
          style={S.inp}
        />
        {odoDistKm && !isNaN(odoKm) && odoKm > 0 && (
          <p style={S.hint}>= {(odoKm * 1000).toLocaleString()} m stored internally</p>
        )}

        {/* Odometer photos */}
        <div style={{ ...S.row, marginTop: 18, gap: 14 }}>
          <div style={{ flex: 1 }}>
            <p style={S.photoLbl}>📷 Start Reading</p>
            <ReceiptUploader
              storagePath={startUrl}
              onUploaded={p => setStartUrl(p || null)}
              purpose="ODOMETER" label="Start" enableScan={true}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={S.photoLbl}>📷 End Reading</p>
            <ReceiptUploader
              storagePath={endUrl}
              onUploaded={p => setEndUrl(p || null)}
              purpose="ODOMETER" label="End" enableScan={true}
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={S.card}>
        <p style={S.sec}>📝 Notes</p>
        <textarea value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Client visit, fastest route taken"
          rows={3} style={S.textarea} />
      </div>

      {/* Summary strip */}
      {isValid && (
        <div style={S.strip}>
          <span style={{ fontSize: 18 }}>🔢</span>
          <span style={S.stripText}>{origin.trim()} → {destination.trim()}</span>
          <span style={S.stripDist}>{odoKm.toFixed(2)} km</span>
        </div>
      )}

      {error && <div style={S.errBox}>{error}</div>}

      <button onClick={handleSubmit} disabled={saving || !isValid}
        style={{ ...S.btnSave, opacity: saving || !isValid ? 0.45 : 1 }}>
        {saving
          ? '⏳ Saving…'
          : isValid
            ? `✅ Save Odometer Trip — ${odoKm.toFixed(2)} km`
            : '✅ Save Odometer Trip'}
      </button>

      <p style={S.foot}>
        💡 Odometer trips use your reading as the official distance and never consume your monthly route calculation quota.
      </p>

    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:      { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 80 },
  back:      { fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  title:     { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '6px 0 4px' },
  subtitle:  { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 },
  card: {
    backgroundColor: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '16px 16px 18px',
    display: 'flex', flexDirection: 'column',
  },
  sec:      { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 14px' },
  row:      { display: 'flex', gap: 10 },
  lbl:      { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 },
  inp: {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid #d1d5db', borderRadius: 8,
    fontSize: 14, outline: 'none',
    backgroundColor: '#fff', color: '#0f172a',
    WebkitTextFillColor: '#0f172a', boxSizing: 'border-box',
  },
  hint:     { fontSize: 11, color: '#94a3b8', margin: '5px 0 0' },
  photoLbl: { fontSize: 12, fontWeight: 600, color: '#374151', margin: '0 0 6px' },
  textarea: {
    width: '100%', padding: '10px 12px',
    border: '1.5px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', resize: 'vertical',
    backgroundColor: '#fff', color: '#0f172a',
    WebkitTextFillColor: '#0f172a',
    fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
  },
  strip: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#f0fdf4', border: '1.5px solid #bbf7d0',
    borderRadius: 10, padding: '12px 14px',
  },
  stripText: { flex: 1, fontSize: 13, fontWeight: 600, color: '#14532d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  stripDist: { fontSize: 14, fontWeight: 800, color: '#15803d', flexShrink: 0 },
  errBox:    { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  btnSave: {
    padding: '14px 20px', backgroundColor: '#15803d', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  foot: { fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: 0, lineHeight: 1.6 },
}
