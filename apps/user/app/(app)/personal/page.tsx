'use client'
// apps/user/app/(app)/personal/page.tsx
//
// Personal Expense Home — yearly statistics.
// Shows a year picker and 3 summary cards:
//   • Total Expenses   — sum of all EXPENSE ledger entries for the year
//   • Bills Paid       — sum of commitment_payments.paid_amount (PAID/PARTIAL) for the year
//   • Tax Deductible   — sum of tax-deductible EXPENSE entries for the year
//
// No action buttons — navigation is via the bottom tab bar.
// Data fetched from /api/spaces/:spaceId/summary?year=YYYY (yearly mode).

import { useEffect, useState } from 'react'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type YearlySummary = {
  expense:              number
  bills_paid_total:     number
  tax_deductible_total: number
  entry_count:          number
}

export default function PersonalHome() {
  const now              = new Date()
  const [year,    setYear]    = useState(now.getFullYear())
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [summary, setSummary] = useState<YearlySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Resolve PERSONAL space id once
  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const personal = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'PERSONAL')
        if (personal) setSpaceId(personal.id)
        else setError('Personal space not found.')
      })
      .catch(() => setError('Failed to load spaces.'))
  }, [])

  // Fetch yearly summary whenever spaceId or year changes
  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)

    fetch(`/api/spaces/${spaceId}/summary?year=${year}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error.message ?? 'Failed to load summary.')
        else setSummary(d)
      })
      .catch(() => setError('Failed to load yearly summary.'))
      .finally(() => setLoading(false))
  }, [spaceId, year])

  const prevYear = () => setYear(y => y - 1)
  const nextYear = () => setYear(y => y + 1)
  const isCurrentYear = year === now.getFullYear()

  const fmt = (v: number) => `RM ${v.toFixed(2)}`

  return (
    <div style={S.page}>

      {/* Year picker */}
      <div style={S.yearRow}>
        <button onClick={prevYear} style={S.arrow}>‹</button>
        <span style={S.yearLabel}>{year}</span>
        <button
          onClick={nextYear}
          style={{ ...S.arrow, opacity: isCurrentYear ? 0.3 : 1 }}
          disabled={isCurrentYear}
        >›</button>
      </div>

      {error && <div style={S.error}>{error}</div>}

      {/* Greeting / context */}
      <div style={S.greeting}>
        <div style={S.greetTitle}>Year in Review</div>
        <div style={S.greetSub}>Your personal finance summary for {year}</div>
      </div>

      {/* Stat cards */}
      <div style={S.cards}>

        {/* Expenses */}
        <div style={S.card}>
          <div style={S.cardIcon}>💸</div>
          <div style={S.cardLabel}>Total Expenses</div>
          <div style={S.cardAmount}>
            {loading ? '—' : fmt(summary?.expense ?? 0)}
          </div>
          <div style={S.cardSub}>
            {loading ? '' : `${summary?.entry_count ?? 0} entries`}
          </div>
        </div>

        {/* Bills */}
        <div style={S.card}>
          <div style={S.cardIcon}>📋</div>
          <div style={S.cardLabel}>Bills Paid</div>
          <div style={{ ...S.cardAmount, color: '#0f172a' }}>
            {loading ? '—' : fmt(summary?.bills_paid_total ?? 0)}
          </div>
          <div style={S.cardSub}>monthly commitments</div>
        </div>

        {/* Tax deductible */}
        <div style={{ ...S.card, borderColor: '#bbf7d0' }}>
          <div style={S.cardIcon}>🧾</div>
          <div style={S.cardLabel}>Tax Deductible</div>
          <div style={{ ...S.cardAmount, color: '#15803d' }}>
            {loading ? '—' : fmt(summary?.tax_deductible_total ?? 0)}
          </div>
          <div style={{ ...S.cardSub, color: '#16a34a' }}>LHDN relief eligible</div>
        </div>

      </div>

      {/* Month hint strip */}
      <div style={S.monthStrip}>
        {MONTHS.map((m, i) => {
          const isPast = year < now.getFullYear() || (year === now.getFullYear() && i <= now.getMonth())
          return (
            <div key={m} style={{ ...S.monthDot, backgroundColor: isPast ? '#0f172a' : '#e2e8f0' }}>
              <span style={S.monthDotLabel}>{m.slice(0, 1)}</span>
            </div>
          )
        })}
      </div>
      <div style={S.monthStripLabel}>
        {year === now.getFullYear()
          ? `${now.getMonth() + 1} of 12 months elapsed`
          : year < now.getFullYear()
            ? 'Full year'
            : 'Future year'}
      </div>

      {/* Navigation hint */}
      <div style={S.navHint}>
        Use the tabs below to view Expenses, Bills, and Tax records
      </div>

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 20 },

  yearRow:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 },
  arrow:      { fontSize: 26, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 6px', lineHeight: 1 },
  yearLabel:  { fontSize: 22, fontWeight: 800, color: '#0f172a', minWidth: 70, textAlign: 'center' },

  greeting:   { textAlign: 'center', paddingBottom: 4 },
  greetTitle: { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  greetSub:   { fontSize: 13, color: '#94a3b8', marginTop: 4 },

  cards: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: '18px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  cardIcon:   { fontSize: 22, lineHeight: 1, marginBottom: 2 },
  cardLabel:  { fontSize: 12, color: '#64748b', fontWeight: 500 },
  cardAmount: { fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' },
  cardSub:    { fontSize: 11, color: '#94a3b8' },

  monthStrip: {
    display: 'flex',
    gap: 4,
    justifyContent: 'center',
    marginTop: 4,
  },
  monthDot:  {
    width: 20,
    height: 20,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthDotLabel: { fontSize: 8, color: '#ffffff', fontWeight: 700 },
  monthStripLabel: { textAlign: 'center', fontSize: 11, color: '#94a3b8' },

  navHint: {
    textAlign: 'center',
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 8,
    fontStyle: 'italic',
  },

  error: { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
