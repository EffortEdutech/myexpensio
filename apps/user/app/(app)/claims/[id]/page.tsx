'use client'
// apps/user/app/(app)/claims/[id]/page.tsx
//
// Claim Detail — DRAFT editing + SUBMITTED view
//
// Modal types:
//   MILEAGE              → pick FINAL trips
//   MEAL / LODGING       → fixed rate or receipt
//   EDIT_MEAL / EDIT_LODGING
//   TOLL                 → TNG Picker (TOLL unclaimed), fallback manual
//   TOLL_MANUAL          → manual toll entry form
//   PARKING              → TNG Picker (PARKING unclaimed), fallback manual
//   PARKING_MANUAL       → manual parking entry form
//   TRANSPORT            → type selector (Taxi/Grab/Train/Flight)
//   TAXI|GRAB|TRAIN|FLIGHT → manual transport form

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter }              from 'next/navigation'
import Link                                  from 'next/link'
import { ReceiptUploader }                   from '@/components/ReceiptUploader'

// ── Types ──────────────────────────────────────────────────────────────────────

type ClaimStatus = 'DRAFT' | 'SUBMITTED'
type ClaimItemType =
  | 'MILEAGE' | 'MEAL' | 'LODGING'
  | 'TOLL' | 'PARKING'
  | 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT'

type Claim = {
  id:           string
  status:       ClaimStatus
  title:        string | null
  period_start: string | null
  period_end:   string | null
  total_amount: number
  currency:     string
  submitted_at: string | null
}

type ClaimItem = {
  id:                  string
  type:                ClaimItemType
  amount:              number
  currency:            string
  claim_date:          string | null
  meal_session:        string | null
  lodging_check_in:    string | null
  lodging_check_out:   string | null
  qty:                 number | null
  unit:                string | null
  rate:                number | null
  receipt_url:         string | null
  merchant:            string | null
  notes:               string | null
  trip_id:             string | null
  mode:                string | null
}

type Trip = {
  id:               string
  status:           string
  started_at:       string
  origin_text:      string | null
  destination_text: string | null
  final_distance_m: number | null
  distance_source:  string | null
}

type TngTxn = {
  id:             string
  trans_no:       string | null
  entry_datetime: string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  claimed:        boolean
}

type ModalType =
  | null
  | 'MILEAGE'
  | 'MEAL' | 'LODGING'
  | 'EDIT_MEAL' | 'EDIT_LODGING'
  | 'TOLL' | 'TOLL_MANUAL'
  | 'PARKING' | 'PARKING_MANUAL'
  | 'TRANSPORT'
  | 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT'

type TransportFormData = {
  type:            ClaimItemType
  amount:          number
  claim_date:      string
  merchant?:       string
  notes?:          string
  receipt_url?:    string
  entry_location?: string
  exit_location?:  string
  location?:       string
  tng_transaction_id?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = {
  MILEAGE: '🚗', MEAL: '🍽', LODGING: '🏨',
  TOLL: '🛣', PARKING: '🅿',
  TAXI: '🚕', GRAB: '🚙', TRAIN: '🚆', FLIGHT: '✈️',
}

const TYPE_COLOR: Record<string, string> = {
  TOLL: '#16a34a', PARKING: '#1d4ed8',
  TAXI: '#b45309', GRAB: '#15803d',
  TRAIN: '#7c3aed', FLIGHT: '#0369a1',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMyr(n: number) {
  return 'MYR ' + Number(n).toFixed(2)
}

function fmtKm(m: number | null) {
  if (m == null) return '—'
  return (m / 1000).toFixed(2) + ' KM'
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateShort(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short' })
}

const today = new Date().toISOString().slice(0, 10)

// ── Modal wrapper ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, footer, children }: {
  title:    string
  onClose:  () => void
  footer?:  React.ReactNode
  children: React.ReactNode
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

// ── ItemCard ───────────────────────────────────────────────────────────────────

function ItemCard({ item, locked, onDelete, onEdit }: {
  item:     ClaimItem
  locked:   boolean
  onDelete: (id: string) => void
  onEdit:   (item: ClaimItem) => void
}) {
  const [deleting, setDeleting] = useState(false)

  function sub() {
    if (item.type === 'MILEAGE') return fmtKm(item.qty ? item.qty * 1000 : null)
    if (item.type === 'MEAL') {
      return [item.meal_session, item.merchant].filter(Boolean).join(' · ') || 'Meal'
    }
    if (item.type === 'LODGING') {
      const nights = item.qty
      return [
        nights ? `${nights} night${nights > 1 ? 's' : ''}` : null,
        item.lodging_check_in ? fmtDate(item.lodging_check_in) : null,
      ].filter(Boolean).join(' · ') || 'Lodging'
    }
    if (item.type === 'TOLL')    return item.merchant || 'Toll'
    if (item.type === 'PARKING') return item.merchant || 'Parking'
    return item.merchant || item.type
  }

  const isEditable = item.type === 'MEAL' || item.type === 'LODGING'

  return (
    <div style={S.itemCard}>
      <div style={S.iDate}>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, lineHeight: 1.3 }}>
          {fmtDate(item.claim_date ?? item.lodging_check_in)}
        </span>
      </div>
      <div style={S.iBody}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 13 }}>{TYPE_ICON[item.type] ?? '📄'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{item.type}</span>
          {item.receipt_url && (
            <span style={S.receiptBadge}>🧾</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub()}</div>
        {item.notes && (
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' }}>{item.notes}</div>
        )}
      </div>
      <div style={S.iAmt}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{fmtMyr(item.amount)}</span>
        {!locked && (
          <div style={{ display: 'flex', gap: 4 }}>
            {isEditable && (
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

// ── TNG Picker Modal (TOLL or PARKING from saved transactions) ─────────────────

function TngPickerModal({ sector, onPick, onClose, onManual }: {
  sector:   'TOLL' | 'PARKING'
  onPick:   (txnId: string) => Promise<void>
  onClose:  () => void
  onManual: () => void
}) {
  const [items,   setItems]   = useState<TngTxn[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams({ sector, claimed: 'false' })
    fetch('/api/tng/transactions?' + params.toString())
      .then(r => r.json())
      .then(json => { setItems(json.items ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load.'); setLoading(false) })
  }, [sector])

  const icon  = sector === 'TOLL' ? '🛣' : '🅿'
  const label = sector === 'TOLL' ? 'Toll' : 'Parking'
  const color = TYPE_COLOR[sector]
  const bg    = sector === 'TOLL' ? '#f0fdf4' : '#eff6ff'

  async function handlePick(txnId: string) {
    setPicking(txnId)
    try { await onPick(txnId) }
    catch { setPicking(null) }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, borderRadius: '20px 20px 0 0', maxHeight: '82vh' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={S.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Add {label} from TNG</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>Select an unclaimed transaction</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto' as const }}>
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px', gap: 10 }}>
              <div style={S.spinner} />
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Loading transactions…</p>
            </div>
          )}
          {error && (
            <div style={{ margin: '12px 20px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}
          {!loading && !error && items.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '32px', gap: 8, textAlign: 'center' as const }}>
              <div style={{ fontSize: 32 }}>{icon}</div>
              <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>No unclaimed {label.toLowerCase()} transactions</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 12px' }}>Import your TNG statement first, or use manual entry.</p>
              <a href="/tng" target="_blank" rel="noopener"
                style={{ padding: '8px 16px', backgroundColor: '#0891b2', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                Import TNG Statement ↗
              </a>
            </div>
          )}
          {!loading && !error && items.map(txn => (
            <button
              key={txn.id}
              onClick={() => handlePick(txn.id)}
              disabled={picking !== null}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 20px', background: '#fff', border: 'none',
                borderBottom: '1px solid #f8fafc', cursor: 'pointer',
                textAlign: 'left', width: '100%', gap: 12,
                borderLeft: `3px solid ${color}`,
                opacity: picking === txn.id ? 0.6 : 1,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{fmtDateShort(txn.entry_datetime)}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {txn.entry_location ?? '—'}
                  {sector === 'TOLL' && txn.exit_location ? ` → ${txn.exit_location}` : ''}
                </div>
                {txn.trans_no && <div style={{ fontSize: 10, color: '#94a3b8' }}>#{txn.trans_no}</div>}
              </div>
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>RM {txn.amount.toFixed(2)}</span>
                <span style={{ fontSize: 11, color, fontWeight: 600 }}>
                  {picking === txn.id ? 'Adding…' : 'Select →'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>Don't see your transaction?</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="/tng" target="_blank" rel="noopener"
              style={{ fontSize: 12, fontWeight: 600, color: '#0891b2', padding: '6px 12px', border: '1px solid #bae6fd', borderRadius: 8, textDecoration: 'none', backgroundColor: '#f0f9ff' }}>
              Import ↗
            </a>
            <button onClick={onManual}
              style={{ fontSize: 12, fontWeight: 600, color: '#475569', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
              Manual Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Transport Type Selector ────────────────────────────────────────────────────

function TransportTypeSelector({ onSelect, onClose }: {
  onSelect: (type: 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT') => void
  onClose:  () => void
}) {
  const options: { type: 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT'; icon: string; label: string }[] = [
    { type: 'TAXI',   icon: '🚕', label: 'Taxi'   },
    { type: 'GRAB',   icon: '🚙', label: 'Grab'   },
    { type: 'TRAIN',  icon: '🚆', label: 'Train'  },
    { type: 'FLIGHT', icon: '✈️', label: 'Flight' },
  ]
  return (
    <Modal title="Select Transport Type" onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
        {options.map(o => (
          <button
            key={o.type}
            onClick={() => onSelect(o.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 12,
              background: '#fff',
              cursor: 'pointer',
              textAlign: 'left',
              width: '100%',
            }}
          >
            <span style={{ fontSize: 24 }}>{o.icon}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{o.label}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Manual receipt entry</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: 16 }}>›</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}

// ── Manual Transport Form ──────────────────────────────────────────────────────

const TRANSPORT_CFG: Record<string, {
  icon: string; label: string; color: string
  showRoute: boolean; showLoc: boolean
  merchantLabel: string; amountLabel: string
  placeholder: string
}> = {
  TOLL:    { icon: '🛣', label: 'Toll',    color: '#16a34a', showRoute: true,  showLoc: false, merchantLabel: '', amountLabel: 'Toll Amount (MYR)', placeholder: '' },
  PARKING: { icon: '🅿', label: 'Parking', color: '#1d4ed8', showRoute: false, showLoc: true,  merchantLabel: 'Location', amountLabel: 'Parking Amount (MYR)', placeholder: 'e.g. Mydin MITC' },
  TAXI:    { icon: '🚕', label: 'Taxi',    color: '#b45309', showRoute: false, showLoc: false, merchantLabel: 'Route / Description', amountLabel: 'Fare Amount (MYR)', placeholder: 'e.g. KL Sentral → KLCC' },
  GRAB:    { icon: '🚙', label: 'Grab',    color: '#15803d', showRoute: false, showLoc: false, merchantLabel: 'Route / Description', amountLabel: 'Fare Amount (MYR)', placeholder: 'e.g. Bangsar → Mid Valley' },
  TRAIN:   { icon: '🚆', label: 'Train',   color: '#7c3aed', showRoute: false, showLoc: false, merchantLabel: 'Route / Line', amountLabel: 'Ticket Amount (MYR)', placeholder: 'e.g. KTM Komuter' },
  FLIGHT:  { icon: '✈️', label: 'Flight',  color: '#0369a1', showRoute: false, showLoc: false, merchantLabel: 'Route / Airline', amountLabel: 'Ticket Amount (MYR)', placeholder: 'e.g. AirAsia KUL-JHB' },
}

function ManualTransportModal({ type, onAdd, onClose }: {
  type:    ClaimItemType
  onAdd:   (data: TransportFormData) => Promise<void>
  onClose: () => void
}) {
  const cfg = TRANSPORT_CFG[type] ?? TRANSPORT_CFG.TAXI

  const [amount,    setAmount]    = useState('')
  const [date,      setDate]      = useState(today)
  const [merchant,  setMerchant]  = useState('')
  const [notes,     setNotes]     = useState('')
  const [receipt,   setReceipt]   = useState<string | undefined>()
  const [entry,     setEntry]     = useState('')
  const [exit,      setExit]      = useState('')
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    const amtNum = parseFloat(amount)
    if (!amount || isNaN(amtNum) || amtNum <= 0) { setError('Enter a valid amount.'); return }
    if (!date) { setError('Select a date.'); return }
    setError(null); setSaving(true)
    try {
      await onAdd({
        type,
        amount:      amtNum,
        claim_date:  date,
        merchant:    cfg.showRoute
          ? (entry && exit ? `${entry} → ${exit}` : entry || exit || undefined)
          : cfg.showLoc ? merchant.trim() || undefined
          : merchant.trim() || undefined,
        notes:       notes.trim() || undefined,
        receipt_url: receipt,
        ...(cfg.showRoute ? { entry_location: entry || undefined, exit_location: exit || undefined } : {}),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`Add ${cfg.label} — Manual`}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={S.btnCancel}>Cancel</button>
          <button
            onClick={handleSave} disabled={saving}
            style={{ ...S.btnPrimary, backgroundColor: cfg.color, flex: 2, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Adding…' : `Add ${cfg.label}`}
          </button>
        </div>
      }
    >
      {error && <div style={S.errorBox}>{error}</div>}

      {/* Amount */}
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>{cfg.amountLabel} *</label>
        <div style={S.amountWrap}>
          <span style={S.amountPrefix}>RM</span>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" min="0.01" step="0.01" style={S.amountInput} />
        </div>
      </div>

      {/* Date */}
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Date *</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} max={today} style={S.input} />
      </div>

      {/* TOLL: entry + exit */}
      {cfg.showRoute && (
        <>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Entry Point</label>
            <input type="text" value={entry} onChange={e => setEntry(e.target.value)}
              placeholder="e.g. PLUS – Ayer Keroh" style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Exit Point</label>
            <input type="text" value={exit} onChange={e => setExit(e.target.value)}
              placeholder="e.g. ELITE – Bandar Serenia" style={S.input} />
          </div>
        </>
      )}

      {/* PARKING: single location / others: merchant */}
      {(cfg.showLoc || (!cfg.showRoute && type !== 'TOLL')) && (
        <div style={S.fieldGroup}>
          <label style={S.fieldLabel}>{cfg.merchantLabel || 'Description'}</label>
          <input type="text" value={merchant} onChange={e => setMerchant(e.target.value)}
            placeholder={cfg.placeholder} style={S.input} />
        </div>
      )}

      {/* Notes */}
      <div style={S.fieldGroup}>
        <label style={S.fieldLabel}>Notes (optional)</label>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Any notes" style={S.input} />
      </div>

      {/* Receipt (for non-TOLL) */}
      {type !== 'TOLL' && (
        <div style={S.fieldGroup}>
          <label style={S.fieldLabel}>Receipt (optional)</label>
          <ReceiptUploader storagePath={receipt} onUploaded={setReceipt} purpose="RECEIPT" enableScan />
        </div>
      )}
    </Modal>
  )
}

// ── Mileage Modal ──────────────────────────────────────────────────────────────

function MileageModal({ onAdd, onClose, alreadyAddedTripIds }: {
  onAdd:               (trip_ids: string[]) => Promise<void>
  onClose:             () => void
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
      .then(j => { setTrips(j.items ?? []); setLoading(false) })
      .catch(() => { setError('Failed to load trips.'); setLoading(false) })
  }, [])

  async function handleSave() {
    if (!selected.size) return
    setSaving(true); setError(null)
    try { await onAdd(Array.from(selected)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed.'); setSaving(false) }
  }

  const available = trips.filter(t => !alreadyAddedTripIds.includes(t.id))

  return (
    <Modal
      title="Add Mileage"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={saving || !selected.size}
          style={{ ...S.btnPrimary, opacity: saving || !selected.size ? 0.5 : 1 }}
        >
          {saving ? 'Adding…' : `Add ${selected.size || ''} Trip${selected.size !== 1 ? 's' : ''}`}
        </button>
      }
    >
      {error && <div style={S.errorBox}>{error}</div>}
      {loading && <p style={{ color: '#64748b', textAlign: 'center' }}>Loading trips…</p>}
      {!loading && available.length === 0 && (
        <p style={{ color: '#64748b', textAlign: 'center', fontSize: 13 }}>
          No FINAL trips available.{' '}
          <Link href="/trips" style={{ color: '#0891b2' }}>Record a trip first</Link>.
        </p>
      )}
      {!loading && available.map(t => {
        const isSel = selected.has(t.id)
        return (
          <button
            key={t.id}
            onClick={() => setSelected(prev => { const n = new Set(prev); isSel ? n.delete(t.id) : n.add(t.id); return n })}
            style={{ ...S.tripOpt, borderColor: isSel ? '#0f172a' : '#e2e8f0', marginBottom: 8 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                {t.origin_text && t.destination_text
                  ? `${t.origin_text} → ${t.destination_text}`
                  : `Trip ${fmtDate(t.started_at)}`}
              </span>
              <span style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${isSel ? '#0f172a' : '#cbd5e1'}`, backgroundColor: isSel ? '#0f172a' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {isSel ? '✓' : ''}
              </span>
            </div>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtKm(t.final_distance_m)} · {fmtDate(t.started_at)}</span>
          </button>
        )
      })}
    </Modal>
  )
}

// ── ExpenseModal (Meal / Lodging) ──────────────────────────────────────────────

const MEAL_SESSIONS = ['FULL_DAY', 'MORNING', 'NOON', 'EVENING'] as const
type MealSession = typeof MEAL_SESSIONS[number]
const SESSION_LABELS: Record<MealSession, string> = {
  FULL_DAY: 'Full Day', MORNING: 'Morning', NOON: 'Noon', EVENING: 'Evening'
}

function ExpenseModal({ type, onAdd, onClose, editMode = false, initialData }: {
  type:         'MEAL' | 'LODGING'
  onAdd:        (data: Record<string, unknown>) => Promise<void>
  onClose:      () => void
  editMode?:    boolean
  initialData?: Partial<ClaimItem>
}) {
  const isMeal = type === 'MEAL'

  // Meal state
  const [mealDate,    setMealDate]    = useState(initialData?.claim_date?.slice(0, 10) ?? today)
  const [mealSession, setMealSession] = useState<MealSession | null>(
    (initialData?.meal_session as MealSession | null) ?? null
  )
  const [mealMode,  setMealMode]  = useState<'FIXED_RATE' | 'RECEIPT'>(
    (initialData?.mode as 'FIXED_RATE' | 'RECEIPT') ?? 'FIXED_RATE'
  )
  const [mealAmt,   setMealAmt]   = useState(initialData?.amount ? String(initialData.amount) : '')
  const [mealMerch, setMealMerch] = useState(initialData?.merchant ?? '')
  const [mealNotes, setMealNotes] = useState(initialData?.notes ?? '')
  const [mealReceipt, setMealReceipt] = useState(initialData?.receipt_url ?? undefined)

  // Lodging state
  const [lodgingCheckIn,  setLodgingCheckIn]  = useState(initialData?.lodging_check_in?.slice(0, 10)  ?? today)
  const [lodgingCheckOut, setLodgingCheckOut] = useState(initialData?.lodging_check_out?.slice(0, 10) ?? today)
  const [lodgingAmt,      setLodgingAmt]      = useState(initialData?.amount ? String(initialData.amount) : '')
  const [lodgingMerch,    setLodgingMerch]    = useState(initialData?.merchant ?? '')
  const [lodgingNotes,    setLodgingNotes]    = useState(initialData?.notes ?? '')
  const [lodgingReceipt,  setLodgingReceipt]  = useState(initialData?.receipt_url ?? undefined)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    try {
      setSaving(true)
      if (isMeal) {
        if (!mealSession) { setError('Select a meal session.'); setSaving(false); return }
        const amtNum = parseFloat(mealAmt)
        if (mealMode === 'RECEIPT' && (!mealAmt || isNaN(amtNum) || amtNum <= 0)) {
          setError('Enter a valid amount.'); setSaving(false); return
        }
        await onAdd({
          mode:         mealMode,
          claim_date:   mealDate,
          meal_session: mealSession,
          amount:       mealMode === 'RECEIPT' ? amtNum : undefined,
          merchant:     mealMerch.trim() || undefined,
          notes:        mealNotes.trim() || undefined,
          receipt_path: mealReceipt,
        })
      } else {
        const amtNum = parseFloat(lodgingAmt)
        if (!lodgingAmt || isNaN(amtNum) || amtNum <= 0) { setError('Enter a valid amount.'); setSaving(false); return }
        if (lodgingCheckOut < lodgingCheckIn) { setError('Check-out must be after check-in.'); setSaving(false); return }
        await onAdd({
          mode:              'RECEIPT',
          lodging_check_in:  lodgingCheckIn,
          lodging_check_out: lodgingCheckOut,
          amount:            amtNum,
          merchant:          lodgingMerch.trim() || undefined,
          notes:             lodgingNotes.trim()  || undefined,
          receipt_path:      lodgingReceipt,
        })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed.')
      setSaving(false)
    }
  }

  return (
    <Modal
      title={`${editMode ? 'Edit' : 'Add'} ${isMeal ? 'Meal' : 'Lodging'}`}
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={S.btnCancel}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...S.btnPrimary, flex: 2, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editMode ? 'Save Changes' : `Add ${isMeal ? 'Meal' : 'Lodging'}`}
          </button>
        </div>
      }
    >
      {error && <div style={S.errorBox}>{error}</div>}

      {isMeal ? (
        <>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Date *</label>
            <input type="date" value={mealDate} onChange={e => setMealDate(e.target.value)} max={today} style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Session *</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MEAL_SESSIONS.map(s => (
                <button key={s} onClick={() => setMealSession(s)}
                  style={{ padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    backgroundColor: mealSession === s ? '#0f172a' : '#f1f5f9',
                    color: mealSession === s ? '#fff' : '#475569',
                    border: mealSession === s ? '1px solid #0f172a' : '1px solid #e2e8f0' }}>
                  {SESSION_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Mode</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['FIXED_RATE', 'RECEIPT'] as const).map(m => (
                <button key={m} onClick={() => setMealMode(m)}
                  style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    backgroundColor: mealMode === m ? '#0f172a' : '#f1f5f9',
                    color: mealMode === m ? '#fff' : '#475569' }}>
                  {m === 'FIXED_RATE' ? 'Fixed Rate' : 'Receipt'}
                </button>
              ))}
            </div>
          </div>
          {mealMode === 'RECEIPT' && (
            <div style={S.fieldGroup}>
              <label style={S.fieldLabel}>Amount (MYR) *</label>
              <div style={S.amountWrap}>
                <span style={S.amountPrefix}>RM</span>
                <input type="number" value={mealAmt} onChange={e => setMealAmt(e.target.value)}
                  placeholder="0.00" min="0.01" step="0.01" style={S.amountInput} />
              </div>
            </div>
          )}
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Merchant (optional)</label>
            <input type="text" value={mealMerch} onChange={e => setMealMerch(e.target.value)}
              placeholder="Restaurant name" style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Notes (optional)</label>
            <input type="text" value={mealNotes} onChange={e => setMealNotes(e.target.value)} style={S.input} />
          </div>
          {mealMode === 'RECEIPT' && (
            <div style={S.fieldGroup}>
              <label style={S.fieldLabel}>Receipt</label>
              <ReceiptUploader storagePath={mealReceipt} onUploaded={setMealReceipt} purpose="RECEIPT" enableScan />
            </div>
          )}
        </>
      ) : (
        <>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Check-in *</label>
            <input type="date" value={lodgingCheckIn} onChange={e => setLodgingCheckIn(e.target.value)} max={today} style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Check-out *</label>
            <input type="date" value={lodgingCheckOut} onChange={e => setLodgingCheckOut(e.target.value)} min={lodgingCheckIn} style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Amount (MYR) *</label>
            <div style={S.amountWrap}>
              <span style={S.amountPrefix}>RM</span>
              <input type="number" value={lodgingAmt} onChange={e => setLodgingAmt(e.target.value)}
                placeholder="0.00" min="0.01" step="0.01" style={S.amountInput} />
            </div>
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Hotel / Venue (optional)</label>
            <input type="text" value={lodgingMerch} onChange={e => setLodgingMerch(e.target.value)}
              placeholder="Hotel name" style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Notes (optional)</label>
            <input type="text" value={lodgingNotes} onChange={e => setLodgingNotes(e.target.value)} style={S.input} />
          </div>
          <div style={S.fieldGroup}>
            <label style={S.fieldLabel}>Receipt</label>
            <ReceiptUploader storagePath={lodgingReceipt} onUploaded={setLodgingReceipt} purpose="RECEIPT" enableScan />
          </div>
        </>
      )}
    </Modal>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ClaimDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()

  const [claim,       setClaim]       = useState<Claim | null>(null)
  const [items,       setItems]       = useState<ClaimItem[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [modal,       setModal]       = useState<ModalType>(null)
  const [editingItem, setEditingItem] = useState<ClaimItem | null>(null)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitErr,   setSubmitErr]   = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState(false)
  const [deleteErr,   setDeleteErr]   = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [sortMode, setSortMode] = useState<'DATE_TYPE' | 'TYPE_DATE'>('DATE_TYPE')

  const load = useCallback(async () => {
    const res  = await fetch(`/api/claims/${id}`)
    const json = await res.json()
    if (!res.ok) { setError(json.error?.message ?? 'Not found.'); setLoading(false); return }
    setClaim(json.claim)
    setItems(json.items ?? [])
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const isDraft = claim?.status === 'DRAFT'
  const locked  = !isDraft

  // ── Add item helpers ──────────────────────────────────────────────────────

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
    const { receipt_path, ...rest } = data
    const body = { type, ...rest, ...(receipt_path ? { receipt_url: receipt_path } : {}) }
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null)
  }

  async function updateExpense(itemId: string, type: 'MEAL' | 'LODGING', data: Record<string, unknown>) {
    const { receipt_path, ...rest } = data
    const body = { type, ...rest, ...(receipt_path ? { receipt_url: receipt_path } : {}) }
    const res  = await fetch(`/api/claims/${id}/items/${itemId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null); setEditingItem(null)
  }

  // ── Add transport via TNG picker ──────────────────────────────────────────

  async function addFromTng(sector: 'TOLL' | 'PARKING', tng_transaction_id: string) {
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ type: sector, tng_transaction_id }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null)
  }

  // ── Add transport manual ──────────────────────────────────────────────────

  async function addTransport(data: TransportFormData) {
    const res  = await fetch(`/api/claims/${id}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed.')
    await load(); setModal(null)
  }

  // ── Delete item ───────────────────────────────────────────────────────────

  async function deleteItem(itemId: string) {
    const res  = await fetch(`/api/claims/${id}/items/${itemId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error?.message ?? 'Failed to delete.')
    await load()
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (items.length === 0) return
    setSubmitting(true); setSubmitErr(null)
    const res  = await fetch(`/api/claims/${id}/submit`, { method: 'POST' })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { setSubmitErr(json.error?.message ?? 'Submit failed.'); return }
    await load()
  }

  // ── Sorted items ──────────────────────────────────────────────────────────

  const typeOrder: Record<string, number> = { MILEAGE: 0, MEAL: 1, LODGING: 2, TOLL: 3, PARKING: 4, TAXI: 5, GRAB: 6, TRAIN: 7, FLIGHT: 8 }

  const sortedItems = [...items].sort((a, b) => {
    const dateA = a.claim_date ?? a.lodging_check_in ?? ''
    const dateB = b.claim_date ?? b.lodging_check_in ?? ''
    const tA    = typeOrder[a.type] ?? 9
    const tB    = typeOrder[b.type] ?? 9
    if (sortMode === 'DATE_TYPE') {
      if (dateA !== dateB) return dateA < dateB ? -1 : 1
      return tA - tB
    }
    if (tA !== tB) return tA - tB
    return dateA < dateB ? -1 : 1
  })

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <p style={{ color: '#64748b', padding: 24 }}>Loading…</p>
  if (error)   return <p style={{ color: '#dc2626', padding: 24 }}>{error}</p>
  if (!claim)  return null

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.pageHeader}>
        <Link href="/claims" style={S.backLink}>← Claims</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={S.pageTitle}>{claim.title ?? 'Claim'}</h1>
          <span style={{
            ...S.statusBadge,
            backgroundColor: isDraft ? '#fef3c7' : '#d1fae5',
            color:           isDraft ? '#92400e' : '#065f46',
          }}>
            {claim.status}
          </span>
        </div>
        {claim.period_start && (
          <p style={S.dateLine}>
            {fmtDate(claim.period_start)} – {fmtDate(claim.period_end)}
            {claim.submitted_at && ` · Submitted ${fmtDate(claim.submitted_at)}`}
          </p>
        )}
      </div>

      {/* Submitted banner */}
      {locked && (
        <div style={S.lockedBanner}>
          🔒 This claim has been submitted and is locked. No further edits are allowed.
        </div>
      )}

      {/* Items list */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Items</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['DATE_TYPE', 'TYPE_DATE'] as const).map(m => (
              <button key={m} onClick={() => setSortMode(m)}
                style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                  backgroundColor: sortMode === m ? '#0f172a' : '#f1f5f9',
                  color:           sortMode === m ? '#fff'    : '#64748b',
                  border: 'none' }}>
                {m === 'DATE_TYPE' ? 'By Date' : 'By Type'}
              </button>
            ))}
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No items yet. {isDraft && 'Add items below.'}
          </div>
        ) : (
          sortedItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              locked={locked}
              onDelete={deleteItem}
              onEdit={item => {
                setEditingItem(item)
                setModal(item.type === 'MEAL' ? 'EDIT_MEAL' : 'EDIT_LODGING')
              }}
            />
          ))
        )}
      </div>

      {/* Totals */}
      <div style={S.totalsRow}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>Total</span>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
          {fmtMyr(isDraft
            ? items.reduce((sum, i) => sum + Number(i.amount), 0)
            : claim.total_amount
          )}
        </span>
      </div>

      {/* ── Add buttons (DRAFT only) ─────────────────────────────── */}
      {isDraft && (
        <>
          {/* Row 1: Classic items */}
          <div style={S.addRow}>
            <button onClick={() => setModal('MILEAGE')} style={S.btnAdd}>🚗 Mileage</button>
            <button onClick={() => setModal('MEAL')}    style={S.btnAdd}>🍽 Meal</button>
            <button onClick={() => setModal('LODGING')} style={S.btnAdd}>🏨 Lodging</button>
          </div>

          {/* Row 2: Transport items */}
          <div style={S.addRow}>
            <button onClick={() => setModal('TOLL')}      style={{ ...S.btnAdd, ...S.btnToll }}>🛣 Toll</button>
            <button onClick={() => setModal('PARKING')}   style={{ ...S.btnAdd, ...S.btnParking }}>🅿 Parking</button>
            <button onClick={() => setModal('TRANSPORT')} style={{ ...S.btnAdd, ...S.btnTransport }}>🚕 Transport</button>
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: -4 }}>
            Toll &amp; Parking import from TNG statement · Transport = Taxi, Grab, Train, Flight
          </div>
        </>
      )}

      {/* Delete claim */}
      {isDraft && (
        <div>
          {deleteErr && <div style={{ ...S.errorBox, marginBottom: 8 }}>{deleteErr}</div>}
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)} style={S.btnDeleteClaim}>
              🗑 Delete Claim
            </button>
          ) : (
            <div style={S.confirmBox}>
              <p style={S.confirmText}>Delete this claim and all its items? This cannot be undone.</p>
              <div style={S.confirmRow}>
                <button
                  onClick={async () => {
                    setDeleting(true); setDeleteErr(null)
                    const res  = await fetch(`/api/claims/${claim.id}`, { method: 'DELETE' })
                    const json = await res.json()
                    setDeleting(false)
                    if (!res.ok) { setDeleteErr(json.error?.message ?? 'Failed.'); setShowDeleteConfirm(false); return }
                    router.push('/claims')
                  }}
                  style={{ ...S.btnConfirmDelete, opacity: deleting ? 0.65 : 1 }}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Yes, Delete Claim'}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeleteErr(null) }} style={S.btnConfirmCancel}>
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

      {/* ── Modals ────────────────────────────────────────────────── */}

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
          type="MEAL" editMode initialData={editingItem}
          onAdd={d => updateExpense(editingItem.id, 'MEAL', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}

      {modal === 'EDIT_LODGING' && editingItem && (
        <ExpenseModal
          type="LODGING" editMode initialData={editingItem}
          onAdd={d => updateExpense(editingItem.id, 'LODGING', d)}
          onClose={() => { setModal(null); setEditingItem(null) }}
        />
      )}

      {/* TOLL → TNG Picker first, manual option in footer */}
      {modal === 'TOLL' && (
        <TngPickerModal
          sector="TOLL"
          onPick={txnId => addFromTng('TOLL', txnId)}
          onClose={() => setModal(null)}
          onManual={() => setModal('TOLL_MANUAL')}
        />
      )}
      {modal === 'TOLL_MANUAL' && (
        <ManualTransportModal
          type="TOLL"
          onAdd={addTransport}
          onClose={() => setModal(null)}
        />
      )}

      {/* PARKING → TNG Picker first, manual option in footer */}
      {modal === 'PARKING' && (
        <TngPickerModal
          sector="PARKING"
          onPick={txnId => addFromTng('PARKING', txnId)}
          onClose={() => setModal(null)}
          onManual={() => setModal('PARKING_MANUAL')}
        />
      )}
      {modal === 'PARKING_MANUAL' && (
        <ManualTransportModal
          type="PARKING"
          onAdd={addTransport}
          onClose={() => setModal(null)}
        />
      )}

      {/* Transport type selector */}
      {modal === 'TRANSPORT' && (
        <TransportTypeSelector
          onSelect={type => setModal(type)}
          onClose={() => setModal(null)}
        />
      )}

      {/* Individual transport modals */}
      {(modal === 'TAXI' || modal === 'GRAB' || modal === 'TRAIN' || modal === 'FLIGHT') && (
        <ManualTransportModal
          type={modal}
          onAdd={addTransport}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:     { display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 60 },
  section:  { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },

  // Header
  pageHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  backLink:   { fontSize: 12, color: '#64748b', textDecoration: 'none' },
  pageTitle:  { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  dateLine:   { fontSize: 13, color: '#64748b', margin: 0 },
  statusBadge: { fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99 },
  lockedBanner: {
    padding: '12px 16px', backgroundColor: '#fffbeb',
    border: '1px solid #fde68a', borderRadius: 10,
    fontSize: 13, color: '#92400e',
  },

  // Section header
  sectionHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', borderBottom: '1px solid #f1f5f9',
  },

  // Item card
  itemCard:    { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f8fafc' },
  iDate:       { width: 78, flexShrink: 0, paddingTop: 2 },
  iBody:       { flex: 1, minWidth: 0 },
  iAmt:        { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  receiptBadge: { fontSize: 9, fontWeight: 700, paddingTop: 1, paddingBottom: 1, paddingLeft: 5, paddingRight: 5, borderRadius: 6, backgroundColor: '#f0fdf4', color: '#15803d' },

  // Totals
  totalsRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px',
    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
  },

  // Add buttons
  addRow: { display: 'flex', gap: 8 },
  btnAdd: {
    flex: 1, padding: '11px 4px', backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 10,
    fontSize: 12, fontWeight: 600, color: '#374151',
    cursor: 'pointer', textAlign: 'center',
  },
  btnToll:      { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' },
  btnParking:   { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' },
  btnTransport: { backgroundColor: '#fffbeb', borderColor: '#fde68a', color: '#92400e' },

  // Submit
  btnSubmit: {
    width: '100%', padding: '14px',
    backgroundColor: '#0f172a', color: '#fff',
    border: 'none', borderRadius: 10,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },

  // Delete
  btnDeleteClaim:   { width: '100%', padding: '11px', backgroundColor: 'transparent', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  confirmBox:       { padding: '14px', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 12, display: 'flex', flexDirection: 'column' as const, gap: 12 },
  confirmText:      { margin: 0, fontSize: 13, color: '#7f1d1d', lineHeight: 1.6 },
  confirmRow:       { display: 'flex', gap: 10 },
  btnConfirmDelete: { flex: 1, padding: '11px 0', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  btnConfirmCancel: { flex: 1, padding: '11px 0', backgroundColor: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },

  // Modal
  overlay:     { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.45)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  modal:       { width: '100%', maxWidth: 480, backgroundColor: '#fff', borderRadius: '16px 16px 0 0', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 },
  modalBody:   { flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
  modalFooter: { padding: '14px 20px', borderTop: '1px solid #f1f5f9', flexShrink: 0 },

  // Form fields
  fieldGroup:    { display: 'flex', flexDirection: 'column', gap: 5 },
  fieldLabel:    { fontSize: 12, fontWeight: 600, color: '#374151' },
  input:         { padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, color: '#0f172a', backgroundColor: '#fff', width: '100%', boxSizing: 'border-box' },
  amountWrap:    { display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', backgroundColor: '#fff' },
  amountPrefix:  { padding: '9px 12px', backgroundColor: '#f8fafc', fontSize: 13, fontWeight: 600, color: '#64748b', borderRight: '1px solid #e2e8f0', flexShrink: 0 },
  amountInput:   { flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 15, fontWeight: 600, color: '#0f172a', backgroundColor: 'transparent' },

  // Buttons in forms
  btnCancel:  { flex: 1, padding: '11px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnPrimary: { flex: 2, padding: '11px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' },
  errorBox:   { padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626' },

  // Trip picker
  tripOpt: { display: 'flex', flexDirection: 'column', gap: 4, width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box', background: '#fff' },

  // Spinner
  spinner: { width: 28, height: 28, border: '3px solid #e2e8f0', borderTopColor: '#0891b2', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
}
