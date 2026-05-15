'use client'
// apps/user/app/(app)/personal/bills/page.tsx
// Monthly Bills & Commitments — full list UI.
// Month navigation · summary strip · grouped by category · quick-pay tap.

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type Payment = {
  id: string
  status: 'PENDING' | 'PAID' | 'PARTIAL' | 'MISSED' | 'SKIPPED'
  paid_date:   string | null
  paid_amount: number | null
  notes:       string | null
}

type Commitment = {
  id:              string
  name:            string
  amount:          number
  category:        string
  due_day:         number
  start_date:      string
  end_date:        string | null
  is_active:       boolean
  current_payment: Payment | null
}

// ── Category metadata ─────────────────────────────────────────────────────────

const CAT: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  LOAN:         { icon: '🚗', color: '#1d4ed8', bg: '#dbeafe', label: 'Loan'         },
  MORTGAGE:     { icon: '🏠', color: '#065f46', bg: '#d1fae5', label: 'Mortgage'     },
  RENTAL:       { icon: '🔑', color: '#92400e', bg: '#fef3c7', label: 'Rental'       },
  UTILITIES:    { icon: '💡', color: '#b45309', bg: '#fef9c3', label: 'Utilities'    },
  INSURANCE:    { icon: '🛡️', color: '#5b21b6', bg: '#ede9fe', label: 'Insurance'   },
  SUBSCRIPTION: { icon: '📺', color: '#0369a1', bg: '#e0f2fe', label: 'Subscription' },
  EDUCATION:    { icon: '📚', color: '#166534', bg: '#dcfce7', label: 'Education'    },
  OTHER:        { icon: '📋', color: '#475569', bg: '#f1f5f9', label: 'Other'        },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Effective status helper ───────────────────────────────────────────────────

type EffStatus = 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'PAID' | 'PARTIAL' | 'MISSED' | 'SKIPPED'

function effectiveStatus(c: Commitment, year: number, month: number): EffStatus {
  const p = c.current_payment
  if (p && p.status !== 'PENDING') return p.status as EffStatus

  const today     = new Date()
  const tYear     = today.getFullYear()
  const tMonth    = today.getMonth() + 1
  const tDay      = today.getDate()

  if (year < tYear || (year === tYear && month < tMonth)) return 'MISSED'
  if (year > tYear || (year === tYear && month > tMonth)) return 'UPCOMING'
  if (tDay > c.due_day)  return 'OVERDUE'
  if (tDay === c.due_day) return 'DUE_TODAY'
  return 'UPCOMING'
}

const STATUS_STYLE: Record<EffStatus, { label: string; color: string; bg: string; border: string }> = {
  PAID:      { label: '✓ Paid',    color: '#166534', bg: '#dcfce7', border: '#86efac' },
  PARTIAL:   { label: '½ Partial', color: '#92400e', bg: '#fef3c7', border: '#fde68a' },
  UPCOMING:  { label: 'Upcoming',  color: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
  DUE_TODAY: { label: 'Due Today', color: '#92400e', bg: '#fff7ed', border: '#fed7aa' },
  OVERDUE:   { label: 'Overdue',   color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  MISSED:    { label: '✗ Missed',  color: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  SKIPPED:   { label: '— Skip',   color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
}

function fmt(n: number) {
  return 'RM ' + n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ordinal(n: number) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

// ── Quick-pay inline panel ────────────────────────────────────────────────────

function QuickPayPanel({
  commitment, year, month, onDone, onClose,
}: {
  commitment: Commitment; year: number; month: number
  onDone: () => void; onClose: () => void
}) {
  const [amount, setAmount]   = useState(String(commitment.amount))
  const [notes, setNotes]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function markPaid() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/commitments/${commitment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year, month,
          status: Number(amount) >= commitment.amount ? 'PAID' : 'PARTIAL',
          paid_amount: Number(amount),
          notes: notes.trim() || null,
        }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error?.message ?? 'Failed') }
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  async function markMissed() {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/commitments/${commitment.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month, status: 'MISSED', notes: notes.trim() || null }),
      })
      if (!res.ok) throw new Error('Failed')
      onDone()
    } catch { setError('Failed to save') }
    finally  { setLoading(false) }
  }

  return (
    <div style={QS.panel} onClick={(e) => e.stopPropagation()}>
      <div style={QS.row}>
        <span style={QS.label}>Amount paid</span>
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
          style={QS.input} min="0" step="0.01" />
      </div>
      <div style={QS.row}>
        <span style={QS.label}>Notes (optional)</span>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Ref no, remarks…" style={QS.input} />
      </div>
      {error && <p style={{ color: '#dc2626', fontSize: 11, margin: '4px 0' }}>{error}</p>}
      <div style={QS.btns}>
        <button onClick={onClose}     style={QS.btnGhost}  disabled={loading}>Cancel</button>
        <button onClick={markMissed}  style={QS.btnMissed} disabled={loading}>Mark Missed</button>
        <button onClick={markPaid}    style={QS.btnPay}    disabled={loading}>
          {loading ? '…' : '✓ Mark Paid'}
        </button>
      </div>
    </div>
  )
}

const QS: Record<string, React.CSSProperties> = {
  panel:    { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginTop: 6 },
  row:      { display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 },
  label:    { fontSize: 10, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:    { padding: '7px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 13, color: '#0f172a', outline: 'none' },
  btns:     { display: 'flex', gap: 6 },
  btnGhost: { flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, color: '#64748b', cursor: 'pointer' },
  btnMissed:{ flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', fontSize: 12, color: '#dc2626', cursor: 'pointer', fontWeight: 600 },
  btnPay:   { flex: 1.5, padding: '8px 0', borderRadius: 8, border: 'none', background: '#4f46e5', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 700 },
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BillsPage() {
  const router = useRouter()

  const today   = new Date()
  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)

  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading]         = useState(true)
  const [openPay, setOpenPay]         = useState<string | null>(null) // commitment id

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/commitments?year=${year}&month=${month}`)
      if (!res.ok) throw new Error()
      const j = await res.json()
      setCommitments(j.commitments ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [year, month])

  useEffect(() => { load() }, [load])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }
  const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1)

  // Compute summary
  const total   = commitments.reduce((s, c) => s + c.amount, 0)
  const paid    = commitments.reduce((s, c) => {
    const p = c.current_payment
    if (!p) return s
    if (p.status === 'PAID')    return s + (p.paid_amount ?? c.amount)
    if (p.status === 'PARTIAL') return s + (p.paid_amount ?? 0)
    return s
  }, 0)
  const missed  = commitments.filter(c => {
    const es = effectiveStatus(c, year, month)
    return es === 'MISSED' || es === 'OVERDUE'
  }).length
  const remaining = Math.max(0, total - paid)

  // Group by category
  const groups: Record<string, Commitment[]> = {}
  for (const c of commitments) {
    if (!groups[c.category]) groups[c.category] = []
    groups[c.category].push(c)
  }

  return (
    <div style={S.page}>

      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Monthly Bills</h1>
          <p style={S.subtitle}>Recurring commitments</p>
        </div>
        <button onClick={() => router.push('/personal/bills/add')} style={S.addBtn}>
          + Add Bill
        </button>
      </div>

      {/* ── Month navigation ── */}
      <div style={S.monthNav}>
        <button onClick={prevMonth} style={S.arrow}>‹</button>
        <span style={S.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button onClick={nextMonth} style={S.arrow} disabled={isCurrentMonth}>›</button>
      </div>

      {/* ── Summary strip ── */}
      {!loading && commitments.length > 0 && (
        <div style={S.summary}>
          <div style={S.sumCard}>
            <div style={S.sumValue}>{fmt(total)}</div>
            <div style={S.sumLabel}>Total</div>
          </div>
          <div style={{ ...S.sumCard, borderColor: '#86efac' }}>
            <div style={{ ...S.sumValue, color: '#15803d' }}>{fmt(paid)}</div>
            <div style={S.sumLabel}>Paid</div>
          </div>
          <div style={{ ...S.sumCard, borderColor: missed > 0 ? '#fca5a5' : '#e2e8f0' }}>
            <div style={{ ...S.sumValue, color: remaining > 0 ? '#dc2626' : '#94a3b8' }}>{fmt(remaining)}</div>
            <div style={S.sumLabel}>{missed > 0 ? `${missed} missed` : 'Remaining'}</div>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div style={S.empty}>Loading…</div>
      ) : commitments.length === 0 ? (
        <div style={S.emptyState}>
          <div style={S.emptyIcon}>📋</div>
          <p style={S.emptyTitle}>No bills yet</p>
          <p style={S.emptyDesc}>Add your recurring commitments — loans, rental, utilities and more.</p>
          <button onClick={() => router.push('/personal/bills/add')} style={S.emptyBtn}>
            + Add First Bill
          </button>
        </div>
      ) : (
        Object.entries(groups).map(([cat, items]) => {
          const meta = CAT[cat] ?? CAT.OTHER
          return (
            <div key={cat} style={S.group}>
              {/* Category header */}
              <div style={S.catHeader}>
                <span style={{ ...S.catDot, background: meta.color }} />
                <span style={S.catName}>{meta.label.toUpperCase()}</span>
                <span style={S.catTotal}>{fmt(items.reduce((s, c) => s + c.amount, 0))}</span>
              </div>

              {/* Commitment rows */}
              {items.map(c => {
                const es   = effectiveStatus(c, year, month)
                const st   = STATUS_STYLE[es]
                const isOpen = openPay === c.id

                return (
                  <div key={c.id} style={S.itemWrap}>
                    <div style={S.item} onClick={() => router.push(`/personal/bills/${c.id}`)}>
                      {/* Icon */}
                      <div style={{ ...S.catIcon, background: meta.bg }}>
                        <span style={{ fontSize: 20 }}>{meta.icon}</span>
                      </div>

                      {/* Info */}
                      <div style={S.itemInfo}>
                        <div style={S.itemName}>{c.name}</div>
                        <div style={S.itemDue}>Due {ordinal(c.due_day)} · {fmt(c.amount)}</div>
                      </div>

                      {/* Status badge — tap to quick-pay */}
                      <button
                        style={{ ...S.statusBadge, color: st.color, background: st.bg, borderColor: st.border }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (es === 'PAID' || es === 'SKIPPED') {
                            router.push(`/personal/bills/${c.id}`)
                            return
                          }
                          setOpenPay(isOpen ? null : c.id)
                        }}
                      >
                        {st.label}
                      </button>
                    </div>

                    {/* Inline quick-pay panel */}
                    {isOpen && (
                      <QuickPayPanel
                        commitment={c}
                        year={year}
                        month={month}
                        onDone={() => { setOpenPay(null); load() }}
                        onClose={() => setOpenPay(null)}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })
      )}

      <div style={{ height: 24 }} />
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ACCENT = '#4f46e5'

const S: Record<string, React.CSSProperties> = {
  page:    { padding: '20px 16px 100px', maxWidth: 480, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  header:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title:   { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle:{ fontSize: 13, color: '#64748b', margin: '2px 0 0' },
  addBtn:  { padding: '8px 14px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' },

  monthNav:   { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  arrow:      { background: 'none', border: 'none', fontSize: 22, color: ACCENT, cursor: 'pointer', padding: '0 4px', lineHeight: 1, opacity: 1 },
  monthLabel: { fontSize: 15, fontWeight: 700, color: '#0f172a', minWidth: 110, textAlign: 'center' },

  summary:   { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 },
  sumCard:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', textAlign: 'center' },
  sumValue:  { fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 2 },
  sumLabel:  { fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },

  empty:     { textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 14 },
  emptyState:{ textAlign: 'center', padding: '48px 24px' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle:{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' },
  emptyDesc: { fontSize: 13, color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' },
  emptyBtn:  { padding: '12px 24px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' },

  group:     { marginBottom: 20 },
  catHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
  catDot:    { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  catName:   { flex: 1, fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em' },
  catTotal:  { fontSize: 11, fontWeight: 700, color: '#64748b' },

  itemWrap:  { marginBottom: 6 },
  item:      { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px', cursor: 'pointer' },
  catIcon:   { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  itemInfo:  { flex: 1, minWidth: 0 },
  itemName:  { fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  itemDue:   { fontSize: 11, color: '#94a3b8' },
  statusBadge: { padding: '5px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, border: '1px solid', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' },
}
