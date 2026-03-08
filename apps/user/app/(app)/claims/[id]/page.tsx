'use client'
// apps/user/app/(app)/claims/[id]/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }              from 'next/navigation'
import Link                                  from 'next/link'

import { ReceiptUploader } from '@/components/ReceiptUploader'

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

type ModalType = 'MILEAGE' | 'MEAL' | 'LODGING' | 'EDIT_MEAL' | 'EDIT_LODGING' | null

type MealRates = {
  morning: number
  noon:    number
  evening: number
  fullDay: number
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtMyr = (n: number) => 'MYR ' + Number(n).toFixed(2)
const fmtKm  = (m: number | null) => m ? (m / 1000).toFixed(2) + ' km' : '—'
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

const TYPE_ICON: Record<string, string> = { MILEAGE: '🚗', MEAL: '🍽', LODGING: '🏨' }

const SESSION_LABEL: Record<string, string> = {
  FULL_DAY: 'Full Day', MORNING: 'Morning', NOON: 'Noon', EVENING: 'Evening',
}

const SESSION_META = [
  { key: 'MORNING' as const, icon: '🌅', label: 'Morning', sub: 'Breakfast', rateKey: 'morning' as const },
  { key: 'NOON'    as const, icon: '🌤', label: 'Noon',    sub: 'Lunch',     rateKey: 'noon'    as const },
  { key: 'EVENING' as const, icon: '🌙', label: 'Evening', sub: 'Dinner',    rateKey: 'evening' as const },
]

// ── Item Card ─────────────────────────────────────────────────────────────────
// Layout: [date] | [icon type · sub] | [amount × delete]

function ItemCard({ item, onDelete, onEdit, locked }: {
  item: ClaimItem; onDelete: (id: string) => void; onEdit: (item: ClaimItem) => void; locked: boolean
}) {
  const [deleting, setDeleting] = useState(false)

  function sub() {
    if (item.type === 'MILEAGE')
      return `${fmtKm(item.qty ? item.qty * 1000 : null)} × MYR ${item.rate?.toFixed(2)}/km`
    const parts: string[] = []
    if (item.meal_session) parts.push(SESSION_LABEL[item.meal_session] ?? item.meal_session)
    if (item.type === 'LODGING' && item.qty) parts.push(`${item.qty} night${item.qty !== 1 ? 's' : ''}`)
    if (item.mode === 'FIXED_RATE' && item.rate) parts.push(`MYR ${Number(item.rate).toFixed(2)} fixed`)
    if (item.merchant) parts.push(item.merchant)
    return parts.join(' · ') || (item.mode === 'RECEIPT' ? 'Receipt' : 'Fixed rate')
  }

  return (
    <div style={S.itemCard}>
      {/* Col 1 — date */}
      <div style={S.iDate}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>
          {fmtDate(item.claim_date ?? item.lodging_check_in)}
        </span>
      </div>

      {/* Col 2 — type + sub */}
      <div style={S.iBody}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13 }}>{TYPE_ICON[item.type] ?? '📄'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.type}</span>
          {item.receipt_url && (
            <span style={{ fontSize: 9, fontWeight: 700, paddingTop: 1, paddingBottom: 1,
              paddingLeft: 5, paddingRight: 5, borderRadius: 6,
              backgroundColor: '#f0fdf4', color: '#15803d' }}>
              🧾
            </span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub()}</div>
        {item.notes && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>{item.notes}</div>}
      </div>

      {/* Col 3 — amount + actions */}
      <div style={S.iAmt}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{fmtMyr(item.amount)}</span>
        {!locked && (
          <div style={{ display: 'flex', gap: 4 }}>
            {(item.type === 'MEAL' || item.type === 'LODGING') && (
              <button
                onClick={() => onEdit(item)}
                style={{ padding: '2px 6px', backgroundColor: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12 }}
              >✏</button>
            )}
            <button
              onClick={() => { if (confirm('Remove this item?')) { setDeleting(true); onDelete(item.id) } }}
              disabled={deleting}
              style={{ padding: '2px 6px', backgroundColor: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
            >✕</button>
          </div>
        )}
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
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleAdd() {
    if (selected.size === 0) { setError('Select at least one trip.'); return }
    setSaving(true); setError(null)
    try { await onAdd(Array.from(selected)) }
    catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const footer = (
    <button onClick={handleAdd} disabled={saving || selected.size === 0}
      style={{ ...S.btnModalAdd, opacity: saving || selected.size === 0 ? 0.5 : 1 }}>
      {saving ? 'Adding…' : selected.size === 0 ? 'Select trips above' : `Add ${selected.size} Trip${selected.size > 1 ? 's' : ''}`}
    </button>
  )

  return (
    <Modal title="Add Mileage" onClose={onClose} footer={footer}>
      {loading
        ? <div style={S.mInfo}>Loading trips…</div>
        : trips.length === 0
          ? <div style={S.mInfo}>{alreadyAddedTripIds.length > 0 ? 'All your FINAL trips are already in this claim.' : 'No FINAL trips found. Complete a GPS or planned trip first.'}</div>
          : (
            <>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Tap to select one or more trips.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {trips.map(t => {
                  const isSel = selected.has(t.id)
                  const label = t.origin_text && t.destination_text
                    ? `${t.origin_text} → ${t.destination_text}`
                    : t.calculation_mode === 'GPS_TRACKING' ? 'GPS Trip' : 'Planned Trip'
                  return (
                    <button key={t.id} onClick={() => toggle(t.id)} style={{
                      ...S.tripOpt,
                      borderColor:     isSel ? '#0f172a' : '#e2e8f0',
                      backgroundColor: isSel ? '#f0f9ff' : '#fff',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, textAlign: 'left' }}>{label}</span>
                        <span style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSel ? '#0f172a' : '#cbd5e1'}`, backgroundColor: isSel ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {isSel ? '✓' : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtKm(t.final_distance_m)} · {fmtDate(t.started_at)}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── Expense Modal (Meal + Lodging) ────────────────────────────────────────────
// Meal: checkboxes — Full Day OR individual sessions (mutually exclusive for Full Day).
// Each ticked session → one claim_item row.

function ExpenseModal({ type, onAdd, onClose, editMode = false, initialData, itemId }: {
  type: 'MEAL' | 'LODGING'
  onAdd: (data: {
    mode: string; amount?: number; rate?: number; merchant?: string; notes?: string
    receipt_path?: string
    nights?: number; claim_date: string; meal_session?: string
    lodging_check_in?: string; lodging_check_out?: string
  }) => Promise<void>
  onClose: () => void
  editMode?: boolean
  itemId?:   string
  initialData?: Partial<ClaimItem>
}) {
  const today = new Date().toISOString().slice(0, 10)

  // Shared — seeded from initialData when editing
  const initMode    = (initialData?.mode as 'FIXED_RATE' | 'RECEIPT') ?? 'FIXED_RATE'
  const initDate    = initialData?.claim_date?.slice(0, 10) ?? today
  const initMerchant = initialData?.merchant ?? ''
  const initNotes   = initialData?.notes     ?? ''
  const initAmount  = initialData?.amount    ? String(initialData.amount) : ''
  const initCheckIn  = initialData?.lodging_check_in?.slice(0, 10)  ?? today
  const initCheckOut = initialData?.lodging_check_out?.slice(0, 10) ?? today
  const initNights   = initialData?.qty ? String(initialData.qty) : '1'
  const initSession  = initialData?.meal_session ?? ''
  const initFullDay  = initSession === 'FULL_DAY'
  const initSessions = initSession && !initFullDay && initSession !== ''
    ? new Set([initSession as 'MORNING' | 'NOON' | 'EVENING'])
    : new Set<'MORNING' | 'NOON' | 'EVENING'>()

  const [mode,      setMode]      = useState<'FIXED_RATE' | 'RECEIPT'>(initMode)
  const [claimDate, setClaimDate] = useState(initDate)
  const [merchant,  setMerchant]  = useState(initMerchant)
  const [notes,     setNotes]     = useState(initNotes)
  const [amount,    setAmount]    = useState(initAmount)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // MEAL
  const [fullDay,   setFullDay]   = useState(initFullDay)
  const [sessions,  setSessions]  = useState<Set<'MORNING' | 'NOON' | 'EVENING'>>(initSessions)
  const [rates,     setRates]     = useState<MealRates>({ morning: 20, noon: 30, evening: 30, fullDay: 60 })

  // LODGING
  const [checkIn,      setCheckIn]      = useState(initCheckIn)
  const [checkOut,     setCheckOut]     = useState(initCheckOut)
  const [nights,       setNights]       = useState(initNights)
  const [lodgingRate,  setLodgingRate]  = useState<number>(120)

  // Receipt upload path — seeded from existing item when editing
  const [receiptPath, setReceiptPath] = useState<string>(initialData?.receipt_url ?? '')

  // Fetch rates once on mount
  useEffect(() => {
    fetch('/api/settings/rates')
      .then(r => r.json())
      .then(j => {
        setRates({
          morning: Number(j.rate?.meal_rate_morning   ?? 20),
          noon:    Number(j.rate?.meal_rate_noon      ?? 30),
          evening: Number(j.rate?.meal_rate_evening   ?? 30),
          fullDay: Number(j.rate?.meal_rate_full_day  ?? 60),
        })
        setLodgingRate(Number(j.rate?.lodging_rate_default ?? 120))
      })
      .catch(() => {})
  }, [])

  // Auto-calc nights
  useEffect(() => {
    if (type === 'LODGING' && checkOut > checkIn) {
      const d = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
      if (d > 0) setNights(String(d))
    }
  }, [checkIn, checkOut, type])

  // Toggle full day — clears sessions
  function tickFullDay() {
    const next = !fullDay
    setFullDay(next)
    if (next) setSessions(new Set())
  }

  // Toggle session — clears full day
  function tickSession(key: 'MORNING' | 'NOON' | 'EVENING') {
    setFullDay(false)
    setSessions(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const nothingSelected = !fullDay && sessions.size === 0

  // Running total for Fixed Rate meal
  const mealTotal = fullDay
    ? rates.fullDay
    : Array.from(sessions).reduce((sum, k) => {
        const meta = SESSION_META.find(s => s.key === k)
        return sum + (meta ? rates[meta.rateKey] : 0)
      }, 0)

  async function handleAdd() {
    if (!claimDate) { setError('Date is required.'); return }

    if (type === 'MEAL') {
      // RECEIPT mode — no session selection needed, just amount
      if (mode === 'RECEIPT') {
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return }
        setSaving(true); setError(null)
        try {
          await onAdd({
            mode, claim_date: claimDate,
            amount:       parseFloat(amount),
            receipt_path: receiptPath || undefined,
            merchant: merchant.trim() || undefined,
            notes:    notes.trim()    || undefined,
          })
        } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
        return
      }
      // FIXED_RATE mode — session selection required
      if (nothingSelected) { setError('Tick at least one session.'); return }
      setSaving(true); setError(null)
      try {
        if (fullDay) {
          await onAdd({
            mode, claim_date: claimDate, meal_session: 'FULL_DAY',
            merchant: merchant.trim() || undefined,
            notes:    notes.trim()    || undefined,
          })
        } else {
          for (const key of Array.from(sessions)) {
            await onAdd({
              mode, claim_date: claimDate, meal_session: key,
              merchant: merchant.trim() || undefined,
              notes:    notes.trim()    || undefined,
            })
          }
        }
      } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
      return
    }

    // LODGING
    const nightCount = parseInt(nights) || 1
    if (mode === 'RECEIPT' && (!amount || parseFloat(amount) <= 0)) {
      setError('Enter a valid amount.'); return
    }
    setSaving(true); setError(null)
    try {
      await onAdd({
        mode, claim_date: checkIn, // check-in IS the claim date for lodging
        nights: nightCount,
        lodging_check_in: checkIn, lodging_check_out: checkOut,
        // FIXED_RATE: compute rate × nights; RECEIPT: use entered amount
        amount:       mode === 'FIXED_RATE'
                        ? lodgingRate * nightCount
                        : parseFloat(amount),
        rate:         mode === 'FIXED_RATE' ? lodgingRate : undefined,
        receipt_path: mode === 'RECEIPT' && receiptPath ? receiptPath : undefined,
        merchant: merchant.trim() || undefined,
        notes:    notes.trim()    || undefined,
      })
    } catch (e: unknown) { setError((e as Error).message); setSaving(false) }
  }

  const nightCount = parseInt(nights) || 1
  const lodgingTotal = lodgingRate * nightCount

  const btnLabel = saving ? (editMode ? 'Saving…' : 'Adding…')
    : type === 'LODGING'
      ? mode === 'FIXED_RATE'
        ? `Add Lodging · MYR ${lodgingTotal.toFixed(2)}`
        : 'Add Lodging'
    : /* MEAL */
      mode === 'RECEIPT'
        ? amount && parseFloat(amount) > 0
          ? `Add Meal · MYR ${parseFloat(amount).toFixed(2)}`
          : 'Add Meal'
        : nothingSelected
          ? 'Add Meal'
          : `Add Meal · MYR ${mealTotal.toFixed(2)}`

  // Disable logic per mode/type
  const mealDisabled   = type === 'MEAL'    && mode === 'FIXED_RATE' && nothingSelected
  const mealRxDisabled = type === 'MEAL'    && mode === 'RECEIPT'    && (!amount || parseFloat(amount) <= 0)
  const btnDisabled    = saving || mealDisabled || mealRxDisabled

  const footer = (
    <button
      onClick={handleAdd}
      disabled={btnDisabled}
      style={{ ...S.btnModalAdd, opacity: btnDisabled ? 0.45 : 1 }}
    >
      {btnLabel}
    </button>
  )

  return (
    <Modal title={editMode ? (type === 'MEAL' ? 'Edit Meal' : 'Edit Lodging') : (type === 'MEAL' ? 'Add Meal' : 'Add Lodging')} onClose={onClose} footer={footer}>

      {/* Date — Meal only; Lodging uses Check-in as the claim date */}
      {type === 'MEAL' && (
        <div style={S.field}>
          <label style={S.label}>Date <span style={{ color: '#dc2626' }}>*</span></label>
          <input type="date" value={claimDate} onChange={e => setClaimDate(e.target.value)} style={S.input} />
        </div>
      )}

      {/* ── MEAL checkboxes — only shown in FIXED_RATE mode ─────── */}
      {type === 'MEAL' && mode === 'FIXED_RATE' && (
        <div style={S.field}>
          <label style={S.label}>Sessions to claim <span style={{ color: '#dc2626' }}>*</span></label>

          {/* Full Day */}
          <CheckRow
            checked={fullDay}
            onToggle={tickFullDay}
            icon="☀️"
            label="Full Day"
            sub="Breakfast + Lunch + Dinner (all sessions)"
            amt={`MYR ${rates.fullDay.toFixed(2)}`}
          />

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>or by session</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
          </div>

          {/* Per session */}
          {SESSION_META.map(s => (
            <CheckRow
              key={s.key}
              checked={sessions.has(s.key)}
              disabled={fullDay}
              onToggle={() => tickSession(s.key)}
              icon={s.icon}
              label={s.label}
              sub={s.sub}
              amt={`MYR ${rates[s.rateKey].toFixed(2)}`}
            />
          ))}
        </div>
      )}

      {/* ── LODGING dates ─────────────────────────────────────────── */}
      {type === 'LODGING' && (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={S.field}>
              <label style={S.label}>Check-in <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} style={S.input} />
            </div>
            <div style={S.field}>
              <label style={S.label}>Check-out <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} style={S.input} />
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 500 }}>
            {nights} night{parseInt(nights) !== 1 ? 's' : ''}
          </p>
        </>
      )}

      {/* Lodging FIXED_RATE rate summary */}
      {type === 'LODGING' && mode === 'FIXED_RATE' && (
        <div style={{
          backgroundColor: '#f8fafc',
          borderWidth: 1, borderStyle: 'solid', borderColor: '#e2e8f0',
          borderRadius: 10,
          paddingTop: 12, paddingBottom: 12, paddingLeft: 14, paddingRight: 14,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Rate per night</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              MYR {lodgingRate.toFixed(2)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>× {parseInt(nights) || 1} night{parseInt(nights) !== 1 ? 's' : ''}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
              MYR {(lodgingRate * (parseInt(nights) || 1)).toFixed(2)}
            </span>
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
            Rate from your Settings. Change it in Settings → Rates.
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div style={S.modeRow}>
        <button onClick={() => setMode('FIXED_RATE')} style={{ ...S.modeBtn, backgroundColor: mode === 'FIXED_RATE' ? '#0f172a' : '#f1f5f9', color: mode === 'FIXED_RATE' ? '#fff' : '#374151' }}>
          ⚡ Fixed Rate
        </button>
        <button onClick={() => setMode('RECEIPT')} style={{ ...S.modeBtn, backgroundColor: mode === 'RECEIPT' ? '#0f172a' : '#f1f5f9', color: mode === 'RECEIPT' ? '#fff' : '#374151' }}>
          🧾 Receipt
        </button>
      </div>

      {mode === 'RECEIPT' && (
        <>
          <div style={S.field}>
            <label style={S.label}>Amount (MYR) <span style={{ color: '#dc2626' }}>*</span></label>
            <input
              value={amount}
              onChange={e => { if (e.target.value === '' || /^\d*\.?\d*$/.test(e.target.value)) setAmount(e.target.value) }}
              placeholder="0.00" inputMode="decimal" style={S.input}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Receipt Photo (optional)</label>
            <ReceiptUploader
              storagePath={receiptPath || null}
              onUploaded={path => setReceiptPath(path)}
            />
          </div>
        </>
      )}

      <div style={S.field}>
        <label style={S.label}>Merchant / Vendor (optional)</label>
        <input value={merchant} onChange={e => setMerchant(e.target.value)}
          placeholder={type === 'MEAL' ? 'e.g. Nasi Kandar Pelita' : 'e.g. Hotel Maya KL'}
          style={S.input} />
      </div>

      <div style={S.field}>
        <label style={S.label}>Notes (optional)</label>
        <input value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="e.g. Working lunch" style={S.input} />
      </div>

      {error && <div style={S.errorBox}>{error}</div>}
    </Modal>
  )
}

// ── CheckRow — reusable checkbox row ─────────────────────────────────────────

function CheckRow({ checked, onToggle, disabled = false, icon, label, sub, amt }: {
  checked: boolean; onToggle: () => void; disabled?: boolean
  icon: string; label: string; sub: string; amt: string
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
        paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
        border: `1.5px solid ${checked ? '#0f172a' : '#e2e8f0'}`,
        borderRadius: 10, cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left', backgroundColor: checked ? '#f0f9ff' : '#fff',
        opacity: disabled ? 0.4 : 1, marginBottom: 6,
        boxSizing: 'border-box',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? '#0f172a' : '#cbd5e1'}`,
        backgroundColor: checked ? '#0f172a' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 800, color: '#fff',
      }}>
        {checked ? '✓' : ''}
      </div>

      {/* Icon + text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
          {icon} {label}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
      </div>

      {/* Amount */}
      <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', flexShrink: 0 }}>{amt}</span>
    </button>
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
  const [deleting,      setDeleting]      = useState(false)
  const [deleteErr,     setDeleteErr]     = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingItem,   setEditingItem]   = useState<ClaimItem | null>(null)

  const load = useCallback(async () => {
    const res  = await fetch(`/api/claims/${id}`)
    const json = await res.json()
    if (!res.ok) { setError(json.error?.message ?? 'Not found.'); setLoading(false); return }
    setClaim(json.claim)
    setItems(json.items ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  async function addMileage(trip_ids: string[]) {
    for (const trip_id of trip_ids) {
      const res  = await fetch(`/api/claims/${id}/items`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ type: 'MILEAGE', trip_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    }
    await load(); setModal(null)
  }

  async function addExpense(type: 'MEAL' | 'LODGING', data: Record<string, unknown>) {
    // receipt_path from ReceiptUploader → stored as receipt_url in DB
    const { receipt_path, ...rest } = data
    const body = {
      type,
      ...rest,
      ...(receipt_path ? { receipt_url: receipt_path } : {}),
    }
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(body),
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
    const { receipt_path, ...rest } = data as Record<string, unknown>
    const body = {
      type,
      ...rest,
      ...(receipt_path ? { receipt_url: receipt_path } : {}),
    }
    const res  = await fetch(`/api/claims/${id}/items/${itemId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(body),
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

  if (error) return (
    <div style={{ padding: 24, color: '#dc2626', fontSize: 14 }}>{error}</div>
  )

  if (!claim) return null

  const isDraft  = claim.status === 'DRAFT'
  const locked   = !isDraft
  const title    = claim.title || periodLabel(claim.period_start, claim.period_end)

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

      {/* Items */}
      <div style={S.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Items ({items.length})
          </span>
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
          ? <div style={{ padding: '24px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>No items yet. Add mileage, meal, or lodging.</div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[...items].sort((a, b) => {
                const dateA = a.claim_date ?? a.lodging_check_in ?? ''
                const dateB = b.claim_date ?? b.lodging_check_in ?? ''
                const typeOrder: Record<string, number> = { MILEAGE: 0, MEAL: 1, LODGING: 2 }
                const tA = typeOrder[a.type] ?? 9
                const tB = typeOrder[b.type] ?? 9
                if (sortMode === 'DATE_TYPE') {
                  if (dateA !== dateB) return dateA < dateB ? -1 : 1
                  return tA - tB
                } else {
                  if (tA !== tB) return tA - tB
                  if (dateA !== dateB) return dateA < dateB ? -1 : 1
                  return 0
                }
              }).map(item => (
                <ItemCard key={item.id} item={item} onDelete={deleteItem} onEdit={item => { setEditingItem(item); setModal(item.type === 'MEAL' ? 'EDIT_MEAL' : 'EDIT_LODGING') }} locked={locked} />
              ))}
            </div>
        }
      </div>

      {/* Total
           DRAFT  → live sum from items (DB total_amount may be stale / 0)
           SUBMITTED → locked snapshot from claim.total_amount (audit-safe) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
          {fmtMyr(isDraft
            ? items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0)
            : claim.total_amount
          )}
        </span>
      </div>

      {/* Add buttons */}
      {isDraft && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModal('MILEAGE')} style={S.btnAdd}>🚗 Mileage</button>
          <button onClick={() => setModal('MEAL')}    style={S.btnAdd}>🍽 Meal</button>
          <button onClick={() => setModal('LODGING')} style={S.btnAdd}>🏨 Lodging</button>
        </div>
      )}

      {/* Delete Claim — DRAFT only ───────────────────────────────────────── */}
      {isDraft && (
        <div style={{ marginTop: 4 }}>
          {deleteErr && <div style={{ ...S.errorBox, marginBottom: 8 }}>{deleteErr}</div>}
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={S.btnDeleteClaim}
              disabled={deleting}
            >
              🗑 Delete Claim
            </button>
          ) : (
            <div style={S.confirmBox}>
              <p style={S.confirmText}>
                Delete this claim and all its items? This cannot be undone.
              </p>
              <div style={S.confirmRow}>
                <button
                  onClick={async () => {
                    setDeleting(true); setDeleteErr(null)
                    const res  = await fetch(`/api/claims/${claim?.id}`, { method: 'DELETE' })
                    const json = await res.json()
                    setDeleting(false)
                    if (!res.ok) { setDeleteErr(json.error?.message ?? 'Failed to delete.'); setShowDeleteConfirm(false); return }
                    router.push('/claims')
                  }}
                  style={{ ...S.btnConfirmDelete, opacity: deleting ? 0.65 : 1 }}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete Claim'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteErr(null) }}
                  style={S.btnConfirmCancel}
                  disabled={deleting}
                >
                  Keep Claim
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {isDraft && (
        <div>
          {submitErr && <div style={{ ...S.errorBox, marginBottom: 10 }}>{submitErr}</div>}
          <button
            onClick={handleSubmit}
            disabled={submitting || items.length === 0}
            style={{ ...S.btnSubmit, opacity: submitting || items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
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

      {/* Modals */}
      {modal === 'MILEAGE' && (
        <MileageModal
          onAdd={addMileage}
          onClose={() => setModal(null)}
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
        <ExpenseModal
          type="MEAL" editMode initialData={editingItem} itemId={editingItem.id}
          onAdd={d => updateExpense(editingItem.id, 'MEAL', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}
      {modal === 'EDIT_LODGING' && editingItem && (
        <ExpenseModal
          type="LODGING" editMode initialData={editingItem} itemId={editingItem.id}
          onAdd={d => updateExpense(editingItem.id, 'LODGING', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 },
  section:    { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },

  // Item card — 3 columns
  itemCard:   { display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, borderBottom: '1px solid #f8fafc' },
  iDate:      { width: 78, flexShrink: 0, paddingTop: 2 },
  iBody:      { flex: 1, minWidth: 0 },
  iAmt:       { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },

  // Buttons
  btnAdd:     { flex: 1, padding: '12px 8px', backgroundColor: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' },
  btnSubmit:  { width: '100%', padding: '14px', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },

  // Modal
  overlay:    { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000, paddingBottom: 64 },
  modal:      { backgroundColor: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: 'calc(85vh - 64px)', display: 'flex', flexDirection: 'column' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderBottom: '1px solid #f1f5f9', flexShrink: 0 },
  modalBody:  { paddingTop: 16, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1 },
  modalFooter:{ paddingTop: 12, paddingBottom: 16, paddingLeft: 20, paddingRight: 20, borderTop: '1px solid #f1f5f9', flexShrink: 0 },
  mInfo:      { color: '#64748b', fontSize: 13, textAlign: 'center', padding: '24px 0', lineHeight: 1.6 },
  btnModalAdd:{ padding: '13px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%' },

  // Form fields
  field:      { display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:      { paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', backgroundColor: '#fff', boxSizing: 'border-box', color: '#0f172a', WebkitTextFillColor: '#0f172a' },
  modeRow:    { display: 'flex', gap: 8 },
  modeBtn:    { flex: 1, padding: '10px 8px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  errorBox:   { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },

  // Trip option
  tripOpt:    { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, paddingTop: 10, paddingBottom: 10, paddingLeft: 14, paddingRight: 14, cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box' },

  // Delete claim
  btnDeleteClaim:   { width: '100%', padding: '11px', backgroundColor: 'transparent', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  confirmBox:       { padding: '14px', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, display: 'flex', flexDirection: 'column' as const, gap: 12 },
  confirmText:      { margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 },
  confirmRow:       { display: 'flex', gap: 10 },
  btnConfirmDelete: { flex: 1, padding: '11px 0', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnConfirmCancel: { flex: 1, padding: '11px 0', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
}
