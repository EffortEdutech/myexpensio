'use client'
// apps/user/app/(app)/transactions/page.tsx
// Route: /transactions
//
// Unified Transactions tab — everything that has been paid and logged:
//   - TNG statement rows (TOLL + PARKING from imported statements)
//   - Transport claim items (TAXI / GRAB / TRAIN / FLIGHT / BUS / manual TOLL / manual PARKING)
//
// Features:
//   - Filter chips: All · Unmatched · TOLL · PARKING · Grab · Train · Bus · Taxi · Flight
//   - "By Statement" grouped view: collapses TNG rows under their statement header
//   - Statement badge on TNG rows showing which import batch they came from
//   - 6-month display window (display filter only — no DB delete)
//   - "Unmatched" shows TNG rows not yet linked to any claim item
//   - Direction A matching: tap unmatched TNG row → bottom sheet → pick claim → pick item → link
//
// API:
//   GET  /api/transactions               — unified ledger (now returns statement_label)
//   POST /api/transactions/[tng_id]/link — Direction A link (bottom sheet confirm)
//   GET  /api/claims?status=DRAFT        — for match sheet claim list

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedTransaction = {
  id:              string
  source:          'TNG' | 'CLAIM'
  type:            string
  date:            string
  description:     string
  amount:          number
  currency:        'MYR'
  matched:         boolean
  paid_via_tng:    boolean
  claim_id:        string | null
  claim_title:     string | null
  tng_id:          string | null
  mode?:           string | null
  upload_batch_id: string | null
  statement_label: string | null   // ← which statement this TNG row came from
}

type Summary = {
  total_count:      number
  unmatched_count:  number
  total_amount_myr: number
}

type DraftClaim = {
  id:           string
  title:        string | null
  period_start: string
  period_end:   string
  status:       string
}

type ClaimItem = {
  id:                 string
  type:               string
  claim_date:         string | null
  merchant:           string | null
  amount:             number
  tng_transaction_id: string | null
  mode?:              string | null
  paid_via_tng?:      boolean | null
}

type FilterType = 'ALL' | 'UNMATCHED' | 'TOLL' | 'PARKING' | 'GRAB' | 'TRAIN' | 'BUS' | 'TAXI' | 'FLIGHT'
type ViewMode   = 'FLAT' | 'BY_STATEMENT'

// ── Grouped types ─────────────────────────────────────────────────────────────

type MonthGroup = {
  month: string
  rows:  UnifiedTransaction[]
}

type StatementGroup = {
  label:           string           // statement_label (or "No Statement")
  upload_batch_id: string | null
  rows:            UnifiedTransaction[]
  total_amount:    number
  unmatched_count: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMyr(n: number): string {
  return `RM ${Number(n).toFixed(2)}`
}

function fmtDate(iso: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso + 'T00:00:00+08:00').toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return iso }
}

function groupByMonth(items: UnifiedTransaction[]): MonthGroup[] {
  const map = new Map<string, UnifiedTransaction[]>()
  for (const item of items) {
    const key = item.date.slice(0, 7) // YYYY-MM
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, rows]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-MY', { month: 'long', year: 'numeric' }),
      rows,
    }))
}

function groupByStatement(items: UnifiedTransaction[]): StatementGroup[] {
  // Only TNG source rows participate in statement grouping
  // CLAIM rows appear under a special "Claim Items" group
  const tngItems   = items.filter(i => i.source === 'TNG')
  const claimItems = items.filter(i => i.source === 'CLAIM')

  const map = new Map<string, StatementGroup>()

  for (const row of tngItems) {
    const key   = row.upload_batch_id ?? 'unknown'
    const label = row.statement_label ?? 'Unknown Statement'
    if (!map.has(key)) {
      map.set(key, {
        label,
        upload_batch_id: row.upload_batch_id,
        rows:            [],
        total_amount:    0,
        unmatched_count: 0,
      })
    }
    const g = map.get(key)!
    g.rows.push(row)
    g.total_amount    += row.amount
    g.unmatched_count += row.matched ? 0 : 1
  }

  const groups: StatementGroup[] = Array.from(map.values())
    .sort((a, b) => a.label.localeCompare(b.label))

  // Claim items appended at the end
  if (claimItems.length > 0) {
    groups.push({
      label:           '🧾 Claim Items',
      upload_batch_id: null,
      rows:            claimItems,
      total_amount:    claimItems.reduce((s, r) => s + r.amount, 0),
      unmatched_count: 0,
    })
  }

  return groups
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  page:        { padding: '20px 16px 80px', maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui, sans-serif' } as React.CSSProperties,
  chip:        { fontSize: 12, fontWeight: 600, padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 20, cursor: 'pointer', backgroundColor: '#fff', color: '#64748b', whiteSpace: 'nowrap' as const } as React.CSSProperties,
  chipActive:  { backgroundColor: '#0f172a', color: '#fff', border: '1px solid #0f172a' } as React.CSSProperties,
  chipAlt:     { backgroundColor: '#7c3aed', color: '#fff', border: '1px solid #7c3aed' } as React.CSSProperties,
  statBar:     { display: 'flex', gap: 0, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 14 } as React.CSSProperties,
  statItem:    { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '10px 6px' } as React.CSSProperties,
  statNum:     { fontSize: 15, fontWeight: 800, color: '#0f172a' } as React.CSSProperties,
  statLabel:   { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.04em', marginTop: 2 } as React.CSSProperties,
  statDivider: { width: 1, backgroundColor: '#f1f5f9', alignSelf: 'stretch' } as React.CSSProperties,
  monthHead:   { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 2 } as React.CSSProperties,
  stmtHead:    { padding: '12px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', cursor: 'pointer', userSelect: 'none' as const } as React.CSSProperties,
  stmtLabel:   { fontSize: 13, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
  stmtMeta:    { fontSize: 11, color: '#64748b', marginTop: 2 } as React.CSSProperties,
  errorBox:    { padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#dc2626', marginBottom: 10 } as React.CSSProperties,
  spinner:     { width: 24, height: 24, borderTop: '3px solid #0f172a', borderRight: '3px solid #e2e8f0', borderBottom: '3px solid #e2e8f0', borderLeft: '3px solid #e2e8f0', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' } as React.CSSProperties,
}

// ── TxnRow ────────────────────────────────────────────────────────────────────

function TxnRow({
  txn,
  showStatementBadge,
  onLinkTap,
  onUnlinkTap,
  busy,
}: {
  txn:                UnifiedTransaction
  showStatementBadge: boolean
  onLinkTap:          (txn: UnifiedTransaction) => void
  onUnlinkTap:        (tngId: string) => void
  busy:               boolean
}) {
  const isTng     = txn.source === 'TNG'
  const unmatched = isTng && !txn.matched

  const typeIcon: Record<string, string> = {
    TOLL:    '🛣️',   // variation selector FE0F forces colour emoji rendering
    PARKING: '🅿️',
    GRAB:    '🚗',
    TAXI:    '🚕',
    TRAIN:   '🚆',
    BUS:     '🚌',
    FLIGHT:  '✈️',
  }
  const icon = typeIcon[txn.type] ?? '💳'

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 14px',
      borderBottom: '1px solid #f1f5f9',
      backgroundColor: unmatched ? '#fffbeb' : '#fff',
      opacity: busy ? 0.5 : 1,
    }}>
      {/* Icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 9, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 15, flexShrink: 0,
        backgroundColor: unmatched ? '#fef3c7' : isTng ? '#f0fdf4' : '#f8fafc',
      }}>
        {icon}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', lineHeight: 1.3 }}>
          {txn.description}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
          {fmtDate(txn.date)}
          {txn.type && <> · <span style={{ color: '#64748b', fontWeight: 600 }}>{txn.type}</span></>}
          {txn.claim_title && <> · {txn.claim_title}</>}
        </div>

        {/* Statement badge — shown in flat/monthly view to attribute TNG rows */}
        {isTng && showStatementBadge && txn.statement_label && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4,
            fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10,
            backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
          }}>
            📋 {txn.statement_label}
          </div>
        )}

        {/* Match/unlink action */}
        {isTng && (
          <div style={{ marginTop: 5 }}>
            {unmatched ? (
              <button
                onClick={() => onLinkTap(txn)}
                disabled={busy}
                style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', border: '1px solid #bfdbfe', borderRadius: 6, backgroundColor: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}
              >
                + Match to claim
              </button>
            ) : (
              <span style={{ fontSize: 11, color: '#15803d', fontWeight: 600 }}>✓ Matched</span>
            )}
          </div>
        )}
      </div>

      {/* Amount */}
      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtMyr(txn.amount)}</div>
        {txn.paid_via_tng && <div style={{ fontSize: 9, color: '#0ea5e9', marginTop: 1 }}>TNG</div>}
      </div>
    </div>
  )
}

// ── Link Bottom Sheet ─────────────────────────────────────────────────────────

function LinkSheet({
  txn,
  onClose,
  onLinked,
}: {
  txn:      UnifiedTransaction
  onClose:  () => void
  onLinked: () => void
}) {
  const [claims,       setClaims]       = useState<DraftClaim[]>([])
  const [items,        setItems]        = useState<ClaimItem[]>([])
  const [selectedClaim, setSelectedClaim] = useState<string | null>(null)
  const [selectedItem,  setSelectedItem]  = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [linking,      setLinking]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    async function loadClaims() {
      setLoading(true)
      try {
        const res  = await fetch('/api/claims?status=DRAFT')
        const json = await res.json()
        setClaims(json.items ?? [])
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    loadClaims()
  }, [])

  async function loadItems(claimId: string) {
    setSelectedClaim(claimId); setSelectedItem(null); setItems([])
    try {
      const res  = await fetch(`/api/claims/${claimId}/items`)
      const json = await res.json()
      // filter to linkable types
      const linkable = (json.items ?? []).filter((i: ClaimItem) =>
        ['TOLL', 'PARKING'].includes(i.type) && !i.tng_transaction_id
      )
      setItems(linkable)
    } catch { /* silent */ }
  }

  async function doLink() {
    if (!selectedItem || !txn.tng_id) return
    setLinking(true); setError(null)
    try {
      const res = await fetch(`/api/transactions/${txn.tng_id}/link`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ claim_item_id: selectedItem }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message ?? 'Link failed.'); return }
      onLinked()
    } catch { setError('Network error.') }
    finally { setLinking(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: '#fff', borderRadius: '16px 16px 0 0', padding: '20px 16px 36px', width: '100%', maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Match to Claim Item</div>
          <button onClick={onClose} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: 8, marginBottom: 14, fontSize: 12, color: '#64748b' }}>
          {txn.description} · {fmtMyr(txn.amount)}
          {txn.statement_label && (
            <span style={{ marginLeft: 8, padding: '1px 6px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 10, fontWeight: 600, color: '#475569' }}>
              📋 {txn.statement_label}
            </span>
          )}
        </div>

        {error && <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: 8, fontSize: 12, color: '#dc2626', marginBottom: 10 }}>{error}</div>}

        {loading ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: 13 }}>Loading claims…</div> : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>DRAFT CLAIMS</div>
            {claims.length === 0
              ? <div style={{ fontSize: 13, color: '#94a3b8', padding: '12px 0' }}>No draft claims found.</div>
              : claims.map(c => (
                <button key={c.id} onClick={() => loadItems(c.id)}
                  style={{ width: '100%', textAlign: 'left' as const, padding: '10px 12px', marginBottom: 6, border: `1px solid ${selectedClaim === c.id ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 8, backgroundColor: selectedClaim === c.id ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 13, color: '#0f172a' }}>
                  {c.title ?? 'Untitled claim'}
                  <span style={{ float: 'right', fontSize: 11, color: '#94a3b8' }}>{c.period_start} – {c.period_end}</span>
                </button>
              ))}

            {selectedClaim && items.length > 0 && (
              <>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', margin: '12px 0 6px' }}>LINKABLE ITEMS</div>
                {items.map(i => (
                  <button key={i.id} onClick={() => setSelectedItem(i.id)}
                    style={{ width: '100%', textAlign: 'left' as const, padding: '10px 12px', marginBottom: 6, border: `1px solid ${selectedItem === i.id ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 8, backgroundColor: selectedItem === i.id ? '#eff6ff' : '#fff', cursor: 'pointer', fontSize: 13, color: '#0f172a' }}>
                    {i.type} — {i.merchant ?? fmtDate(i.claim_date ?? '')} — {fmtMyr(Number(i.amount))}
                  </button>
                ))}
              </>
            )}

            {selectedClaim && items.length === 0 && !loading && (
              <div style={{ fontSize: 13, color: '#94a3b8', padding: '8px 0' }}>No unlinked toll/parking items in this claim.</div>
            )}
          </>
        )}

        <button
          onClick={doLink}
          disabled={!selectedItem || linking}
          style={{ width: '100%', marginTop: 16, padding: '13px', backgroundColor: selectedItem && !linking ? '#0f172a' : '#f1f5f9', color: selectedItem && !linking ? '#fff' : '#94a3b8', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: selectedItem ? 'pointer' : 'default' }}
        >
          {linking ? 'Linking…' : 'Confirm Link'}
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  return <Suspense><TransactionsContent /></Suspense>
}

function TransactionsContent() {
  const router = useRouter()

  const [items,        setItems]        = useState<UnifiedTransaction[]>([])
  const [summary,      setSummary]      = useState<Summary | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [loadErr,      setLoadErr]      = useState<string | null>(null)
  const [filter,       setFilter]       = useState<FilterType>('ALL')
  const [viewMode,     setViewMode]     = useState<ViewMode>('FLAT')
  const [linkTarget,   setLinkTarget]   = useState<UnifiedTransaction | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [expandedStmt, setExpandedStmt] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true); setLoadErr(null)
    try {
      const params = new URLSearchParams({ filter })
      const res    = await fetch(`/api/transactions?${params}`)
      const json   = await res.json()
      if (!res.ok) { setLoadErr(json.error?.message ?? 'Failed to load.'); return }
      setItems(json.items ?? [])
      setSummary(json.summary ?? null)
    } catch { setLoadErr('Network error.') }
    finally { setLoading(false) }
  }, [filter])

  useEffect(() => { load() }, [load])

  // When switching to BY_STATEMENT view, expand all statements by default
  useEffect(() => {
    if (viewMode === 'BY_STATEMENT' && items.length > 0) {
      const batchIds = new Set(items.filter(i => i.source === 'TNG').map(i => i.upload_batch_id ?? 'unknown'))
      batchIds.add('claim-items')
      setExpandedStmt(batchIds)
    }
  }, [viewMode, items])

  async function handleUnlink(tngId: string) {
    setActionBusyId(tngId)
    try {
      await fetch(`/api/transactions/${tngId}/unlink`, { method: 'POST' })
      load()
    } catch { /* silent */ }
    finally { setActionBusyId(null) }
  }

  function toggleStmt(key: string) {
    setExpandedStmt(prev => {
      const n = new Set(prev)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  const typeOptions: { label: string; value: FilterType; icon: string }[] = [
    { label: 'All types',  value: 'ALL',     icon: '' },
    { label: 'Toll',       value: 'TOLL',    icon: '🛣️' },
    { label: 'Parking',    value: 'PARKING', icon: '🅿️' },
    { label: 'Grab',       value: 'GRAB',    icon: '🚗' },
    { label: 'Train',      value: 'TRAIN',   icon: '🚆' },
    { label: 'Bus',        value: 'BUS',     icon: '🚌' },
    { label: 'Taxi',       value: 'TAXI',    icon: '🚕' },
    { label: 'Flight',     value: 'FLIGHT',  icon: '✈️' },
  ]

  const grouped     = groupByMonth(items)
  const stmtGrouped = groupByStatement(items)

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 Transactions</h1>
        <Link href="/tng" style={{ fontSize: 12, fontWeight: 700, padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a', textDecoration: 'none', backgroundColor: '#fff' }}>
          + Import TNG
        </Link>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────── */}
      {summary && (
        <div style={S.statBar}>
          <div style={S.statItem}><span style={S.statNum}>{summary.total_count}</span><span style={S.statLabel}>Total</span></div>
          <div style={S.statDivider} />
          <div style={S.statItem}><span style={{ ...S.statNum, color: summary.unmatched_count > 0 ? '#f59e0b' : '#64748b' }}>{summary.unmatched_count}</span><span style={S.statLabel}>Unmatched</span></div>
          <div style={S.statDivider} />
          <div style={S.statItem}><span style={S.statNum}>{fmtMyr(summary.total_amount_myr)}</span><span style={S.statLabel}>Total</span></div>
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>

        {/* Row 1 — View mode: 3 fixed pills + By Statement toggle */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* All */}
          <button
            onClick={() => { setFilter('ALL'); setViewMode('FLAT') }}
            style={{ ...S.chip, flex: 1, textAlign: 'center' as const, ...(filter === 'ALL' && viewMode === 'FLAT' ? S.chipActive : {}) }}
          >
            All
          </button>
          {/* Unmatched */}
          <button
            onClick={() => { setFilter('UNMATCHED'); setViewMode('FLAT') }}
            style={{ ...S.chip, flex: 1, textAlign: 'center' as const, ...(filter === 'UNMATCHED' && viewMode === 'FLAT' ? { backgroundColor: '#f59e0b', color: '#fff', border: '1px solid #f59e0b' } : {}) }}
          >
            ⬜ Unmatched
          </button>
          {/* By Statement */}
          <button
            onClick={() => setViewMode(v => v === 'BY_STATEMENT' ? 'FLAT' : 'BY_STATEMENT')}
            style={{ ...S.chip, flex: 1, textAlign: 'center' as const, ...(viewMode === 'BY_STATEMENT' ? S.chipAlt : {}) }}
          >
            📋 By Statement
          </button>
        </div>

        {/* Row 2 — Type filter (hidden in By Statement view) */}
        {viewMode !== 'BY_STATEMENT' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', flexShrink: 0 }}>TYPE</span>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' as const, paddingBottom: 2 }}>
              {typeOptions.map(opt => {
                const isActive = filter === opt.value && viewMode === 'FLAT'
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setFilter(opt.value); setViewMode('FLAT') }}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '5px 10px',
                      border: isActive ? '1px solid #0f172a' : '1px solid #e2e8f0',
                      borderRadius: 16, cursor: 'pointer', whiteSpace: 'nowrap' as const,
                      backgroundColor: isActive ? '#0f172a' : '#f8fafc',
                      color:           isActive ? '#fff'    : '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    {opt.icon ? `${opt.icon} ${opt.label}` : opt.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Errors ──────────────────────────────────────────────────────── */}
      {loadErr && <div style={S.errorBox}>{loadErr}</div>}

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={S.spinner} />
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {!loading && !loadErr && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💳</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {filter === 'UNMATCHED' ? 'All transactions are matched ✓' : 'No transactions yet'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
            {filter === 'UNMATCHED'
              ? 'Every imported TNG transaction has been linked to a claim item.'
              : 'Import a TNG statement to see your toll and parking transactions here.'}
          </div>
          {filter === 'ALL' && (
            <button onClick={() => router.push('/tng')}
              style={{ fontSize: 13, fontWeight: 700, padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              + Import TNG Statement
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          FLAT VIEW (default — monthly groups)
      ══════════════════════════════════════════════════════════════════ */}
      {!loading && !loadErr && items.length > 0 && viewMode === 'FLAT' && grouped.map(group => (
        <div key={group.month} style={{ marginBottom: 18 }}>
          <div style={S.monthHead}>{group.month}</div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {group.rows.map(txn => (
              <TxnRow
                key={`${txn.source}-${txn.id}`}
                txn={txn}
                showStatementBadge={true}   // show badge in flat view so user knows which statement
                onLinkTap={setLinkTarget}
                onUnlinkTap={handleUnlink}
                busy={actionBusyId === txn.tng_id}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ══════════════════════════════════════════════════════════════════
          BY STATEMENT VIEW — TNG rows grouped under statement headers
      ══════════════════════════════════════════════════════════════════ */}
      {!loading && !loadErr && items.length > 0 && viewMode === 'BY_STATEMENT' && (
        <div>
          {stmtGrouped.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: 13 }}>
              No TNG transactions in this view.
            </div>
          )}
          {stmtGrouped.map(group => {
            const key      = group.upload_batch_id ?? group.label
            const expanded = expandedStmt.has(key)
            const isClaimGroup = group.label === '🧾 Claim Items'
            return (
              <div key={key} style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                {/* Statement group header */}
                <div style={S.stmtHead} onClick={() => toggleStmt(key)}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={S.stmtLabel}>
                        {isClaimGroup ? group.label : `📋 ${group.label}`}
                      </div>
                      <div style={S.stmtMeta}>
                        {group.rows.length} transaction{group.rows.length !== 1 ? 's' : ''}
                        {' · '}
                        {fmtMyr(group.total_amount)}
                        {!isClaimGroup && group.unmatched_count > 0 && (
                          <span style={{ color: '#f59e0b', fontWeight: 700 }}> · {group.unmatched_count} unmatched</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{expanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Rows */}
                {expanded && group.rows.map(txn => (
                  <TxnRow
                    key={`${txn.source}-${txn.id}`}
                    txn={txn}
                    showStatementBadge={false}   // no badge in BY_STATEMENT — header already shows it
                    onLinkTap={setLinkTarget}
                    onUnlinkTap={handleUnlink}
                    busy={actionBusyId === txn.tng_id}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer hint ─────────────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', paddingTop: 8 }}>
          Showing last 6 months · {items.length} record{items.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* ── Link bottom sheet ───────────────────────────────────────────── */}
      {linkTarget && (
        <LinkSheet
          txn={linkTarget}
          onClose={() => setLinkTarget(null)}
          onLinked={() => { setLinkTarget(null); load() }}
        />
      )}
    </div>
  )
}
