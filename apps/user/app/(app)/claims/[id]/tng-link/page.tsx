'use client'
// apps/user/app/(app)/claims/[id]/tng-link/page.tsx
//
// Screen: Link TNG Transactions
// Route:  /claims/[id]/tng-link
//
// Flow:
//   1. On load  → GET /api/claims/[id]/tng-suggestions
//   2. Display  → match cards (pre-ticked HIGH_CONFIDENCE + SUGGESTED)
//                 unmatched claim items (warn only)
//                 unmatched TNG rows (offer "Add to claim" or "Ignore")
//   3. On confirm → POST /api/claims/[id]/tng-link with ticked pairs only
//   4. On success → router.push back to claim detail

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter }             from 'next/navigation'
import Link                                 from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchConfidence = 'HIGH_CONFIDENCE' | 'SUGGESTED' | 'POSSIBLE'

type ScoreBreakdown = {
  reason:  string
  points:  number
}

type TngMatch = {
  claim_item_id:       string
  tng_transaction_id:  string
  score:               number
  confidence:          MatchConfidence
  pre_ticked:          boolean
  breakdown:           ScoreBreakdown[]
  claim_item_type:     'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'
  claim_item_date:     string
  claim_item_amount:   number
  claim_item_merchant: string | null
  claim_item_mode:     string | null
  tng_amount:          number
  tng_date:            string
  tng_location:        string
  tng_trans_no:        string | null
}

type UnmatchedClaimItem = {
  id:       string
  type:     'TOLL' | 'PARKING' | 'TAXI' | 'GRAB' | 'TRAIN' | 'BUS'
  date:     string | null
  amount:   number
  merchant: string | null
  mode:     string | null
}

type UnmatchedTngRow = {
  id:       string
  sector:   'TOLL' | 'PARKING' | 'RETAIL'
  date:     string
  amount:   number
  location: string
  trans_no: string | null
}

type AlreadyLinked = {
  id:                 string
  type:               string
  date:               string | null
  amount:             number
  merchant:           string | null
  tng_transaction_id: string
}

type SuggestionsResult = {
  matches:               TngMatch[]
  unmatched_claim_items: UnmatchedClaimItem[]
  unmatched_tng_rows:    UnmatchedTngRow[]
  already_linked:        AlreadyLinked[]
}

type RetailTransportType = 'TRAIN' | 'BUS' | 'TAXI' | 'GRAB'

function inferRetailTransportType(...values: Array<string | null | undefined>): RetailTransportType | null {
  const hay = values.filter(Boolean).join(' ').toLowerCase()
  if (!hay) return null

  if (/\b(mrt|lrt|ktm|erl|monorail|rapid rail|rapidrail|train|tren|rail|station|stesen)\b/.test(hay)) return 'TRAIN'
  if (/\b(bus|bas|rapid bus|rapidbus|go kl|mybas|stage bus|shuttle bus)\b/.test(hay)) return 'BUS'
  if (/\b(grab|mycar|maxim|indrive)\b/.test(hay)) return 'GRAB'
  if (/\b(taxi|teksi|cab)\b/.test(hay)) return 'TAXI'

  return null
}

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtMyr  = (n: number) => 'MYR ' + Number(n).toFixed(2)
const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Confidence badge ──────────────────────────────────────────────────────────

function ConfidenceBadge({ c }: { c: MatchConfidence }) {
  const map: Record<MatchConfidence, { label: string; bg: string; color: string }> = {
    HIGH_CONFIDENCE: { label: '✅ High confidence', bg: '#f0fdf4', color: '#15803d' },
    SUGGESTED:       { label: '🟡 Suggested',        bg: '#fef9c3', color: '#854d0e' },
    POSSIBLE:        { label: '⚪ Possible',          bg: '#f8fafc', color: '#64748b' },
  }
  const { label, bg, color } = map[c]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
      backgroundColor: bg, color, letterSpacing: 0.2,
    }}>
      {label}
    </span>
  )
}

// ── Type icon ─────────────────────────────────────────────────────────────────

const TYPE_ICON: Record<string, string> = { TOLL: '🛣️', PARKING: '🅿️', TAXI: '🚕', GRAB: '🟢', TRAIN: '🚂', BUS: '🚌', RETAIL: '💳' }

// ── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  match, ticked, onToggle,
}: {
  match:    TngMatch
  ticked:   boolean
  onToggle: (id: string) => void
}) {
  const amountPending = match.claim_item_mode === 'TNG' && match.claim_item_amount === 0

  return (
    <button
      onClick={() => onToggle(match.claim_item_id)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 16px', border: 'none', borderRadius: 0,
        borderBottom: '1px solid #f1f5f9',
        backgroundColor: ticked ? '#f8fafc' : '#fff',
        cursor: 'pointer', textAlign: 'left', width: '100%',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
        border: `2px solid ${ticked ? '#0f172a' : '#cbd5e1'}`,
        backgroundColor: ticked ? '#0f172a' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, color: '#fff', fontWeight: 700,
      }}>
        {ticked ? '✓' : ''}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Claim item row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontSize: 13 }}>{TYPE_ICON[match.claim_item_type]}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
            {match.claim_item_type}
          </span>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            {fmtDate(match.claim_item_date)}
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: amountPending ? '#854d0e' : '#0f172a' }}>
            {amountPending ? 'Amount pending' : fmtMyr(match.claim_item_amount)}
          </span>
          {match.claim_item_merchant && (
            <span style={{ fontSize: 11, color: '#64748b' }}>· {match.claim_item_merchant}</span>
          )}
        </div>

        {/* Arrow divider */}
        <div style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 4px', paddingLeft: 2 }}>
          ↕ matches
        </div>

        {/* TNG row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 700 }}>💳 TNG</span>
          <span style={{ fontSize: 11, color: '#64748b' }}>{fmtDate(match.tng_date)}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>{fmtMyr(match.tng_amount)}</span>
          <span style={{ fontSize: 11, color: '#64748b', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.tng_location}
          </span>
          {match.tng_trans_no && (
            <span style={{ fontSize: 10, color: '#94a3b8' }}>#{match.tng_trans_no}</span>
          )}
        </div>

        {/* Confidence + breakdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <ConfidenceBadge c={match.confidence} />
          {match.breakdown.filter(b => b.points > 0).slice(0, 3).map((b, i) => (
            <span key={i} style={{ fontSize: 10, color: '#94a3b8' }}>{b.reason}</span>
          ))}
        </div>

        {/* Amount fill note for TNG-pending */}
        {amountPending && ticked && (
          <div style={{ marginTop: 6, padding: '6px 10px', backgroundColor: '#eff6ff', borderRadius: 8, fontSize: 11, color: '#1d4ed8' }}>
            💡 Confirming this will fill in the amount: <strong>{fmtMyr(match.tng_amount)}</strong>
          </div>
        )}
      </div>
    </button>
  )
}

// ── Unmatched Claim Item Row ──────────────────────────────────────────────────

function UnmatchedItemRow({ item }: { item: UnmatchedClaimItem }) {
  const isManual = item.mode !== 'TNG'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
    }}>
      <span style={{ fontSize: 14 }}>{TYPE_ICON[item.type]}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
          {item.type} · {fmtDate(item.date)}
          {item.amount > 0 && <span style={{ color: '#64748b', fontWeight: 400 }}> · {fmtMyr(item.amount)}</span>}
        </div>
        {item.merchant && (
          <div style={{ fontSize: 11, color: '#64748b' }}>{item.merchant}</div>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        {isManual
          ? <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: '#f1f5f9', color: '#64748b' }}>
              Manual · no TNG ref
            </span>
          : <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: '#fef9c3', color: '#854d0e' }}>
              No match found
            </span>
        }
      </div>
    </div>
  )
}

// ── Unmatched TNG Row ─────────────────────────────────────────────────────────

function UnmatchedTngRow({
  row,
  onAddToClaim,
  adding,
}: {
  row:          UnmatchedTngRow
  onAddToClaim: (row: UnmatchedTngRow) => void
  adding?:      boolean
}) {
  const retailHint = row.sector === 'RETAIL' ? inferRetailTransportType(row.location) : null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
    }}>
      <span style={{ fontSize: 14 }}>{TYPE_ICON[row.sector]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
          {row.sector} · {fmtDate(row.date)} · {fmtMyr(row.amount)}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.location}
          {row.trans_no && <span style={{ color: '#94a3b8' }}> · #{row.trans_no}</span>}
        </div>
        {row.sector === 'RETAIL' && (
          <div style={{ marginTop: 4, fontSize: 10, color: retailHint ? '#0369a1' : '#a16207' }}>
            {retailHint
              ? `Will add as ${retailHint}`
              : 'Transport type needs confirmation'}
          </div>
        )}
      </div>
      <button
        onClick={() => onAddToClaim(row)}
        disabled={adding}
        style={{
          fontSize: 11, fontWeight: 700, padding: '5px 10px',
          border: '1px solid #3b82f6', borderRadius: 8,
          backgroundColor: '#eff6ff', color: '#1d4ed8',
          cursor: adding ? 'not-allowed' : 'pointer', flexShrink: 0, opacity: adding ? 0.6 : 1,
        }}
      >
        {adding ? 'Adding…' : '+ Add to claim'}
      </button>
    </div>
  )
}

// ── Already Linked Row ────────────────────────────────────────────────────────

function AlreadyLinkedRow({ item }: { item: AlreadyLinked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderBottom: '1px solid #f1f5f9',
      backgroundColor: '#f0fdf4',
    }}>
      <span style={{ fontSize: 14 }}>{TYPE_ICON[item.type] ?? '📄'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
          {item.type} · {fmtDate(item.date)}
          <span style={{ fontWeight: 400, color: '#64748b' }}> · {fmtMyr(item.amount)}</span>
        </div>
        {item.merchant && <div style={{ fontSize: 11, color: '#64748b' }}>{item.merchant}</div>}
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, backgroundColor: '#dcfce7', color: '#15803d' }}>
        ✓ Linked
      </span>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHead({ icon, title, count, sub }: {
  icon: string; title: string; count?: number; sub?: string
}) {
  return (
    <div style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
          {title}
          {count !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginLeft: 6 }}>
              ({count})
            </span>
          )}
        </span>
      </div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, paddingLeft: 22 }}>{sub}</div>}
    </div>
  )
}

function RetailTransportPicker({
  row,
  onChoose,
  onClose,
}: {
  row: UnmatchedTngRow
  onChoose: (type: RetailTransportType) => void
  onClose: () => void
}) {
  const options: RetailTransportType[] = ['TRAIN', 'BUS', 'TAXI', 'GRAB']

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 200 }}
      />
      <div style={{
        position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 201,
        backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0',
        padding: 16, boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
          Choose transport type
        </div>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 14 }}>
          This TNG row is RETAIL, so we need to know which transport claim item to create.
          <br />
          <strong>{row.location}</strong> · {fmtMyr(row.amount)}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {options.map(option => (
            <button
              key={option}
              onClick={() => onChoose(option)}
              style={{
                padding: '12px 10px', borderRadius: 10, border: '1px solid #cbd5e1',
                backgroundColor: '#fff', fontSize: 12, fontWeight: 700, color: '#0f172a', cursor: 'pointer',
              }}
            >
              {TYPE_ICON[option]} {option}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 10, width: '100%', padding: '11px 12px',
            borderRadius: 10, border: 'none', backgroundColor: '#f1f5f9',
            color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TngLinkPage() {
  const { id: claim_id } = useParams<{ id: string }>()
  const router = useRouter()

  const [loading,      setLoading]      = useState(true)
  const [loadErr,      setLoadErr]      = useState<string | null>(null)
  const [result,       setResult]       = useState<SuggestionsResult | null>(null)

  // ticked = set of claim_item_ids whose matches are selected
  const [ticked,       setTicked]       = useState<Set<string>>(new Set())

  const [saving,       setSaving]       = useState(false)
  const [saveErr,      setSaveErr]      = useState<string | null>(null)
  const [savedTotal,   setSavedTotal]   = useState<number | null>(null)

  // Adding unmatched TNG rows to claim — tracks which rows are being added
  const [addingTngId,  setAddingTngId]  = useState<string | null>(null)
  const [retailPicker, setRetailPicker] = useState<UnmatchedTngRow | null>(null)

  // ── Load suggestions ────────────────────────────────────────────────────────

  const loadSuggestions = useCallback(async () => {
    setLoading(true); setLoadErr(null)
    try {
      const res  = await fetch(`/api/claims/${claim_id}/tng-suggestions`)
      const json = await res.json()
      if (!res.ok) { setLoadErr(json.error?.message ?? 'Failed to load suggestions.'); return }

      const data: SuggestionsResult = {
        matches:               json.matches               ?? [],
        unmatched_claim_items: json.unmatched_claim_items ?? [],
        unmatched_tng_rows:    json.unmatched_tng_rows    ?? [],
        already_linked:        json.already_linked        ?? [],
      }
      setResult(data)

      // Pre-tick all matches where pre_ticked = true (HIGH_CONFIDENCE + SUGGESTED)
      const initialTicked = new Set(
        data.matches
          .filter(m => m.pre_ticked)
          .map(m => m.claim_item_id)
      )
      setTicked(initialTicked)
    } catch {
      setLoadErr('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [claim_id])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  // ── Toggle a match ──────────────────────────────────────────────────────────

  function toggleMatch(claim_item_id: string) {
    setTicked(prev => {
      const next = new Set(prev)
      next.has(claim_item_id) ? next.delete(claim_item_id) : next.add(claim_item_id)
      return next
    })
  }

  // ── Confirm links ───────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!result) return
    setSaving(true); setSaveErr(null)

    // Build the links array from ticked claim_item_ids
    const links = result.matches
      .filter(m => ticked.has(m.claim_item_id))
      .map(m => ({
        claim_item_id:      m.claim_item_id,
        tng_transaction_id: m.tng_transaction_id,
      }))

    try {
      const res  = await fetch(`/api/claims/${claim_id}/tng-link`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ links }),
      })
      const json = await res.json()

      if (!res.ok) {
        setSaveErr(json.error?.message ?? 'Failed to save links.')
        setSaving(false)
        return
      }

      setSavedTotal(json.claim_total?.amount ?? null)
      // Short pause so user sees success, then navigate back
      setTimeout(() => router.push(`/claims/${claim_id}`), 1200)
    } catch {
      setSaveErr('Network error. Please try again.')
      setSaving(false)
    }
  }

  // ── Add unmatched TNG row directly to claim ─────────────────────────────────

  async function addRowToClaim(row: UnmatchedTngRow, transportType?: RetailTransportType) {
    setAddingTngId(row.id)
    try {
      const body: {
        type: string
        tng_transaction_id: string
        transport_type?: RetailTransportType
      } = {
        type: row.sector,
        tng_transaction_id: row.id,
      }

      if (row.sector === 'RETAIL' && transportType) {
        body.transport_type = transportType
      }

      const res  = await fetch(`/api/claims/${claim_id}/items`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(json.error?.message ?? 'Failed to add item.')
        return
      }

      setRetailPicker(null)
      await loadSuggestions()
    } catch {
      alert('Network error.')
    } finally {
      setAddingTngId(null)
    }
  }

  async function handleAddToClaim(row: UnmatchedTngRow) {
    if (addingTngId) return

    if (row.sector === 'RETAIL') {
      const guessed = inferRetailTransportType(row.location)
      if (guessed) {
        await addRowToClaim(row, guessed)
        return
      }
      setRetailPicker(row)
      return
    }

    await addRowToClaim(row)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTop: '3px solid #0f172a' }} />
    </div>
  )

  if (loadErr) return (
    <div style={{ padding: 24 }}>
      <div style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>{loadErr}</div>
      <button onClick={loadSuggestions} style={{ ...S.btnSm, backgroundColor: '#f1f5f9', color: '#0f172a' }}>
        Retry
      </button>
    </div>
  )

  if (!result) return null

  const { matches, unmatched_claim_items, unmatched_tng_rows, already_linked } = result
  const tickedCount   = ticked.size
  const hasAnything   = matches.length > 0 || unmatched_claim_items.length > 0
                     || unmatched_tng_rows.length > 0 || already_linked.length > 0

  // Detect "no TNG data at all" — TNG-linkable items exist but zero TNG rows in DB
  const noTngDataYet  = unmatched_claim_items.length > 0
                     && matches.length === 0
                     && unmatched_tng_rows.length === 0

  // Count how many ticked matches will fill in a pending amount
  const pendingAmountFills = matches.filter(
    m => ticked.has(m.claim_item_id) && m.claim_item_mode === 'TNG' && m.claim_item_amount === 0
  ).length

  const confirmBtnLabel = savedTotal !== null
    ? `✓ Saved — redirecting…`
    : saving
      ? 'Saving…'
      : tickedCount === 0
        ? 'No matches selected'
        : `Confirm ${tickedCount} link${tickedCount !== 1 ? 's' : ''}${pendingAmountFills > 0 ? ` · ${pendingAmountFills} amount${pendingAmountFills !== 1 ? 's' : ''} filled` : ''}`

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href={`/claims/${claim_id}`} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}>
          ← Back to claim
        </Link>
      </div>

      <div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>
          💳 Link TNG Transactions
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
          Match your TNG eStatement entries to toll, parking, and transport claim items.
        </p>
      </div>

      {/* ── Gate: No TNG data in DB yet ───────────────────────────────── */}
      {noTngDataYet && (
        <div style={{ padding: '24px 20px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 10, textAlign: 'center' }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e', marginBottom: 6, textAlign: 'center' }}>
            No TNG transactions in library yet
          </div>
          <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, marginBottom: 16, textAlign: 'center' }}>
            You have {unmatched_claim_items.length} TNG-linkable item{unmatched_claim_items.length > 1 ? 's' : ''} to verify.
            <br />
            Import your TNG statement first — rows stay in your library and are reusable across claims.
          </div>
          <Link
            href={`/tng?return=/claims/${claim_id}/tng-link`}
            style={{
              display: 'block', textAlign: 'center',
              padding: '13px 20px', backgroundColor: '#0f172a', color: '#fff',
              borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none',
            }}
          >
            📄 Go to TNG Statements →
          </Link>
          <div style={{ fontSize: 11, color: '#a16207', marginTop: 10, textAlign: 'center' }}>
            After importing, tap &ldquo;Continue → Match&rdquo; to come straight back here.
          </div>
        </div>
      )}

      {/* ── Truly all done (no toll/parking items at all, or all already linked) */}
      {!hasAnything && !noTngDataYet && (
        <div style={{ padding: '24px 16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>All done</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            No TNG-linkable items found, or all are already linked.
          </div>
          <Link href={`/claims/${claim_id}`} style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', textDecoration: 'none' }}>
            ← Back to claim
          </Link>
        </div>
      )}

      {/* Already linked — informational, collapsible feel */}
      {already_linked.length > 0 && (
        <div style={S.card}>
          <SectionHead
            icon="✅" title="Already linked"
            count={already_linked.length}
            sub="These items are already verified against your TNG statement."
          />
          {already_linked.map(item => (
            <AlreadyLinkedRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Suggested matches */}
      {matches.length > 0 && (
        <div style={S.card}>
          <SectionHead
            icon="🔗" title="Suggested matches"
            count={matches.length}
            sub="Pre-ticked matches are high-confidence or suggested. Untick to exclude."
          />

          {/* Select / deselect all */}
          <div style={{ padding: '8px 16px', display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0' }}>
            <button
              onClick={() => setTicked(new Set(matches.map(m => m.claim_item_id)))}
              style={{ ...S.btnSm, backgroundColor: '#0f172a', color: '#fff' }}
            >
              ☑ Select all
            </button>
            <button
              onClick={() => setTicked(new Set())}
              style={{ ...S.btnSm, backgroundColor: '#f1f5f9', color: '#64748b' }}
            >
              ☐ Deselect all
            </button>
          </div>

          {matches.map(match => (
            <MatchCard
              key={match.claim_item_id}
              match={match}
              ticked={ticked.has(match.claim_item_id)}
              onToggle={toggleMatch}
            />
          ))}
        </div>
      )}

      {/* Unmatched claim items */}
      {unmatched_claim_items.length > 0 && (
        <div style={S.card}>
          <SectionHead
            icon="⚠️" title="No TNG match found"
            count={unmatched_claim_items.length}
            sub="These items have no matching TNG transaction. Cash/Visa entries are fine — they will export as manual entries."
          />
          {unmatched_claim_items.map(item => (
            <UnmatchedItemRow key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Unmatched TNG rows */}
      {unmatched_tng_rows.length > 0 && (
        <div style={S.card}>
          <SectionHead
            icon="💳" title="Unmatched TNG transactions"
            count={unmatched_tng_rows.length}
            sub="These are in your TNG statement but have no claim item yet. Add them directly to this claim. Retail rows may ask for a transport type first."
          />
          {unmatched_tng_rows.map(row => (
            <UnmatchedTngRow
              key={row.id}
              row={row}
              adding={addingTngId === row.id}
              onAddToClaim={handleAddToClaim}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {saveErr && (
        <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 13, color: '#dc2626' }}>
          {saveErr}
        </div>
      )}

      {/* Success */}
      {savedTotal !== null && (
        <div style={{ padding: '10px 14px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#15803d' }}>
          ✓ Links saved · New total: {fmtMyr(savedTotal)}
        </div>
      )}

      {/* Confirm button — only show when there are matches to tick */}
      {matches.length > 0 && (
        <button
          onClick={handleConfirm}
          disabled={saving || savedTotal !== null || tickedCount === 0}
          style={{
            ...S.btnConfirm,
            opacity: saving || savedTotal !== null || tickedCount === 0 ? 0.5 : 1,
            cursor:  saving || savedTotal !== null || tickedCount === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {confirmBtnLabel}
        </button>
      )}

      {/* Secondary: import another statement (adds more rows to library) */}
      {!noTngDataYet && savedTotal === null && (
        <div style={{ textAlign: 'center', paddingBottom: 8 }}>
          <Link
            href={`/tng?return=/claims/${claim_id}/tng-link`}
            style={{ fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 600 }}
          >
            📄 Import another TNG statement
          </Link>
        </div>
      )}

      {retailPicker && (
        <RetailTransportPicker
          row={retailPicker}
          onChoose={(type) => { void addRowToClaim(retailPicker, type) }}
          onClose={() => setRetailPicker(null)}
        />
      )}

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex', flexDirection: 'column', gap: 20,
    padding: '20px 16px', maxWidth: 560, margin: '0 auto',
  },
  card: {
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  btnSm: {
    fontSize: 11, fontWeight: 700, padding: '5px 12px',
    border: 'none', borderRadius: 8, cursor: 'pointer',
  },
  btnConfirm: {
    width: '100%', padding: '15px 20px',
    backgroundColor: '#0f172a', color: '#fff',
    border: 'none', borderRadius: 12,
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    letterSpacing: 0.2,
  },
}
