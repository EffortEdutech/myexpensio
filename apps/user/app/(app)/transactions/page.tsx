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
//   - 6-month display window (display filter only — no DB delete)
//   - "Unmatched" shows TNG rows not yet linked to any claim item
//   - Direction A matching: tap unmatched TNG row → bottom sheet → pick claim → pick item → link
//   - Direction B (from Claims page) unchanged
//   - "Import TNG Statement" button → /tng
//
// API:
//   GET  /api/transactions               — unified ledger
//   POST /api/transactions/[tng_id]/link — Direction A link (bottom sheet confirm)
//   GET  /api/claims?status=DRAFT        — for match sheet claim list

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type UnifiedTransaction = {
  id:           string
  source:       'TNG' | 'CLAIM'
  type:         string
  date:         string
  description:  string
  amount:       number
  currency:     'MYR'
  matched:      boolean
  paid_via_tng: boolean
  claim_id:     string | null
  claim_title:  string | null
  tng_id:       string | null
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

type Filter = 'ALL' | 'UNMATCHED' | 'TOLL' | 'PARKING' | 'GRAB' | 'TRAIN' | 'BUS' | 'TAXI' | 'FLIGHT'

// ── Match sheet state ─────────────────────────────────────────────────────────

type MatchStep = 'PICK_CLAIM' | 'PICK_ITEM' | 'LINKING' | 'DONE' | 'ERROR'

type MatchState = {
  tng:         UnifiedTransaction
  step:        MatchStep
  claims:      DraftClaim[]
  claimsLoading: boolean
  selectedClaim: DraftClaim | null
  items:       ClaimItem[]
  itemsLoading: boolean
  errorMsg:    string | null
}

// ── Config ────────────────────────────────────────────────────────────────────

const FILTER_CHIPS: { key: Filter; label: string; icon: string }[] = [
  { key: 'ALL',      label: 'All',     icon: ''   },
  { key: 'UNMATCHED',label: 'Unmatched',icon: '⚡' },
  { key: 'TOLL',     label: 'Toll',    icon: '🛣️' },
  { key: 'PARKING',  label: 'Parking', icon: '🅿️' },
  { key: 'GRAB',     label: 'Grab',    icon: '🟢' },
  { key: 'TRAIN',    label: 'Train',   icon: '🚂' },
  { key: 'BUS',      label: 'Bus',     icon: '🚌' },
  { key: 'TAXI',     label: 'Taxi',    icon: '🚕' },
  { key: 'FLIGHT',   label: 'Flight',  icon: '✈️' },
]

const TYPE_ICONS: Record<string, string> = {
  TOLL:    '🛣️',
  PARKING: '🅿️',
  GRAB:    '🟢',
  TRAIN:   '🚂',
  BUS:     '🚌',
  TAXI:    '🚕',
  FLIGHT:  '✈️',
  RETAIL:  '💳',
  MEAL:    '🍽️',
  LODGING: '🏨',
  MILEAGE: '🚗',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-MY', {
      day: '2-digit', month: 'short', year: 'numeric',
      timeZone: 'Asia/Kuala_Lumpur',
    })
  } catch { return iso }
}

function fmtMyr(n: number): string {
  return `RM ${Number(n).toFixed(2)}`
}

function groupByMonth(items: UnifiedTransaction[]): { month: string; rows: UnifiedTransaction[] }[] {
  const map = new Map<string, UnifiedTransaction[]>()
  for (const item of items) {
    const monthKey = item.date?.slice(0, 7) ?? 'unknown'
    if (!map.has(monthKey)) map.set(monthKey, [])
    map.get(monthKey)!.push(item)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, rows]) => ({
      month: month === 'unknown' ? 'Unknown Date' : (() => {
        try {
          return new Date(month + '-01').toLocaleDateString('en-MY', {
            month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur',
          })
        } catch { return month }
      })(),
      rows,
    }))
}

function claimLabel(c: DraftClaim): string {
  return c.title || (() => {
    try {
      const s = new Date(c.period_start)
      const e = new Date(c.period_end)
      if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
        return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })
      }
      return `${s.toLocaleDateString('en-MY', { month: 'short', timeZone: 'Asia/Kuala_Lumpur' })} – ${e.toLocaleDateString('en-MY', { month: 'short', year: 'numeric', timeZone: 'Asia/Kuala_Lumpur' })}`
    } catch { return 'Untitled Claim' }
  })()
}

// ── Transaction row ───────────────────────────────────────────────────────────

function TxnRow({
  txn,
  onLinkTap,
  onUnlinkTap,
  onOpenClaimLink,
  busy,
}: {
  txn:             UnifiedTransaction
  onLinkTap:       (t: UnifiedTransaction) => void
  onUnlinkTap:     (t: UnifiedTransaction) => void
  onOpenClaimLink: (t: UnifiedTransaction) => void
  busy:            boolean
}) {
  const icon               = TYPE_ICONS[txn.type] ?? '💳'
  const isPendingClaimTng  = txn.source === 'CLAIM' && txn.paid_via_tng && !txn.matched && !!txn.claim_id
  const isUnmatchedTngRow  = txn.source === 'TNG' && !txn.matched
  const isUnmatched        = isUnmatchedTngRow || isPendingClaimTng
  const canUnlink          = txn.source === 'TNG' && txn.matched && !!txn.tng_id

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '11px 14px',
      backgroundColor: isUnmatched ? '#fefce8' : '#fff',
      borderBottom: '1px solid #f1f5f9',
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {txn.description || txn.type}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{fmtDate(txn.date)}</span>
          {txn.source === 'TNG' && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, backgroundColor: '#dbeafe', color: '#1d4ed8' }}>TNG</span>
          )}
          {txn.paid_via_tng && !txn.matched && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, backgroundColor: '#fef9c3', color: '#854d0e' }}>TNG · Link pending</span>
          )}
          {txn.paid_via_tng && txn.matched && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, backgroundColor: '#f0f9ff', color: '#0369a1' }}>via TNG</span>
          )}
          {txn.matched && txn.claim_title && (
            <span style={{ fontSize: 10, color: '#15803d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              ✓ {txn.claim_title}
            </span>
          )}
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{fmtMyr(txn.amount)}</span>
        {isUnmatchedTngRow && (
          <button
            onClick={() => onLinkTap(txn)}
            disabled={busy}
            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', border: 'none', borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer', backgroundColor: '#0f172a', color: '#fff', opacity: busy ? 0.65 : 1 }}
          >
            Link →
          </button>
        )}
        {isPendingClaimTng && (
          <button
            onClick={() => onOpenClaimLink(txn)}
            disabled={busy}
            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', border: 'none', borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer', backgroundColor: '#0f172a', color: '#fff', opacity: busy ? 0.65 : 1 }}
          >
            Link TNG →
          </button>
        )}
        {canUnlink && (
          <button
            onClick={() => onUnlinkTap(txn)}
            disabled={busy}
            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', border: '1px solid #fecaca', borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer', backgroundColor: '#fff', color: '#dc2626', opacity: busy ? 0.65 : 1 }}
          >
            {busy ? 'Unlinking…' : 'Unlink'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Match bottom sheet ────────────────────────────────────────────────────────

function MatchSheet({
  state,
  onSelectClaim,
  onSelectItem,
  onClose,
}: {
  state:         MatchState
  onSelectClaim: (c: DraftClaim) => void
  onSelectItem:  (i: ClaimItem) => void
  onClose:       () => void
}) {
  const pickingRetail = state.tng.type === 'RETAIL'
  const pickItemTitle = pickingRetail ? 'Step 2 — Choose a transport item paid via TNG' : 'Step 2 — Choose a TOLL or PARKING item'
  const emptyText = pickingRetail
    ? 'No unlinked GRAB / TAXI / TRAIN / BUS items marked for TNG were found in this claim.'
    : 'No unlinked TOLL or PARKING items found in this claim.'
  const emptySubText = pickingRetail
    ? 'Add a transport item with “Paid via TNG” first.'
    : 'Add a TOLL or PARKING item to the claim first.'
  const tngDesc = state.tng.description
  const tngAmt  = fmtMyr(state.tng.amount)

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={state.step !== 'LINKING' ? onClose : undefined}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 201,
        backgroundColor: '#fff', borderRadius: '16px 16px 0 0',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' }} />
        </div>

        {/* Header */}
        <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Link TNG Transaction
          </div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            <strong>{tngDesc}</strong> · {tngAmt}
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0 24px' }}>

          {/* ── DONE ─────────────────────────────────────────────── */}
          {state.step === 'DONE' && (
            <div style={{ textAlign: 'center', padding: '24px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
                Linked successfully
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 20 }}>
                The TNG transaction has been matched to the claim item.
              </div>
              <button onClick={onClose} style={{ fontSize: 13, fontWeight: 700, padding: '10px 24px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          )}

          {/* ── ERROR ────────────────────────────────────────────── */}
          {state.step === 'ERROR' && (
            <div style={{ padding: '16px' }}>
              <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626', marginBottom: 16 }}>
                {state.errorMsg ?? 'Something went wrong.'}
              </div>
              <button onClick={onClose} style={{ ...S.btnGhost, width: '100%', textAlign: 'center' }}>Close</button>
            </div>
          )}

          {/* ── LINKING ──────────────────────────────────────────── */}
          {state.step === 'LINKING' && (
            <div style={{ textAlign: 'center', padding: '32px 20px' }}>
              <div style={S.spinner} />
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 10 }}>Linking…</div>
            </div>
          )}

          {/* ── PICK CLAIM ───────────────────────────────────────── */}
          {state.step === 'PICK_CLAIM' && (
            <div>
              <div style={{ padding: '10px 16px 6px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Step 1 — Choose a claim
              </div>
              {state.claimsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}><div style={S.spinner} /></div>
              ) : state.claims.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>No draft claims found. Create a claim first.</div>
                  <Link href="/claims/new" style={{ fontSize: 13, fontWeight: 700, padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', textDecoration: 'none', borderRadius: 10 }}>
                    + New Claim
                  </Link>
                </div>
              ) : (
                state.claims.map(c => (
                  <button key={c.id} onClick={() => onSelectClaim(c)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f8fafc', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left' as const }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{claimLabel(c)}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>DRAFT</div>
                    </div>
                    <span style={{ fontSize: 16, color: '#94a3b8' }}>›</span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* ── PICK ITEM ────────────────────────────────────────── */}
          {state.step === 'PICK_ITEM' && state.selectedClaim && (
            <div>
              <div style={{ padding: '10px 16px 2px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => onSelectClaim({ ...state.selectedClaim!, id: '' })}
                  style={{ fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  ← Back
                </button>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>·</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>{claimLabel(state.selectedClaim)}</span>
              </div>
              <div style={{ padding: '4px 16px 6px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Step 2 — Choose a TOLL or PARKING item
              </div>
              {state.itemsLoading ? (
                <div style={{ textAlign: 'center', padding: '24px' }}><div style={S.spinner} /></div>
              ) : state.items.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>
                  {emptyText}<br />
                  <span style={{ fontSize: 12 }}>{emptySubText}</span>
                </div>
              ) : (
                state.items.map(item => (
                  <button key={item.id} onClick={() => onSelectItem(item)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: 'none', borderBottom: '1px solid #f8fafc', backgroundColor: '#fff', cursor: 'pointer', textAlign: 'left' as const }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                        {TYPE_ICONS[item.type]} {item.merchant ?? item.type}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {fmtDate(item.claim_date)} · {fmtMyr(item.amount || 0)}
                        {item.amount === 0 && <span style={{ color: '#f59e0b' }}> (amount = 0 — will be filled)</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, color: '#94a3b8' }}>›</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Close button for non-terminal steps */}
        {(state.step === 'PICK_CLAIM' || state.step === 'PICK_ITEM') && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={onClose} style={{ ...S.btnGhost, width: '100%', textAlign: 'center' as const }}>Cancel</button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  return <Suspense><TransactionsView /></Suspense>
}

function TransactionsView() {
  const router = useRouter()

  const [items,       setItems]       = useState<UnifiedTransaction[]>([])
  const [summary,     setSummary]     = useState<Summary | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadErr,     setLoadErr]     = useState<string | null>(null)
  const [filter,      setFilter]      = useState<Filter>('ALL')
  const [matchState,  setMatchState]  = useState<MatchState | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [actionErr,    setActionErr]    = useState<string | null>(null)

  const loadTransactions = useCallback(async (f: Filter) => {
    setLoading(true); setLoadErr(null)
    try {
      const res  = await fetch(`/api/transactions?filter=${f}&months=6`)
      const json = await res.json()
      if (!res.ok) { setLoadErr(json.error?.message ?? 'Failed to load.'); return }
      setItems(json.items ?? [])
      setSummary(json.summary ?? null)
    } catch { setLoadErr('Network error.') }
    finally   { setLoading(false) }
  }, [])

  useEffect(() => { loadTransactions(filter) }, [filter, loadTransactions])

  // ── Direction A: tap Link → open sheet ───────────────────────────────────

  async function handleLinkTap(txn: UnifiedTransaction) {
    // Init sheet with PICK_CLAIM step + start loading claims
    const initial: MatchState = {
      tng:           txn,
      step:          'PICK_CLAIM',
      claims:        [],
      claimsLoading: true,
      selectedClaim: null,
      items:         [],
      itemsLoading:  false,
      errorMsg:      null,
    }
    setMatchState(initial)

    // Fetch DRAFT claims
    try {
      const res  = await fetch('/api/claims?status=DRAFT')
      const json = await res.json()
      setMatchState(prev => prev ? {
        ...prev,
        claims:        json.claims ?? json.items ?? [],
        claimsLoading: false,
      } : null)
    } catch {
      setMatchState(prev => prev ? { ...prev, claimsLoading: false, claims: [] } : null)
    }
  }

  function handleOpenClaimLink(txn: UnifiedTransaction) {
    if (!txn.claim_id) return
    router.push(`/claims/${txn.claim_id}/tng-link`)
  }

  async function handleUnlinkTap(txn: UnifiedTransaction) {
    const tng_id = txn.tng_id
    if (!tng_id) return

    const target = txn.claim_title ? ` from “${txn.claim_title}”` : ''
    if (!window.confirm(`Unlink this TNG transaction${target}?`)) return

    setActionErr(null)
    setActionBusyId(tng_id)

    try {
      const res  = await fetch(`/api/transactions/${tng_id}/link`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({} as { error?: { message?: string } }))

      if (!res.ok) {
        setActionErr(json.error?.message ?? 'Failed to unlink.')
        return
      }

      if (matchState?.tng.tng_id === tng_id) {
        setMatchState(null)
      }

      await loadTransactions(filter)
    } catch {
      setActionErr('Network error. Please try again.')
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleSelectClaim(claim: DraftClaim) {
    // If id is empty string it means "go back" was clicked
    if (!claim.id) {
      setMatchState(prev => prev ? { ...prev, step: 'PICK_CLAIM', selectedClaim: null, items: [] } : null)
      return
    }

    setMatchState(prev => prev ? {
      ...prev,
      step:          'PICK_ITEM',
      selectedClaim: claim,
      items:         [],
      itemsLoading:  true,
    } : null)

    const pickingRetail = matchState?.tng.type === 'RETAIL'

    try {
      const typeParam = pickingRetail ? 'GRAB,TAXI,TRAIN,BUS' : 'TOLL,PARKING'
      const res  = await fetch(`/api/claims/${claim.id}/items?type=${typeParam}&unlinked=true`)
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setMatchState(prev => prev ? {
          ...prev,
          step: 'ERROR',
          errorMsg: json.error?.message ?? 'Failed to load claim items.',
          items: [],
          itemsLoading: false,
        } : null)
        return
      }

      const ciItems: ClaimItem[] = (json.items ?? []).filter((i: ClaimItem) => {
        if (pickingRetail) {
          return ['GRAB', 'TAXI', 'TRAIN', 'BUS'].includes(i.type)
            && !i.tng_transaction_id
            && (i.mode === 'TNG' || i.paid_via_tng === true)
        }
        return (i.type === 'TOLL' || i.type === 'PARKING') && !i.tng_transaction_id
      })

      setMatchState(prev => prev ? { ...prev, items: ciItems, itemsLoading: false } : null)
    } catch {
      setMatchState(prev => prev ? {
        ...prev,
        step: 'ERROR',
        errorMsg: 'Network error. Please try again.',
        items: [],
        itemsLoading: false,
      } : null)
    }
  }

  async function handleSelectItem(item: ClaimItem) {
    if (!matchState) return
    const tng_id = matchState.tng.tng_id
    if (!tng_id) return

    setMatchState(prev => prev ? { ...prev, step: 'LINKING' } : null)

    try {
      const res  = await fetch(`/api/transactions/${tng_id}/link`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ claim_item_id: item.id }),
      })
      const json = await res.json()

      if (!res.ok) {
        setMatchState(prev => prev ? {
          ...prev,
          step:     'ERROR',
          errorMsg: json.error?.message ?? 'Linking failed.',
        } : null)
        return
      }

      setMatchState(prev => prev ? { ...prev, step: 'DONE' } : null)
      // Refresh the list after linking
      loadTransactions(filter)

    } catch {
      setMatchState(prev => prev ? {
        ...prev,
        step:     'ERROR',
        errorMsg: 'Network error. Please try again.',
      } : null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const grouped = groupByMonth(items)
  const unmatchedCount = summary?.unmatched_count ?? 0

  return (
    <div style={S.page}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 Transactions</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
            {loading ? 'Loading…' : (
              summary
                ? `${summary.total_count} transactions · ${fmtMyr(summary.total_amount_myr)}${unmatchedCount > 0 ? ` · ⚡ ${unmatchedCount} unmatched` : ''}`
                : 'Last 6 months'
            )}
          </p>
        </div>
        <button
          onClick={() => router.push('/tng')}
          style={{ fontSize: 11, fontWeight: 700, padding: '8px 12px', border: 'none', borderRadius: 8, cursor: 'pointer', flexShrink: 0, backgroundColor: '#0f172a', color: '#fff' }}
        >
          + Import TNG
        </button>
      </div>

      {/* Unmatched alert */}
      {!loading && unmatchedCount > 0 && filter !== 'UNMATCHED' && (
        <button
          onClick={() => setFilter('UNMATCHED')}
          style={{ width: '100%', padding: '10px 14px', backgroundColor: '#fefce8', border: '1px solid #fde047', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{unmatchedCount} unmatched TNG transaction{unmatchedCount !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 11, color: '#92400e' }}>Tap to view and link them to claim items</div>
          </div>
        </button>
      )}

      {/* ── Filter chips ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            style={{
              fontSize: 11, fontWeight: 700, padding: '6px 12px',
              border: 'none', borderRadius: 20, cursor: 'pointer',
              flexShrink: 0,
              backgroundColor: filter === chip.key ? '#0f172a' : '#f1f5f9',
              color:           filter === chip.key ? '#fff' : '#64748b',
            }}
          >
            {chip.icon ? `${chip.icon} ` : ''}{chip.label}
          </button>
        ))}
      </div>

      {/* ── Loading / Error / Empty ──────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}><div style={S.spinner} /></div>
      )}
      {!loading && loadErr && (
        <div style={S.errorBox}>{loadErr}</div>
      )}
      {!loading && !loadErr && actionErr && (
        <div style={S.errorBox}>{actionErr}</div>
      )}
      {!loading && !loadErr && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
            {filter === 'UNMATCHED' ? 'All transactions are matched ✓' : 'No transactions yet'}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 1.6 }}>
            {filter === 'UNMATCHED'
              ? 'Every imported TNG transaction has been linked to a claim item.'
              : 'Import a TNG statement to see your toll and parking transactions here.'
            }
          </div>
          {filter === 'ALL' && (
            <button
              onClick={() => router.push('/tng')}
              style={{ fontSize: 13, fontWeight: 700, padding: '10px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer' }}>
              + Import TNG Statement
            </button>
          )}
        </div>
      )}

      {/* ── Grouped list ────────────────────────────────────────── */}
      {!loading && !loadErr && grouped.map(group => (
        <div key={group.month}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6, paddingLeft: 2 }}>
            {group.month}
          </div>
          <div style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            {group.rows.map((txn, i) => (
              <TxnRow
                key={`${txn.source}-${txn.id}`}
                txn={txn}
                onLinkTap={handleLinkTap}
                onUnlinkTap={handleUnlinkTap}
                busy={actionBusyId === txn.tng_id}
              />
            ))}
          </div>
        </div>
      ))}

      {/* ── Footer hint ─────────────────────────────────────────── */}
      {!loading && items.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', paddingTop: 8 }}>
          Showing last 6 months · {items.length} record{items.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* ── Match sheet (Direction A) ────────────────────────────── */}
      {matchState && (
        <MatchSheet
          state={matchState}
          onSelectClaim={handleSelectClaim}
          onSelectItem={handleSelectItem}
          onClose={() => setMatchState(null)}
        />
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:     { maxWidth: 520, margin: '0 auto', padding: '20px 16px 80px', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', gap: 16 },
  btnGhost: { fontSize: 12, fontWeight: 600, padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', backgroundColor: '#f8fafc', color: '#374151' },
  spinner:  { width: 26, height: 26, border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  errorBox: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#dc2626' },
}
