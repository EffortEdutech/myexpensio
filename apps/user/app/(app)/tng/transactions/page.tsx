'use client'
// apps/user/app/(app)/tng/transactions/page.tsx
//
// GET /api/tng/transactions — lists all saved TNG transactions for the current user.
//
// Filters:
//   sector  — TOLL | PARKING | ALL
//   claimed — true | false | ALL
//   from/to — date range (YYYY-MM-DD)
//
// Navigation:
//   Back to /tng  (import another)
//   Claimed items link to their claim via claim_item_id (future enhancement)

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type TngTxn = {
  id:              string
  trans_no:        string | null
  entry_datetime:  string | null
  exit_datetime:   string | null
  entry_location:  string | null
  exit_location:   string | null
  amount:          number
  currency:        string
  sector:          'TOLL' | 'PARKING' | 'RETAIL'
  claimed:         boolean
  claim_item_id:   string | null
  created_at:      string
}

type FilterSector  = 'ALL' | 'TOLL' | 'PARKING'
type FilterClaimed = 'ALL' | 'UNCLAIMED' | 'CLAIMED'

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMyr(n: number) {
  return 'RM ' + Number(n).toFixed(2)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return '—' }
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('en-MY', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '—' }
}

const SECTOR_ICONS: Record<string, string> = {
  TOLL:    '🛣',
  PARKING: '🅿',
  RETAIL:  '🛒',
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TngTransactionsPage() {
  const [transactions, setTransactions] = useState<TngTxn[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  // Filters
  const [sector,  setSector]  = useState<FilterSector>('ALL')
  const [claimed, setClaimed] = useState<FilterClaimed>('ALL')
  const [from,    setFrom]    = useState('')
  const [to,      setTo]      = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (sector  !== 'ALL') params.set('sector',  sector)
    if (claimed === 'UNCLAIMED') params.set('claimed', 'false')
    if (claimed === 'CLAIMED')   params.set('claimed', 'true')
    if (from) params.set('from', from)
    if (to)   params.set('to',   to)

    const res  = await fetch('/api/tng/transactions?' + params.toString())
    const json = await res.json()

    if (!res.ok) {
      setError(json.error?.message ?? 'Failed to load transactions.')
      setLoading(false)
      return
    }

    setTransactions(json.items ?? [])
    setLoading(false)
  }, [sector, claimed, from, to])

  useEffect(() => { load() }, [load])

  // ── Derived totals ─────────────────────────────────────────────────────────

  const totalAmount    = transactions.reduce((s, t) => s + Number(t.amount), 0)
  const unclaimedCount = transactions.filter(t => !t.claimed).length
  const claimedCount   = transactions.filter(t => t.claimed).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={S.header}>
        <div>
          <Link href="/tng" style={S.backLink}>← Import Statement</Link>
          <h1 style={S.pageTitle}>TNG Transactions</h1>
          <p style={S.pageSub}>Toll and parking records imported from your TNG statements.</p>
        </div>
        <Link href="/tng" style={S.importBtn}>
          ＋ Import New Statement
        </Link>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────── */}
      {!loading && !error && transactions.length > 0 && (
        <div style={S.statsBar}>
          <div style={S.statItem}>
            <span style={S.statNum}>{transactions.length}</span>
            <span style={S.statLabel}>Total</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={{ ...S.statNum, color: '#64748b' }}>{unclaimedCount}</span>
            <span style={S.statLabel}>Unclaimed</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={{ ...S.statNum, color: '#059669' }}>{claimedCount}</span>
            <span style={S.statLabel}>Claimed</span>
          </div>
          <div style={S.statDivider} />
          <div style={S.statItem}>
            <span style={S.statNum}>{fmtMyr(totalAmount)}</span>
            <span style={S.statLabel}>Total Amount</span>
          </div>
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div style={S.filters}>
        {/* Sector filter */}
        <div style={S.filterGroup}>
          {(['ALL', 'TOLL', 'PARKING'] as FilterSector[]).map(s => (
            <button
              key={s}
              onClick={() => setSector(s)}
              style={{ ...S.filterBtn, ...(sector === s ? S.filterActive : {}) }}
            >
              {s === 'TOLL' ? '🛣 Toll' : s === 'PARKING' ? '🅿 Parking' : 'All Types'}
            </button>
          ))}
        </div>

        {/* Claimed filter */}
        <div style={S.filterGroup}>
          {(['ALL', 'UNCLAIMED', 'CLAIMED'] as FilterClaimed[]).map(c => (
            <button
              key={c}
              onClick={() => setClaimed(c)}
              style={{ ...S.filterBtn, ...(claimed === c ? S.filterActive : {}) }}
            >
              {c === 'UNCLAIMED' ? '○ Unclaimed' : c === 'CLAIMED' ? '✓ Claimed' : 'All Status'}
            </button>
          ))}
        </div>

        {/* Date range */}
        <div style={S.dateRow}>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            style={S.dateInput}
            placeholder="From"
          />
          <span style={{ color: '#94a3b8', fontSize: 12 }}>to</span>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            style={S.dateInput}
            placeholder="To"
          />
          {(from || to) && (
            <button onClick={() => { setFrom(''); setTo('') }} style={S.clearDateBtn}>Clear</button>
          )}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}

      {loading && (
        <div style={S.centered}>
          <div style={S.spinner} />
          <p style={{ color: '#64748b', fontSize: 13 }}>Loading transactions…</p>
        </div>
      )}

      {error && (
        <div style={S.errorBox}>
          <span style={{ fontWeight: 600 }}>Error</span><br />
          {error}
          <button onClick={load} style={S.retryBtn}>Retry</button>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div style={S.emptyBox}>
          <div style={{ fontSize: 36 }}>💳</div>
          <p style={{ fontWeight: 700, color: '#0f172a', margin: 0 }}>No transactions found</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 16px' }}>
            {sector !== 'ALL' || claimed !== 'ALL' || from || to
              ? 'Try adjusting your filters above.'
              : 'Import a TNG statement to get started.'}
          </p>
          <Link href="/tng" style={S.importBtn}>Import Statement</Link>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div style={S.list}>
          {transactions.map(txn => (
            <TxnRow key={txn.id} txn={txn} />
          ))}
        </div>
      )}

    </div>
  )
}

// ── TxnRow component ───────────────────────────────────────────────────────────

function TxnRow({ txn }: { txn: TngTxn }) {
  return (
    <div style={S.txnRow}>
      {/* Sector icon */}
      <div style={{
        ...S.sectorIcon,
        backgroundColor: txn.sector === 'TOLL' ? '#f0fdf4' : '#eff6ff',
        color:           txn.sector === 'TOLL' ? '#16a34a' : '#1d4ed8',
      }}>
        {SECTOR_ICONS[txn.sector] ?? '?'}
      </div>

      {/* Main content */}
      <div style={S.txnBody}>
        <div style={S.txnTop}>
          <span style={S.txnType}>{txn.sector}</span>
          {txn.trans_no && (
            <span style={S.txnNo}>#{txn.trans_no}</span>
          )}
        </div>

        {/* Location */}
        {(txn.entry_location || txn.exit_location) ? (
          <div style={S.txnLoc}>
            {txn.entry_location}
            {txn.exit_location && (
              <span> → {txn.exit_location}</span>
            )}
          </div>
        ) : (
          <div style={{ ...S.txnLoc, color: '#94a3b8', fontStyle: 'italic' }}>
            Location not extracted
          </div>
        )}

        <div style={S.txnMeta}>
          <span>{fmtDateTime(txn.entry_datetime)}</span>
          {txn.exit_datetime && txn.exit_datetime !== txn.entry_datetime && (
            <span style={{ color: '#94a3b8' }}>→ {fmtDateTime(txn.exit_datetime)}</span>
          )}
        </div>
      </div>

      {/* Right: Amount + Status */}
      <div style={S.txnRight}>
        <span style={S.txnAmount}>{fmtMyr(txn.amount)}</span>
        <span style={{
          ...S.statusBadge,
          backgroundColor: txn.claimed ? '#d1fae5' : '#f1f5f9',
          color:           txn.claimed ? '#059669' : '#64748b',
        }}>
          {txn.claimed ? '✓ Claimed' : '○ Unclaimed'}
        </span>
      </div>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', gap: 14,
    maxWidth: 680, paddingBottom: 60,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 12, flexWrap: 'wrap',
  },
  backLink: {
    fontSize: 12, color: '#64748b', textDecoration: 'none',
    display: 'block', marginBottom: 4,
  },
  pageTitle: {
    fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0,
  },
  pageSub: {
    fontSize: 13, color: '#64748b', margin: '4px 0 0',
  },
  importBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: '#0891b2',
    color: '#fff',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap',
  },

  // Stats
  statsBar: {
    display: 'flex', alignItems: 'center', gap: 0,
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '12px 8px',
  },
  statNum: {
    fontSize: 18, fontWeight: 800, color: '#0f172a',
  },
  statLabel: {
    fontSize: 11, color: '#64748b',
  },
  statDivider: {
    width: 1, height: 36, backgroundColor: '#e2e8f0',
  },

  // Filters
  filters: {
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  filterGroup: {
    display: 'flex', gap: 6, flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '6px 14px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: 99,
    fontSize: 12, fontWeight: 600,
    cursor: 'pointer',
  },
  filterActive: {
    backgroundColor: '#0f172a',
    color: '#fff',
    border: '1px solid #0f172a',
  },
  dateRow: {
    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
  },
  dateInput: {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    fontSize: 12, color: '#0f172a',
    backgroundColor: '#fff',
  },
  clearDateBtn: {
    fontSize: 12, color: '#64748b',
    background: 'none', border: 'none',
    cursor: 'pointer', padding: '4px 8px',
  },

  // Loading/Error/Empty
  centered: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
    padding: '48px 24px',
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid #e2e8f0',
    borderTopColor: '#0891b2',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  errorBox: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 10, fontSize: 13, color: '#dc2626',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    padding: '6px 14px',
    backgroundColor: '#fff', border: '1px solid #fecaca',
    borderRadius: 8, fontSize: 12, color: '#dc2626',
    cursor: 'pointer',
  },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '48px 24px', textAlign: 'center',
    backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
  },

  // Transaction list
  list: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
  },
  txnRow: {
    display: 'flex', alignItems: 'flex-start', gap: 12,
    padding: '14px 16px',
    borderBottom: '1px solid #f8fafc',
  },
  sectorIcon: {
    width: 36, height: 36, flexShrink: 0,
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18,
  },
  txnBody: {
    flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3,
  },
  txnTop: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  txnType: {
    fontSize: 11, fontWeight: 700, color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  txnNo: {
    fontSize: 11, color: '#94a3b8',
  },
  txnLoc: {
    fontSize: 13, fontWeight: 600, color: '#0f172a',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  txnMeta: {
    fontSize: 11, color: '#64748b',
    display: 'flex', gap: 8,
  },
  txnRight: {
    flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6,
  },
  txnAmount: {
    fontSize: 15, fontWeight: 800, color: '#0f172a',
  },
  statusBadge: {
    fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 99,
  },
}
