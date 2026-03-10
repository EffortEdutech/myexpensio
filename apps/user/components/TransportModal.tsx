'use client'
// apps/user/components/TransportModal.tsx
//
// Modal for manually adding transport claim items:
//   TOLL    — amount + date + entry/exit location
//   PARKING — amount + date + location + receipt (optional)
//   TAXI    — amount + date + merchant + receipt (optional)
//   GRAB    — amount + date + merchant + receipt (optional)
//   TRAIN   — amount + date + merchant + receipt (optional)
//   FLIGHT  — amount + date + merchant + receipt (optional)
//
// Props:
//   type     — ClaimItemType (TOLL | PARKING | TAXI | GRAB | TRAIN | FLIGHT)
//   onAdd    — called with form data; parent does the fetch
//   onClose  — close modal

import { useState } from 'react'
import { ReceiptUploader } from '@/components/ReceiptUploader'

// ── Types ──────────────────────────────────────────────────────────────────────

export type TransportItemType = 'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'FLIGHT'

export type TransportFormData = {
  type:            TransportItemType
  amount:          number
  claim_date:      string
  merchant?:       string
  notes?:          string
  receipt_url?:    string
  entry_location?: string    // TOLL only
  exit_location?:  string    // TOLL only
  location?:       string    // PARKING
}

type Props = {
  type:    TransportItemType
  onAdd:   (data: TransportFormData) => Promise<void>
  onClose: () => void
}

// ── Config ─────────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TransportItemType, {
  icon:        string
  label:       string
  color:       string
  bg:          string
  showReceipt: boolean
  showRoute:   boolean   // entry/exit for TOLL
  showLoc:     boolean   // single location for PARKING
  showMerchant: boolean
  merchantLabel: string
  amountLabel:   string
}> = {
  TOLL: {
    icon: '🛣', label: 'Toll',
    color: '#16a34a', bg: '#f0fdf4',
    showReceipt: false, showRoute: true, showLoc: false, showMerchant: false,
    merchantLabel: '', amountLabel: 'Toll Amount (MYR)',
  },
  PARKING: {
    icon: '🅿', label: 'Parking',
    color: '#1d4ed8', bg: '#eff6ff',
    showReceipt: true, showRoute: false, showLoc: true, showMerchant: false,
    merchantLabel: 'Parking Location',
    amountLabel: 'Parking Amount (MYR)',
  },
  TAXI: {
    icon: '🚕', label: 'Taxi',
    color: '#b45309', bg: '#fffbeb',
    showReceipt: true, showRoute: false, showLoc: false, showMerchant: true,
    merchantLabel: 'Route / Description',
    amountLabel: 'Fare Amount (MYR)',
  },
  GRAB: {
    icon: '🚗', label: 'Grab',
    color: '#00b14f', bg: '#f0fdf4',
    showReceipt: true, showRoute: false, showLoc: false, showMerchant: true,
    merchantLabel: 'Route / Description',
    amountLabel: 'Fare Amount (MYR)',
  },
  TRAIN: {
    icon: '🚆', label: 'Train',
    color: '#7c3aed', bg: '#f5f3ff',
    showReceipt: true, showRoute: false, showLoc: false, showMerchant: true,
    merchantLabel: 'Route / Line (e.g. KTM Komuter)',
    amountLabel: 'Ticket Amount (MYR)',
  },
  FLIGHT: {
    icon: '✈️', label: 'Flight',
    color: '#0369a1', bg: '#f0f9ff',
    showReceipt: true, showRoute: false, showLoc: false, showMerchant: true,
    merchantLabel: 'Route / Airline (e.g. AirAsia KL-JHB)',
    amountLabel: 'Ticket Amount (MYR)',
  },
}

// ── Today's date as YYYY-MM-DD ─────────────────────────────────────────────────
const today = new Date().toISOString().slice(0, 10)

// ── Component ──────────────────────────────────────────────────────────────────

export function TransportModal({ type, onAdd, onClose }: Props) {
  const cfg = TYPE_CONFIG[type]

  const [amount,        setAmount]        = useState('')
  const [claimDate,     setClaimDate]     = useState(today)
  const [merchant,      setMerchant]      = useState('')
  const [notes,         setNotes]         = useState('')
  const [receiptUrl,    setReceiptUrl]    = useState<string | undefined>()
  const [entryLocation, setEntryLocation] = useState('')
  const [exitLocation,  setExitLocation]  = useState('')
  const [location,      setLocation]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  async function handleSave() {
    // Validate
    const amtNum = parseFloat(amount)
    if (!amount || isNaN(amtNum) || amtNum <= 0) {
      setError('Please enter a valid amount greater than 0.')
      return
    }
    if (!claimDate) {
      setError('Please select a date.')
      return
    }

    setError(null)
    setSaving(true)

    try {
      const data: TransportFormData = {
        type,
        amount:     amtNum,
        claim_date: claimDate,
        merchant:   cfg.showMerchant ? (merchant.trim() || undefined) : undefined,
        notes:      notes.trim() || undefined,
        receipt_url: receiptUrl,
        ...(cfg.showRoute ? {
          entry_location: entryLocation.trim() || undefined,
          exit_location:  exitLocation.trim()  || undefined,
        } : {}),
        ...(cfg.showLoc ? {
          location: location.trim() || undefined,
          merchant: location.trim() || undefined,
        } : {}),
      }
      await onAdd(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add item.')
      setSaving(false)
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...S.iconWrap, backgroundColor: cfg.bg, color: cfg.color }}>
              {cfg.icon}
            </div>
            <div>
              <div style={S.title}>Add {cfg.label}</div>
              <div style={S.subtitle}>Manual entry</div>
            </div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={S.body}>
          {error && (
            <div style={S.errorBox}>{error}</div>
          )}

          {/* Amount */}
          <div style={S.field}>
            <label style={S.label}>{cfg.amountLabel} *</label>
            <div style={S.amountWrap}>
              <span style={S.currencyPrefix}>RM</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                style={S.amountInput}
              />
            </div>
          </div>

          {/* Date */}
          <div style={S.field}>
            <label style={S.label}>Date *</label>
            <input
              type="date"
              value={claimDate}
              onChange={e => setClaimDate(e.target.value)}
              max={today}
              style={S.input}
            />
          </div>

          {/* TOLL: Entry / Exit location */}
          {cfg.showRoute && (
            <>
              <div style={S.field}>
                <label style={S.label}>Entry Point</label>
                <input
                  type="text"
                  value={entryLocation}
                  onChange={e => setEntryLocation(e.target.value)}
                  placeholder="e.g. PLUS – Ayer Keroh"
                  style={S.input}
                />
              </div>
              <div style={S.field}>
                <label style={S.label}>Exit Point</label>
                <input
                  type="text"
                  value={exitLocation}
                  onChange={e => setExitLocation(e.target.value)}
                  placeholder="e.g. ELITE – Bandar Serenia"
                  style={S.input}
                />
              </div>
            </>
          )}

          {/* PARKING: Single location */}
          {cfg.showLoc && (
            <div style={S.field}>
              <label style={S.label}>{cfg.merchantLabel}</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Mydin Mall MITC"
                style={S.input}
              />
            </div>
          )}

          {/* TAXI/GRAB/TRAIN/FLIGHT: Merchant/Description */}
          {cfg.showMerchant && (
            <div style={S.field}>
              <label style={S.label}>{cfg.merchantLabel}</label>
              <input
                type="text"
                value={merchant}
                onChange={e => setMerchant(e.target.value)}
                placeholder={
                  type === 'GRAB'   ? 'e.g. KL Sentral → KLCC' :
                  type === 'TRAIN'  ? 'e.g. KTM Komuter, Seremban line' :
                  type === 'FLIGHT' ? 'e.g. AirAsia KUL-JHB' :
                  'Description'
                }
                style={S.input}
              />
            </div>
          )}

          {/* Notes */}
          <div style={S.field}>
            <label style={S.label}>Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes"
              style={S.input}
            />
          </div>

          {/* Receipt upload */}
          {cfg.showReceipt && (
            <div style={S.field}>
              <label style={S.label}>Receipt / Ticket (optional)</label>
              <ReceiptUploader
                storagePath={receiptUrl}
                onUploaded={path => setReceiptUrl(path)}
                purpose="RECEIPT"
                label={
                  type === 'FLIGHT' ? 'Upload e-Ticket' :
                  type === 'TRAIN'  ? 'Upload Ticket' :
                  'Upload Receipt'
                }
                enableScan
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button onClick={onClose} style={S.cancelBtn} disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ ...S.saveBtn, backgroundColor: cfg.color, opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : `Add ${cfg.label}`}
          </button>
        </div>

      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    backgroundColor: 'rgba(15,23,42,0.45)',
    zIndex: 100,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  modal: {
    width: '100%', maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: '20px 20px 0 0',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20,
  },
  title: {
    fontSize: 16, fontWeight: 700, color: '#0f172a',
  },
  subtitle: {
    fontSize: 12, color: '#64748b',
  },
  closeBtn: {
    background: 'none', border: 'none',
    fontSize: 18, color: '#94a3b8',
    cursor: 'pointer', padding: 4,
  },
  body: {
    flex: 1, overflowY: 'auto',
    padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },
  errorBox: {
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13, color: '#dc2626',
  },
  field: {
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  label: {
    fontSize: 12, fontWeight: 600, color: '#374151',
  },
  input: {
    padding: '9px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14, color: '#0f172a',
    backgroundColor: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  amountWrap: {
    display: 'flex', alignItems: 'center',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  currencyPrefix: {
    padding: '9px 12px',
    backgroundColor: '#f8fafc',
    fontSize: 13, fontWeight: 600, color: '#64748b',
    borderRight: '1px solid #e2e8f0',
    flexShrink: 0,
  },
  amountInput: {
    flex: 1, padding: '9px 12px',
    border: 'none', outline: 'none',
    fontSize: 15, fontWeight: 600, color: '#0f172a',
    backgroundColor: 'transparent',
  },
  footer: {
    display: 'flex', gap: 10,
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 2,
    padding: '11px',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 14, fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
}
