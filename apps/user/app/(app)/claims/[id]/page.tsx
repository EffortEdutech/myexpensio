'use client'
// apps/user/app/(app)/claims/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Claim detail: view + edit (DRAFT only).
// New in this version:
//   • TollParkingModal has "Paid by TNG" toggle.
//     - Checked  → no amount input; item saved with mode:'TNG', amount:0.
//                  Amount will be linked from TNG Importer later.
//     - Unchecked → manual amount (Visa / cash / other).
//   • ItemCard shows amber "TNG · Link pending" badge when mode=TNG.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }              from 'next/navigation'
import Link                                  from 'next/link'
import { ReceiptUploader }                   from '@/components/ReceiptUploader'

// ── Types ─────────────────────────────────────────────────────────────────────

type Claim = {
  id: string; org_id: string; user_id: string
  status: string; title: string | null
  period_start: string | null; period_end: string | null
  total_amount: number; currency: string
  submitted_at: string | null; created_at: string
}

type ClaimItem = {
  id: string; type: string; mode: string | null
  trip_id: string | null; qty: number | null; unit: string | null
  rate: number | null; amount: number; currency: string
  receipt_url: string | null; merchant: string | null; notes: string | null
  claim_date: string | null; meal_session: string | null
  lodging_check_in: string | null; lodging_check_out: string | null
}

type Trip = {
  id: string; calculation_mode: string
  origin_text: string | null; destination_text: string | null
  final_distance_m: number | null; distance_source: string | null
  started_at: string
}

type ModalType =
  | 'MILEAGE' | 'MEAL' | 'LODGING'
  | 'EDIT_MEAL' | 'EDIT_LODGING'
  | 'TOLL' | 'PARKING' | 'TRANSPORT'
  | null

type TransportType = 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT'

type MealRates = { morning: number; noon: number; evening: number; fullDay: number }

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtMyr  = (n: number) => 'MYR ' + Number(n).toFixed(2)
const fmtKm   = (m: number | null) => m ? (m / 1000).toFixed(2) + ' km' : '—'
const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function periodLabel(start: string | null, end: string | null) {
  if (!start && !end) return '—'
  if (start && end) {
    const s = new Date(start), e = new Date(end)
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear())
      return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
    return `${fmtDate(start)} – ${fmtDate(end)}`
  }
  return fmtDate(start ?? end)
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  MILEAGE: '🚗', MEAL: '🍽', LODGING: '🏨',
  TOLL: '🛣️', PARKING: '🅿️',
  TAXI: '🚕', GRAB: '🟢', TRAIN: '🚆', FLIGHT: '✈️',
}

const SESSION_LABEL: Record<string, string> = {
  FULL_DAY: 'Full Day', MORNING: 'Morning', NOON: 'Noon', EVENING: 'Evening',
}

const SESSION_META = [
  { key: 'MORNING' as const, icon: '🌅', label: 'Morning', sub: 'Breakfast', rateKey: 'morning' as const },
  { key: 'NOON'    as const, icon: '🌤', label: 'Noon',    sub: 'Lunch',     rateKey: 'noon'    as const },
  { key: 'EVENING' as const, icon: '🌙', label: 'Evening', sub: 'Dinner',    rateKey: 'evening' as const },
]

const TRANSPORT_META: { type: TransportType; icon: string; label: string }[] = [
  { type: 'GRAB',   icon: '🟢', label: 'Grab'   },
  { type: 'TAXI',   icon: '🚕', label: 'Taxi'   },
  { type: 'TRAIN',  icon: '🚆', label: 'Train'  },
  { type: 'FLIGHT', icon: '✈️', label: 'Flight' },
]

// ── Item Card ─────────────────────────────────────────────────────────────────

function ItemCard({ item, onDelete, onEdit, locked }: {
  item: ClaimItem
  onDelete: (id: string) => void
  onEdit: (item: ClaimItem) => void
  locked: boolean
}) {
  const [deleting, setDeleting] = useState(false)

  const isTngPending = item.mode === 'TNG'

  function sub() {
    if (item.type === 'MILEAGE')
      return `${fmtKm(item.qty ? item.qty * 1000 : null)} × MYR ${item.rate?.toFixed(2)}/km`
    if (item.type === 'TOLL' || item.type === 'PARKING') {
      const loc = item.merchant || (item.type === 'TOLL' ? 'Toll' : 'Parking')
      return isTngPending ? loc : loc
    }
    if (['TAXI', 'GRAB', 'TRAIN', 'FLIGHT'].includes(item.type))
      return item.merchant || item.type.charAt(0) + item.type.slice(1).toLowerCase()
    const parts: string[] = []
    if (item.meal_session) parts.push(SESSION_LABEL[item.meal_session] ?? item.meal_session)
    if (item.type === 'LODGING' && item.qty) parts.push(`${item.qty} night${item.qty !== 1 ? 's' : ''}`)
    if (item.mode === 'FIXED_RATE' && item.rate) parts.push(`MYR ${Number(item.rate).toFixed(2)} fixed`)
    if (item.merchant) parts.push(item.merchant)
    return parts.join(' · ') || (item.mode === 'RECEIPT' ? 'Receipt' : 'Fixed rate')
  }

  const canEdit = item.type === 'MEAL' || item.type === 'LODGING'

  return (
    <div style={S.itemCard}>
      {/* Col 1 — date */}
      <div style={S.iDate}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>
          {fmtDate(item.claim_date ?? item.lodging_check_in)}
        </span>
      </div>

      {/* Col 2 — icon + label + sub */}
      <div style={S.iBody}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>{TYPE_ICON[item.type] ?? '📄'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.type}</span>

          {/* TNG pending badge */}
          {isTngPending && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
              backgroundColor: '#fef9c3', color: '#854d0e', letterSpacing: 0.3,
            }}>
              TNG · Link pending
            </span>
          )}

          {item.receipt_url && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6,
              backgroundColor: '#f0fdf4', color: '#15803d',
            }}>🧾</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub()}</div>
        {item.notes && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>
            {item.notes}
          </div>
        )}
      </div>

      {/* Col 3 — amount + actions */}
      <div style={S.iAmt}>
        {isTngPending
          ? <span style={{ fontSize: 11, fontWeight: 700, color: '#854d0e' }}>—</span>
          : <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{fmtMyr(item.amount)}</span>
        }
        {!locked && (
          <div style={{ display: 'flex', gap: 4 }}>
            {canEdit && (
              <button
                onClick={() => onEdit(item)}
                style={{ padding: '2px 6px', background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12 }}
              >✏</button>
            )}
            <button
              onClick={() => { if (confirm('Remove this item?')) { setDeleting(true); onDelete(item.id) } }}
              disabled={deleting}
              style={{ padding: '2px 6px', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
            >✕</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, footer }: {
  title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHeader}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={S.modalBody}>{children}</div>
        {footer && <div style={S.modalFooter}>{footer}</div>}
      </div>
    </div>
  )
}

// ── Mileage Modal ─────────────────────────────────────────────────────────────

function MileageModal({ onAdd, onClose, alreadyAddedTripIds }: {
  onAdd: (trip_ids: string[]) => Promise<void>
  onClose: () => void
  alreadyAddedTripIds: string[]
}) {
  const [trips,    setTrips]    = useState<Trip[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/trips?status=FINAL')
      .then(r => r.json())
      .then(j => {
        setTrips((j.items ?? []).filter((t: Trip) => !alreadyAddedTripIds.includes(t.id)))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [alreadyAddedTripIds])

  function toggle(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function handleAdd() {
    if (selected.size === 0) { setError('Select at least one trip.'); return }
    setSaving(true); setError(null)
    try { await onAdd([...selected]) }
    catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const footer = (
    <button
      onClick={handleAdd} disabled={saving || selected.size === 0}
      style={{ ...S.btnModalAdd, opacity: saving || selected.size === 0 ? 0.45 : 1 }}
    >
      {saving ? 'Adding…' : `Add ${selected.size > 0 ? selected.size + ' ' : ''}Trip${selected.size !== 1 ? 's' : ''}`}
    </button>
  )

  return (
    <Modal title="Add Mileage" onClose={onClose} footer={footer}>
      {loading
        ? <div style={S.mInfo}>Loading trips…</div>
        : trips.length === 0
          ? <div style={S.mInfo}>No eligible trips found.<br />Complete a trip first.</div>
          : <>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Select one or more completed trips:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {trips.map(t => {
                  const isSel = selected.has(t.id)
                  return (
                    <button key={t.id} onClick={() => toggle(t.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                      border: `1.5px solid ${isSel ? '#0f172a' : '#e2e8f0'}`,
                      borderRadius: 10, backgroundColor: isSel ? '#f8fafc' : '#fff',
                      cursor: 'pointer', textAlign: 'left',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                          {t.origin_text && t.destination_text
                            ? `${t.origin_text} → ${t.destination_text}`
                            : t.calculation_mode === 'GPS_TRACKING' ? 'GPS Trip' : 'Planned Trip'}
                        </div>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtKm(t.final_distance_m)} · {fmtDate(t.started_at)}</span>
                      </div>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        border: `2px solid ${isSel ? '#0f172a' : '#cbd5e1'}`,
                        backgroundColor: isSel ? '#0f172a' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {isSel ? '✓' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </>
      }
      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── Expense Modal (Meal + Lodging) ────────────────────────────────────────────

function ExpenseModal({ type, onAdd, onClose, editMode = false, initialData }: {
  type: 'MEAL' | 'LODGING'
  onAdd: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
  editMode?: boolean
  itemId?: string
  initialData?: Partial<ClaimItem>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const initMode      = (initialData?.mode as 'FIXED_RATE' | 'RECEIPT') ?? 'FIXED_RATE'
  const initDate      = initialData?.claim_date?.slice(0, 10) ?? today
  const initMerchant  = initialData?.merchant ?? ''
  const initNotes     = initialData?.notes    ?? ''
  const initAmount    = initialData?.amount   ? String(initialData.amount) : ''
  const initCheckIn   = initialData?.lodging_check_in?.slice(0, 10)  ?? today
  const initCheckOut  = initialData?.lodging_check_out?.slice(0, 10) ?? today
  const initNights    = initialData?.qty ? String(initialData.qty) : '1'
  const initSession   = initialData?.meal_session ?? ''
  const initFullDay   = initSession === 'FULL_DAY'
  const initSessions  = initSession && !initFullDay && initSession !== ''
    ? new Set<'MORNING' | 'NOON' | 'EVENING'>([initSession as 'MORNING' | 'NOON' | 'EVENING'])
    : new Set<'MORNING' | 'NOON' | 'EVENING'>()

  const [mode,        setMode]        = useState<'FIXED_RATE' | 'RECEIPT'>(initMode)
  const [claimDate,   setClaimDate]   = useState(initDate)
  const [merchant,    setMerchant]    = useState(initMerchant)
  const [notes,       setNotes]       = useState(initNotes)
  const [amount,      setAmount]      = useState(initAmount)
  const [checkIn,     setCheckIn]     = useState(initCheckIn)
  const [checkOut,    setCheckOut]    = useState(initCheckOut)
  const [nights,      setNights]      = useState(initNights)
  const [fullDay,     setFullDay]     = useState(initFullDay)
  const [sessions,    setSessions]    = useState<Set<'MORNING' | 'NOON' | 'EVENING'>>(initSessions)
  const [receiptPath, setReceiptPath] = useState<string | null>(null)
  const [rates,       setRates]       = useState<MealRates>({ morning: 25, noon: 25, evening: 25, fullDay: 60 })
  const [lodgingRate, setLodgingRate] = useState(120)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/rates/current').then(r => r.json()).then(j => {
      if (j.rates) {
        setRates({
          morning: j.rates.meal_rate_morning ?? j.rates.meal_rate_per_session ?? 25,
          noon:    j.rates.meal_rate_noon    ?? j.rates.meal_rate_per_session ?? 25,
          evening: j.rates.meal_rate_evening ?? j.rates.meal_rate_per_session ?? 25,
          fullDay: j.rates.meal_rate_full_day ?? 60,
        })
        setLodgingRate(j.rates.lodging_rate_default ?? 120)
      }
    }).catch(() => {})
  }, [])

  function tickFullDay() {
    setFullDay(prev => { if (!prev) setSessions(new Set()); return !prev })
  }
  function tickSession(key: 'MORNING' | 'NOON' | 'EVENING') {
    if (fullDay) return
    setSessions(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n })
  }

  const nothingSelected = !fullDay && sessions.size === 0
  const mealTotal = fullDay
    ? rates.fullDay
    : [...sessions].reduce((s, k) => s + (rates[k.toLowerCase() as keyof MealRates] ?? 0), 0)

  async function handleAdd() {
    setError(null)
    if (type === 'LODGING') {
      if (!checkIn) { setError('Check-in date is required.'); return }
      const nightCount = parseInt(nights) || 1
      setSaving(true)
      try {
        await onAdd({
          mode, claim_date: checkIn, nights: nightCount,
          lodging_check_in: checkIn, lodging_check_out: checkOut,
          amount: mode === 'FIXED_RATE' ? lodgingRate * nightCount : parseFloat(amount),
          rate:   mode === 'FIXED_RATE' ? lodgingRate : undefined,
          receipt_path: mode === 'RECEIPT' && receiptPath ? receiptPath : undefined,
          merchant: merchant.trim() || undefined, notes: notes.trim() || undefined,
        })
      } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
      return
    }
    if (!claimDate) { setError('Date is required.'); return }
    if (mode === 'RECEIPT') {
      if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return }
      setSaving(true)
      try {
        await onAdd({
          mode: 'RECEIPT', claim_date: claimDate, amount: parseFloat(amount),
          receipt_path: receiptPath ?? undefined,
          merchant: merchant.trim() || undefined, notes: notes.trim() || undefined,
        })
      } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
      return
    }
    if (nothingSelected) { setError('Select at least one session.'); return }
    setSaving(true)
    try {
      if (fullDay) {
        await onAdd({ mode: 'FIXED_RATE', claim_date: claimDate, meal_session: 'FULL_DAY', amount: rates.fullDay, rate: rates.fullDay })
      } else {
        for (const s of sessions) {
          const r = rates[s.toLowerCase() as keyof MealRates]
          await onAdd({ mode: 'FIXED_RATE', claim_date: claimDate, meal_session: s, amount: r, rate: r })
        }
      }
    } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const nightCount = parseInt(nights) || 1
  const btnLabel = saving
    ? (editMode ? 'Saving…' : 'Adding…')
    : type === 'LODGING'
      ? mode === 'FIXED_RATE' ? `Add Lodging · MYR ${(lodgingRate * nightCount).toFixed(2)}` : 'Add Lodging'
      : mode === 'RECEIPT'
        ? amount && parseFloat(amount) > 0 ? `Add Meal · MYR ${parseFloat(amount).toFixed(2)}` : 'Add Meal'
        : nothingSelected ? 'Add Meal' : `Add Meal · MYR ${mealTotal.toFixed(2)}`

  const btnDisabled = saving
    || (type === 'MEAL' && mode === 'FIXED_RATE' && nothingSelected)
    || (type === 'MEAL' && mode === 'RECEIPT' && (!amount || parseFloat(amount) <= 0))

  return (
    <Modal
      title={editMode ? (type === 'MEAL' ? 'Edit Meal' : 'Edit Lodging') : (type === 'MEAL' ? 'Add Meal' : 'Add Lodging')}
      onClose={onClose}
      footer={<button onClick={handleAdd} disabled={btnDisabled} style={{ ...S.btnModalAdd, opacity: btnDisabled ? 0.45 : 1 }}>{btnLabel}</button>}
    >
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 4 }}>
        {(['FIXED_RATE', 'RECEIPT'] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            flex: 1, padding: '7px 0', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            backgroundColor: mode === m ? '#fff' : 'transparent',
            color:           mode === m ? '#0f172a' : '#64748b',
            boxShadow:       mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>
            {m === 'FIXED_RATE' ? 'Fixed Rate' : 'Receipt'}
          </button>
        ))}
      </div>

      {type === 'MEAL' && (
        <div style={S.field}>
          <label style={S.label}>Date <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="date" value={claimDate} onChange={e => setClaimDate(e.target.value)} style={S.input} />
        </div>
      )}

      {type === 'MEAL' && mode === 'FIXED_RATE' && (
        <div style={S.field}>
          <label style={S.label}>Sessions <span style={{ color: '#dc2626' }}>*</span></label>
          <button onClick={tickFullDay} style={{ ...S.sessionBtn, borderColor: fullDay ? '#0f172a' : '#e2e8f0', backgroundColor: fullDay ? '#f8fafc' : '#fff', marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>☀️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Full Day</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Breakfast + Lunch + Dinner</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>MYR {rates.fullDay.toFixed(2)}</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>or by session</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </div>
          {SESSION_META.map(s => (
            <button key={s.key} onClick={() => tickSession(s.key)} disabled={fullDay} style={{ ...S.sessionBtn, borderColor: sessions.has(s.key) && !fullDay ? '#0f172a' : '#e2e8f0', backgroundColor: sessions.has(s.key) && !fullDay ? '#f8fafc' : '#fff', opacity: fullDay ? 0.4 : 1, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{s.sub}</div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>MYR {rates[s.rateKey].toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {type === 'LODGING' && (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={S.field}>
              <label style={S.label}>Check-in <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Check-out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={S.input} />
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Nights</label>
            <input type="number" min="1" value={nights} onChange={e => setNights(e.target.value)} style={S.input} />
          </div>
        </>
      )}

      {mode === 'RECEIPT' && (
        <div style={S.field}>
          <label style={S.label}>Amount (MYR) <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={S.input} />
        </div>
      )}

      <div style={S.field}>
        <label style={S.label}>Merchant (optional)</label>
        <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)} style={S.input} />
      </div>
      <div style={S.field}>
        <label style={S.label}>Notes (optional)</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={S.input} />
      </div>
      <div style={S.field}>
        <label style={S.label}>Receipt (optional)</label>
        <ReceiptUploader purpose="RECEIPT" onUploaded={(url) => setReceiptPath(url)} />
      </div>

      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── Toll / Parking Modal ──────────────────────────────────────────────────────
// "Paid by TNG" toggle:
//   ON  → no amount field; item saved mode:'TNG', amount:0.
//         Amount will be auto-filled when user links a TNG statement entry.
//   OFF → manual amount field (Visa / cash / other method).

function TollParkingModal({ type, onAdd, onClose }: {
  type: 'TOLL' | 'PARKING'
  onAdd: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [tngMode,       setTngMode]       = useState(false)
  const [claimDate,     setClaimDate]     = useState(today)
  const [amount,        setAmount]        = useState('')
  const [entryLocation, setEntryLocation] = useState('')
  const [exitLocation,  setExitLocation]  = useState('')
  const [location,      setLocation]      = useState('')
  const [notes,         setNotes]         = useState('')
  const [receiptPath,   setReceiptPath]   = useState<string | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleAdd() {
    setError(null)
    if (!claimDate) { setError('Date is required.'); return }
    if (!tngMode && (!amount || parseFloat(amount) <= 0)) {
      setError('Enter the amount paid.'); return
    }
    setSaving(true)
    try {
      await onAdd({
        type,
        mode:          tngMode ? 'TNG' : 'MANUAL',
        amount:        tngMode ? 0 : parseFloat(amount),
        claim_date:    claimDate,
        entry_location: type === 'TOLL'    ? entryLocation.trim() || undefined : undefined,
        exit_location:  type === 'TOLL'    ? exitLocation.trim()  || undefined : undefined,
        location:       type === 'PARKING' ? location.trim()      || undefined : undefined,
        notes:          notes.trim() || undefined,
        receipt_url:    !tngMode && receiptPath ? receiptPath : undefined,
      })
    } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const amtNum     = parseFloat(amount)
  const btnDisabled = saving || (!tngMode && (!amount || parseFloat(amount) <= 0))
  const label      = type === 'TOLL' ? 'Toll' : 'Parking'
  const btnLabel   = saving
    ? 'Adding…'
    : tngMode
      ? `Add ${label} · TNG`
      : `Add ${label}${!isNaN(amtNum) && amtNum > 0 ? ` · MYR ${amtNum.toFixed(2)}` : ''}`

  return (
    <Modal
      title={`Add ${label}`}
      onClose={onClose}
      footer={
        <button onClick={handleAdd} disabled={btnDisabled} style={{ ...S.btnModalAdd, opacity: btnDisabled ? 0.45 : 1 }}>
          {btnLabel}
        </button>
      }
    >
      {/* Date */}
      <div style={S.field}>
        <label style={S.label}>Date <span style={{ color: '#dc2626' }}>*</span></label>
        <input type="date" value={claimDate} onChange={e => setClaimDate(e.target.value)} style={S.input} />
      </div>

      {/* ── TNG TOGGLE ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => { setTngMode(p => !p); setAmount('') }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 14px', border: `2px solid ${tngMode ? '#0f172a' : '#e2e8f0'}`,
          borderRadius: 12, backgroundColor: tngMode ? '#f8fafc' : '#fff',
          cursor: 'pointer', textAlign: 'left', width: '100%',
        }}
      >
        {/* Toggle pill */}
        <div style={{
          width: 40, height: 22, borderRadius: 11, flexShrink: 0,
          backgroundColor: tngMode ? '#0f172a' : '#cbd5e1',
          position: 'relative', transition: 'background-color 0.15s',
        }}>
          <div style={{
            position: 'absolute', top: 3, left: tngMode ? 20 : 3,
            width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
            transition: 'left 0.15s',
          }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Paid by TNG (Touch 'n Go)
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            {tngMode
              ? 'Amount will be auto-filled from your TNG Statement in TNG Importer'
              : 'Toggle ON if this was charged to your TNG card'}
          </div>
        </div>
      </button>

      {/* ── TNG ON: info banner ─────────────────────────────────────────────── */}
      {tngMode && (
        <div style={{
          display: 'flex', gap: 10, padding: '12px 14px',
          backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💳</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e' }}>
              TNG — amount pending
            </div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 2, lineHeight: 1.5 }}>
              This item will show as <strong>TNG · Link pending</strong> in your claim.
              Go to <strong>TNG Importer</strong> to upload your eStatement and link
              the matching transaction to fill in the exact amount.
            </div>
          </div>
        </div>
      )}

      {/* ── TNG OFF: manual amount + receipt ───────────────────────────────── */}
      {!tngMode && (
        <>
          <div style={S.field}>
            <label style={S.label}>Amount (MYR) <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              type="number" min="0" step="0.01" placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
              style={S.input}
            />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Visa / cash / other method</span>
          </div>
          <div style={S.field}>
            <label style={S.label}>Receipt (optional)</label>
            <ReceiptUploader purpose="RECEIPT" onUploaded={(url) => setReceiptPath(url)} />
          </div>
        </>
      )}

      {/* Location fields */}
      {type === 'TOLL' && (
        <>
          <div style={S.field}>
            <label style={S.label}>Entry Plaza (optional)</label>
            <input type="text" placeholder="e.g. PLUS – TAPAH" value={entryLocation} onChange={e => setEntryLocation(e.target.value)} style={S.input} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Exit Plaza (optional)</label>
            <input type="text" placeholder="e.g. PLUS – SUBANG" value={exitLocation} onChange={e => setExitLocation(e.target.value)} style={S.input} />
          </div>
        </>
      )}
      {type === 'PARKING' && (
        <div style={S.field}>
          <label style={S.label}>Location (optional)</label>
          <input type="text" placeholder="e.g. IOI City Mall" value={location} onChange={e => setLocation(e.target.value)} style={S.input} />
        </div>
      )}

      <div style={S.field}>
        <label style={S.label}>Notes (optional)</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={S.input} />
      </div>

      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── Transport Modal (Taxi / Grab / Train / Flight) ────────────────────────────

function TransportModal({ onAdd, onClose }: {
  onAdd: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [transportType, setTransportType] = useState<TransportType>('GRAB')
  const [claimDate,     setClaimDate]     = useState(today)
  const [amount,        setAmount]        = useState('')
  const [merchant,      setMerchant]      = useState('')
  const [notes,         setNotes]         = useState('')
  const [receiptPath,   setReceiptPath]   = useState<string | null>(null)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleAdd() {
    setError(null)
    if (!claimDate)                         { setError('Date is required.'); return }
    if (!amount || parseFloat(amount) <= 0) { setError('Amount is required.'); return }
    setSaving(true)
    try {
      await onAdd({
        type: transportType, amount: parseFloat(amount), claim_date: claimDate,
        merchant: merchant.trim() || undefined, notes: notes.trim() || undefined,
        receipt_url: receiptPath ?? undefined,
      })
    } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const amtNum    = parseFloat(amount)
  const btnDisabled = saving || !amount || parseFloat(amount) <= 0
  const btnLabel  = saving
    ? 'Adding…'
    : `Add ${transportType.charAt(0) + transportType.slice(1).toLowerCase()}${!isNaN(amtNum) && amtNum > 0 ? ` · MYR ${amtNum.toFixed(2)}` : ''}`

  return (
    <Modal title="Add Transport" onClose={onClose}
      footer={<button onClick={handleAdd} disabled={btnDisabled} style={{ ...S.btnModalAdd, opacity: btnDisabled ? 0.45 : 1 }}>{btnLabel}</button>}
    >
      <div style={S.field}>
        <label style={S.label}>Transport Type</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {TRANSPORT_META.map(t => (
            <button key={t.type} onClick={() => setTransportType(t.type)} style={{
              flex: 1, paddingTop: 10, paddingBottom: 10, border: 'none', borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              backgroundColor: transportType === t.type ? '#0f172a' : '#f1f5f9',
              color:           transportType === t.type ? '#fff'    : '#64748b',
            }}>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div style={S.field}>
        <label style={S.label}>Date <span style={{ color: '#dc2626' }}>*</span></label>
        <input type="date" value={claimDate} onChange={e => setClaimDate(e.target.value)} style={S.input} />
      </div>
      <div style={S.field}>
        <label style={S.label}>Amount (MYR) <span style={{ color: '#dc2626' }}>*</span></label>
        <input type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} style={S.input} />
      </div>
      <div style={S.field}>
        <label style={S.label}>
          {transportType === 'GRAB' || transportType === 'TAXI' ? 'Route / Description (optional)' : 'Operator / Route (optional)'}
        </label>
        <input
          type="text"
          placeholder={
            transportType === 'GRAB'   ? 'e.g. KL Sentral → KLCC' :
            transportType === 'TAXI'   ? 'e.g. Airport → Hotel' :
            transportType === 'TRAIN'  ? 'e.g. ETS Ipoh → KL Sentral' :
            'e.g. AirAsia KUL → PEN'
          }
          value={merchant} onChange={e => setMerchant(e.target.value)} style={S.input}
        />
      </div>
      <div style={S.field}>
        <label style={S.label}>Notes (optional)</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} style={S.input} />
      </div>
      <div style={S.field}>
        <label style={S.label}>Receipt (optional)</label>
        <ReceiptUploader purpose="RECEIPT" onUploaded={(url) => setReceiptPath(url)} />
      </div>
      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClaimDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [claim,       setClaim]      = useState<Claim | null>(null)
  const [items,       setItems]      = useState<ClaimItem[]>([])
  const [loading,     setLoading]    = useState(true)
  const [error,       setError]      = useState<string | null>(null)
  const [modal,       setModal]      = useState<ModalType>(null)
  const [submitting,  setSubmitting] = useState(false)
  const [submitErr,   setSubmitErr]  = useState<string | null>(null)
  const [sortMode,    setSortMode]   = useState<'DATE_TYPE' | 'TYPE_DATE'>('DATE_TYPE')
  const [deleting,    setDeleting]   = useState(false)
  const [deleteErr,   setDeleteErr]  = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingItem, setEditingItem] = useState<ClaimItem | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch(`/api/claims/${id}`)
    const json = await res.json()
    if (!res.ok) { setError(json.error?.message ?? 'Not found.'); setLoading(false); return }
    setClaim(json.claim); setItems(json.items ?? []); setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function addMileage(trip_ids: string[]) {
    for (const trip_id of trip_ids) {
      const res  = await fetch(`/api/claims/${id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'MILEAGE', trip_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    }
    await load(); setModal(null)
  }

  async function addExpense(type: 'MEAL' | 'LODGING', data: Record<string, unknown>) {
    const { receipt_path, ...rest } = data
    const body = { type, ...rest, ...(receipt_path ? { receipt_url: receipt_path } : {}) }
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null)
  }

  async function addTransportItem(data: Record<string, unknown>) {
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null)
  }

  async function deleteItem(itemId: string) {
    await fetch(`/api/claims/${id}/items/${itemId}`, { method: 'DELETE' })
    await load()
  }

  async function updateExpense(itemId: string, type: 'MEAL' | 'LODGING', data: Record<string, unknown>) {
    const { receipt_path, ...rest } = data
    const body = { type, ...rest, ...(receipt_path ? { receipt_url: receipt_path } : {}) }
    const res  = await fetch(`/api/claims/${id}/items/${itemId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update.')
    await load(); setEditingItem(null); setModal(null)
  }

  async function handleSubmit() {
    setSubmitting(true); setSubmitErr(null)
    const res  = await fetch(`/api/claims/${id}/submit`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) { setSubmitErr(json.error?.message ?? 'Failed to submit.'); setSubmitting(false); return }
    await load(); setSubmitting(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a' }} />
    </div>
  )
  if (error) return <div style={{ padding: 24, color: '#dc2626', fontSize: 14 }}>{error}</div>
  if (!claim) return null

  const isDraft = claim.status === 'DRAFT'
  const locked  = !isDraft
  const title   = claim.title || periodLabel(claim.period_start, claim.period_end)

  const typeOrder: Record<string, number> = {
    MILEAGE: 0, MEAL: 1, LODGING: 2,
    TOLL: 3, PARKING: 4,
    TAXI: 5, GRAB: 6, TRAIN: 7, FLIGHT: 8,
  }

  // TNG items have amount=0, exclude from displayed total (shown separately)
  const confirmedTotal = items
    .filter(i => i.mode !== 'TNG')
    .reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
  const tngPendingCount = items.filter(i => i.mode === 'TNG').length

  return (
    <div style={S.page}>

      {/* Back + status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/claims" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
          ← Claims
        </Link>
        <span style={{
          fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12,
          backgroundColor: isDraft ? '#fef9c3' : '#f0fdf4',
          color:           isDraft ? '#854d0e' : '#15803d',
        }}>
          {isDraft ? 'Draft' : '✓ Submitted'}
        </span>
      </div>

      {/* Title */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{title}</h1>
        {claim.period_start && (
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {periodLabel(claim.period_start, claim.period_end)}
          </p>
        )}
      </div>

      {locked && (
        <div style={{ padding: '12px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#15803d' }}>
          🔒 Submitted — this claim is locked.
        </div>
      )}

      {/* TNG pending banner */}
      {isDraft && tngPendingCount > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💳</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#854d0e' }}>
              {tngPendingCount} TNG item{tngPendingCount > 1 ? 's' : ''} pending link
            </div>
            <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>
              Upload your TNG eStatement to fill in the amounts.
            </div>
          </div>
          <Link href="/tng" style={{ fontSize: 12, fontWeight: 700, color: '#854d0e', textDecoration: 'none', padding: '4px 10px', border: '1px solid #f59e0b', borderRadius: 8, backgroundColor: '#fff', flexShrink: 0 }}>
            Open TNG Importer →
          </Link>
        </div>
      )}

      {/* Items */}
      <div style={S.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Items ({items.length})</span>
          {items.length > 1 && (
            <div style={{ display: 'flex', gap: 4, backgroundColor: '#f8fafc', borderRadius: 8, padding: 3 }}>
              {(['DATE_TYPE', 'TYPE_DATE'] as const).map(m => (
                <button key={m} onClick={() => setSortMode(m)} style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer',
                  backgroundColor: sortMode === m ? '#0f172a' : 'transparent',
                  color:           sortMode === m ? '#fff'    : '#64748b',
                }}>
                  {m === 'DATE_TYPE' ? '📅 Date' : '🏷 Type'}
                </button>
              ))}
            </div>
          )}
        </div>
        {items.length === 0
          ? <div style={{ padding: '24px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No items yet.</div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[...items].sort((a, b) => {
                const dateA = a.claim_date ?? a.lodging_check_in ?? ''
                const dateB = b.claim_date ?? b.lodging_check_in ?? ''
                const tA = typeOrder[a.type] ?? 9, tB = typeOrder[b.type] ?? 9
                if (sortMode === 'DATE_TYPE') {
                  if (dateA !== dateB) return dateA < dateB ? -1 : 1
                  return tA - tB
                } else {
                  if (tA !== tB) return tA - tB
                  if (dateA !== dateB) return dateA < dateB ? -1 : 1
                  return 0
                }
              }).map(item => (
                <ItemCard
                  key={item.id} item={item} locked={locked}
                  onDelete={deleteItem}
                  onEdit={item => { setEditingItem(item); setModal(item.type === 'MEAL' ? 'EDIT_MEAL' : 'EDIT_LODGING') }}
                />
              ))}
            </div>
        }
      </div>

      {/* Total */}
      <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Confirmed Total</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
            {fmtMyr(isDraft ? confirmedTotal : claim.total_amount)}
          </span>
        </div>
        {isDraft && tngPendingCount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#854d0e', fontWeight: 600 }}>
              💳 + {tngPendingCount} TNG item{tngPendingCount > 1 ? 's' : ''} (amount pending)
            </span>
          </div>
        )}
      </div>

      {/* ── Add buttons — DRAFT only ─────────────────────────────────────── */}
      {isDraft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setModal('MILEAGE')} style={S.btnAdd}>🚗 Mileage</button>
            <button onClick={() => setModal('MEAL')}    style={S.btnAdd}>🍽 Meal</button>
            <button onClick={() => setModal('LODGING')} style={S.btnAdd}>🏨 Lodging</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setModal('TOLL')}      style={S.btnAdd}>🛣️ Toll</button>
            <button onClick={() => setModal('PARKING')}   style={S.btnAdd}>🅿️ Parking</button>
            <button onClick={() => setModal('TRANSPORT')} style={S.btnAdd}>🚕 Transport</button>
          </div>
        </div>
      )}

      {/* Submit */}
      {isDraft && (
        <div>
          {submitErr && <div style={{ ...S.errorBox, marginBottom: 8 }}>{submitErr}</div>}
          {tngPendingCount > 0 && (
            <div style={{ padding: '10px 12px', backgroundColor: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', marginBottom: 8 }}>
              ⚠️ You have {tngPendingCount} TNG item{tngPendingCount > 1 ? 's' : ''} with no amount. Link them in TNG Importer before submitting.
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            style={{ ...S.btnSubmit, opacity: submitting || items.length === 0 ? 0.5 : 1, cursor: submitting || items.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Submitting…' : '✓ Submit Claim'}
          </button>
          {items.length === 0 && (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '6px 0 0', textAlign: 'center' }}>
              Add at least one item before submitting.
            </p>
          )}
        </div>
      )}

      {/* Delete Claim */}
      {isDraft && (
        <div style={{ marginTop: 4 }}>
          {deleteErr && <div style={{ ...S.errorBox, marginBottom: 8 }}>{deleteErr}</div>}
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={S.btnDeleteClaim} disabled={deleting}>
              🗑 Delete Claim
            </button>
          ) : (
            <div style={S.confirmBox}>
              <p style={S.confirmText}>Delete this claim and all its items? This cannot be undone.</p>
              <div style={S.confirmRow}>
                <button
                  onClick={async () => {
                    setDeleting(true); setDeleteErr(null)
                    const res  = await fetch(`/api/claims/${claim?.id}`, { method: 'DELETE' })
                    const json = await res.json()
                    setDeleting(false)
                    if (!res.ok) { setDeleteErr(json.error?.message ?? 'Failed to delete.'); return }
                    router.push('/claims')
                  }}
                  disabled={deleting}
                  style={{ ...S.btnConfirmDelete, opacity: deleting ? 0.5 : 1 }}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete'}
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} style={S.btnCancelDelete}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {modal === 'MILEAGE' && (
        <MileageModal
          onAdd={addMileage} onClose={() => setModal(null)}
          alreadyAddedTripIds={items.filter(i => i.trip_id).map(i => i.trip_id!)}
        />
      )}
      {modal === 'MEAL' && (
        <ExpenseModal type="MEAL" onAdd={d => addExpense('MEAL', d)} onClose={() => setModal(null)} />
      )}
      {modal === 'LODGING' && (
        <ExpenseModal type="LODGING" onAdd={d => addExpense('LODGING', d)} onClose={() => setModal(null)} />
      )}
      {modal === 'EDIT_MEAL' && editingItem && (
        <ExpenseModal type="MEAL" editMode initialData={editingItem}
          onAdd={d => updateExpense(editingItem.id, 'MEAL', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}
      {modal === 'EDIT_LODGING' && editingItem && (
        <ExpenseModal type="LODGING" editMode initialData={editingItem}
          onAdd={d => updateExpense(editingItem.id, 'LODGING', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}
      {modal === 'TOLL' && (
        <TollParkingModal type="TOLL" onAdd={addTransportItem} onClose={() => setModal(null)} />
      )}
      {modal === 'PARKING' && (
        <TollParkingModal type="PARKING" onAdd={addTransportItem} onClose={() => setModal(null)} />
      )}
      {modal === 'TRANSPORT' && (
        <TransportModal onAdd={addTransportItem} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 },
  section:    { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },

  itemCard:   { display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderBottom: '1px solid #f8fafc' },
  iDate:      { width: 78, flexShrink: 0, paddingTop: 2 },
  iBody:      { flex: 1, minWidth: 0 },
  iAmt:       { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },

  btnAdd:          { flex: 1, padding: '12px 8px', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' },
  btnSubmit:       { width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
  btnDeleteClaim:  { width: '100%', padding: '12px', backgroundColor: 'transparent', border: '1.5px solid #fca5a5', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#dc2626', cursor: 'pointer' },
  confirmBox:      { padding: '14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 },
  confirmText:     { fontSize: 13, color: '#374151', margin: '0 0 12px' },
  confirmRow:      { display: 'flex', gap: 8 },
  btnConfirmDelete:{ flex: 1, padding: '10px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  btnCancelDelete: { flex: 1, padding: '10px', backgroundColor: '#fff', color: '#374151', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },

  overlay:    { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, paddingBottom: 64 },
  modal:      { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: 'calc(85vh - 64px)', display: 'flex', flexDirection: 'column' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid #f1f5f9', flexShrink: 0 },
  modalBody:  { paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 },
  modalFooter:{ paddingTop: 12, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderTop: '1px solid #f1f5f9', flexShrink: 0 },
  mInfo:      { color: '#64748b', fontSize: 13, textAlign: 'center', padding: '24px 0', lineHeight: 1.6 },
  btnModalAdd:{ padding: '13px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },

  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:      { paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff', outline: 'none' },
  errorBox:   { paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },
  sessionBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left', width: '100%' },
}
