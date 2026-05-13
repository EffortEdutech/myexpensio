'use client'
// apps/user/app/(app)/business/page.tsx
// Business Space profit dashboard — monthly snapshot + 12-month bar chart.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type MonthBar = { month: number; year: number; income: number; expense: number; net: number }
type Summary  = {
  space_id:      string
  month:         number
  year:          number
  income:        number
  expense:       number
  net:           number
  income_count:  number
  expense_count: number
  entry_count:   number
  monthly:       MonthBar[]
}

export default function BusinessDashboard() {
  const now  = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Resolve BUSINESS spaceId once
  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const biz = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'BUSINESS')
        if (biz) setSpaceId(biz.id)
        else setError('Business space not found. Please contact support.')
      })
      .catch(() => setError('Failed to load spaces.'))
  }, [])

  // Load profit summary when space / month / year changes
  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)

    fetch(`/api/reports/profit-summary?spaceId=${spaceId}&month=${month}&year=${year}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error.message ?? 'Failed to load summary.')
        else setSummary(d)
      })
      .catch(() => setError('Failed to load profit summary.'))
      .finally(() => setLoading(false))
  }, [spaceId, month, year])

  const prevMonth = () => {
    const d = new Date(year, month - 2)
    setMonth(d.getMonth() + 1); setYear(d.getFullYear())
  }
  const nextMonth = () => {
    const d = new Date(year, month)
    setMonth(d.getMonth() + 1); setYear(d.getFullYear())
  }

  // Chart helpers
  const bars      = summary?.monthly ?? []
  const maxAbs    = Math.max(...bars.map(b => Math.max(b.income, b.expense)), 1)
  const isProfit  = (summary?.net ?? 0) >= 0
  const netColor  = isProfit ? '#16a34a' : '#dc2626'

  return (
    <div style={S.page}>
      {/* Month navigator */}
      <div style={S.monthRow}>
        <button onClick={prevMonth} style={S.arrow}>‹</button>
        <span style={S.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button onClick={nextMonth} style={S.arrow}>›</button>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      {/* Net profit hero card */}
      <div style={{ ...S.heroCard, borderColor: netColor + '33' }}>
        <div style={S.heroLabel}>Net Profit</div>
        <div style={{ ...S.heroAmount, color: netColor }}>
          {loading ? '—' : `${isProfit ? '' : '-'}RM ${Math.abs(summary?.net ?? 0).toFixed(2)}`}
        </div>
        <div style={S.heroSub}>
          {MONTHS[month - 1]} {year}
        </div>
      </div>

      {/* Income / Expense strip */}
      <div style={S.strip}>
        <div style={S.stripCard}>
          <div style={S.stripLabel}>Income</div>
          <div style={{ ...S.stripAmount, color: '#16a34a' }}>
            RM {loading ? '—' : (summary?.income ?? 0).toFixed(2)}
          </div>
          <div style={S.stripCount}>{summary?.income_count ?? 0} entries</div>
        </div>
        <div style={S.stripDivider} />
        <div style={S.stripCard}>
          <div style={S.stripLabel}>Expenses</div>
          <div style={{ ...S.stripAmount, color: '#dc2626' }}>
            RM {loading ? '—' : (summary?.expense ?? 0).toFixed(2)}
          </div>
          <div style={S.stripCount}>{summary?.expense_count ?? 0} entries</div>
        </div>
      </div>

      {/* 12-month bar chart */}
      {bars.length > 0 && (
        <div style={S.chartCard}>
          <div style={S.chartTitle}>12-Month Overview</div>
          <div style={S.chartArea}>
            {bars.map((b, i) => {
              const incH   = Math.round((b.income  / maxAbs) * 60)
              const expH   = Math.round((b.expense / maxAbs) * 60)
              const isCur  = b.month === month && b.year === year
              return (
                <div key={i} style={S.barCol}>
                  <div style={S.barPair}>
                    <div style={{ ...S.barIncome,  height: incH || 2, opacity: isCur ? 1 : 0.6 }} />
                    <div style={{ ...S.barExpense, height: expH || 2, opacity: isCur ? 1 : 0.6 }} />
                  </div>
                  <div style={{ ...S.barLabel, fontWeight: isCur ? 700 : 400, color: isCur ? '#0f172a' : '#94a3b8' }}>
                    {MONTHS[b.month - 1].slice(0, 1)}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={S.chartLegend}>
            <span style={S.legendIncome}>■ Income</span>
            <span style={S.legendExpense}>■ Expense</span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={S.actions}>
        <Link href="/business/add-income"  style={{ ...S.actionBtn, backgroundColor: '#f0fdf4', color: '#15803d' }}>
          + Add Income
        </Link>
        <Link href="/business/add-expense" style={{ ...S.actionBtn, backgroundColor: '#fef2f2', color: '#dc2626' }}>
          + Add Expense
        </Link>
      </div>

      {/* Quick links */}
      <div style={S.linksRow}>
        <Link href="/business/income"   style={S.linkBtn}>View Income →</Link>
        <Link href="/business/expenses" style={S.linkBtn}>View Expenses →</Link>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:         { display: 'flex', flexDirection: 'column', gap: 14 },
  monthRow:     { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow:        { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 4px' },
  monthLabel:   { fontSize: 16, fontWeight: 700, color: '#0f172a', minWidth: 100, textAlign: 'center' },
  errorBox:     { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  heroCard:     { backgroundColor: '#ffffff', borderRadius: 20, padding: '28px 20px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '2px solid transparent' },
  heroLabel:    { fontSize: 13, color: '#64748b', marginBottom: 8, fontWeight: 500 },
  heroAmount:   { fontSize: 40, fontWeight: 900, letterSpacing: '-1px' },
  heroSub:      { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  strip:        { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', gap: 0 },
  stripCard:    { flex: 1, textAlign: 'center' },
  stripDivider: { width: 1, backgroundColor: '#f1f5f9', margin: '0 16px' },
  stripLabel:   { fontSize: 12, color: '#64748b', marginBottom: 6 },
  stripAmount:  { fontSize: 20, fontWeight: 800 },
  stripCount:   { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  chartCard:    { backgroundColor: '#ffffff', borderRadius: 16, padding: '16px 16px 12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  chartTitle:   { fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 },
  chartArea:    { display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 },
  barCol:       { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  barPair:      { display: 'flex', gap: 2, alignItems: 'flex-end', height: 60 },
  barIncome:    { width: 7, backgroundColor: '#16a34a', borderRadius: '3px 3px 0 0' },
  barExpense:   { width: 7, backgroundColor: '#dc2626', borderRadius: '3px 3px 0 0' },
  barLabel:     { fontSize: 9, lineHeight: 1 },
  chartLegend:  { display: 'flex', gap: 16, marginTop: 10 },
  legendIncome: { fontSize: 11, color: '#16a34a' },
  legendExpense:{ fontSize: 11, color: '#dc2626' },
  actions:      { display: 'flex', gap: 10 },
  actionBtn:    { flex: 1, display: 'block', textAlign: 'center', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' },
  linksRow:     { display: 'flex', gap: 10 },
  linkBtn:      { flex: 1, display: 'block', textAlign: 'center', padding: '12px 0', borderRadius: 12, backgroundColor: '#f8fafc', color: '#475569', fontWeight: 600, fontSize: 13, textDecoration: 'none' },
}
