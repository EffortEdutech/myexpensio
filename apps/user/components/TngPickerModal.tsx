'use client'
// apps/user/components/TngPickerModal.tsx
//
// Used in claim detail when user clicks "Toll" or "Parking" → "From TNG Statement"
//
// Fetches unclaimed tng_transactions filtered by sector.
// User picks one → caller receives the tng_transaction_id.
//
// Props:
//   sector   — 'TOLL' | 'PARKING'
//   onPick   — called with { tng_transaction_id }
//   onClose  — close without picking
//   onManual — switch to manual entry form

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type TngTxn = {
  id:             string
  trans_no:       string | null
  entry_datetime: string | null
  entry_location: string | null
  exit_location:  string | null
  amount:         number
  currency:       string
  claimed:        boolean
}

type Props = {
  sector:   'TOLL' | 'PARKING'
  onPick:   (txnId: string) => void
  onClose:  () => void
  onManual: () => void
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMyr(n: number) {
  return 'RM ' + Number(n).toFixed(2)
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function TngPickerModal({ sector, onPick, onClose, onManual }: Props) {
  const [items,   setItems]   = useState<TngTxn[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [picking, setPicking] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams({ sector, claimed: 'false' })
    fetch('/api/tng/transactions?' + params.toString())
      .then(r => r.json())
      .then(json => {
        setItems(json.items ?? [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load TNG transactions.')
        setLoading(false)
      })
  }, [sector])

  async function handlePick(txnId: string) {
    setPicking(txnId)
    try {
      onPick(txnId)
    } catch {
      setPicking(null)
    }
  }

  const icon  = sector === 'TOLL' ? '🛣' : '🅿'
  const label = sector === 'TOLL' ? 'Toll' : 'Parking'
  const color = sector === 'TOLL' ? '#16a34a' : '#1d4ed8'
  const bg    = sector === 'TOLL' ? '#f0fdf4' : '#eff6ff'

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ ...S.iconWrap, backgroundColor: bg, color }}>
              {icon}
            </div>
            <div>
              <div style={S.title}>Add {label} from TNG</div>
              <div style={S.subtitle}>Select an unclaimed transaction</div>
            </div>
          </div>
          <button onClick={onClose} style={S.closeBtn}>✕</button>
        </div>

        {/* Body */}
        <div style={S.body}>

          {loading && (
            <div style={S.centered}>
              <div style={S.spinner} />
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Loading transactions…</p>
            </div>
          )}

          {error && (
            <div style={S.errorBox}>{error}</div>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={S.emptyBox}>
              <div style={{ fontSize: 32 }}>{icon}</div>
              <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                No unclaimed {label.toLowerCase()} transactions
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px', textAlign: 'center' }}>
                Import your TNG statement first, or use manual entry.
              </p>
              <a href="/tng" target="_blank" rel="noopener" style={S.importLink}>
                ＋ Import TNG Statement ↗
              </a>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div style={S.list}>
              {items.map(txn => (
                <button
                  key={txn.id}
                  onClick={() => handlePick(txn.id)}
                  disabled={picking !== null}
                  style={{
                    ...S.txnBtn,
                    opacity: picking === txn.id ? 0.6 : 1,
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <div style={S.txnLeft}>
                    <div style={S.txnDate}>{fmtDateShort(txn.entry_datetime)}</div>
                    <div style={S.txnLoc}>
                      {txn.entry_location ?? '—'}
                      {sector === 'TOLL' && txn.exit_location && (
                        <span style={{ color: '#94a3b8' }}> → {txn.exit_location}</span>
                      )}
                    </div>
                    {txn.trans_no && (
                      <div style={S.txnNo}>#{txn.trans_no}</div>
                    )}
                  </div>
                  <div style={S.txnRight}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                      {fmtMyr(txn.amount)}
                    </span>
                    {picking === txn.id ? (
                      <span style={{ fontSize: 11, color: '#64748b' }}>Adding…</span>
                    ) : (
                      <span style={{ fontSize: 11, color, fontWeight: 600 }}>Select →</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Don't see your transaction?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="/tng"
              target="_blank"
              rel="noopener"
              style={S.footerLink}
            >
              Import from TNG ↗
            </a>
            <button onClick={onManual} style={S.footerManualBtn}>
              Manual Entry
            </button>
          </div>
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
    maxHeight: '82vh',
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
    padding: '12px 0',
  },
  centered: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    padding: '32px 24px',
  },
  spinner: {
    width: 28, height: 28,
    border: '3px solid #e2e8f0',
    borderTopColor: '#0891b2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    margin: '12px 20px',
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    fontSize: 13, color: '#dc2626',
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    padding: '32px 24px', textAlign: 'center',
  },
  importLink: {
    padding: '8px 16px',
    backgroundColor: '#0891b2',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13, fontWeight: 600,
  },
  list: {
    display: 'flex', flexDirection: 'column',
  },
  txnBtn: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 20px',
    background: '#fff',
    border: 'none',
    borderBottom: '1px solid #f8fafc',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    gap: 12,
    transition: 'background 0.1s',
  },
  txnLeft: {
    flex: 1, minWidth: 0,
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  txnDate: {
    fontSize: 11, fontWeight: 600, color: '#64748b',
  },
  txnLoc: {
    fontSize: 13, fontWeight: 600, color: '#0f172a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  txnNo: {
    fontSize: 10, color: '#94a3b8',
  },
  txnRight: {
    flexShrink: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
  },
  footer: {
    padding: '14px 20px',
    borderTop: '1px solid #f1f5f9',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 8,
    flexShrink: 0,
  },
  footerLink: {
    fontSize: 12, fontWeight: 600, color: '#0891b2',
    textDecoration: 'none',
    padding: '6px 12px',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
  },
  footerManualBtn: {
    fontSize: 12, fontWeight: 600, color: '#475569',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '6px 12px',
    cursor: 'pointer',
  },
}
