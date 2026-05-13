'use client'
// apps/user/app/(app)/personal/page.tsx
// Personal Space dashboard — monthly summary + recent entries.

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Summary = {
  space_id:    string
  month:       number
  year:        number
  expense:     number
  net:         number
  entry_count: number
}

type Entry = {
  id:               string
  entry_date:       string
  category:         string
  description:      string | null
  amount:           number
  is_tax_deductible: boolean
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PersonalDashboard() {
  const now   = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  // Load space id once
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

  // Load summary + recent entries when space or month changes
  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`/api/spaces/${spaceId}/summary?month=${month}&year=${year}`).then(r => r.json()),
      fetch(`/api/ledger?spaceId=${spaceId}&month=${month}&year=${year}&limit=5`).then(r => r.json()),
    ])
      .then(([sum, led]) => {
        setSummary(sum)
        setEntries(led.entries ?? [])
      })
      .catch(() => setError('Failed to load data.'))
      .finally(() => setLoading(false))
  }, [spaceId, month, year])

  const taxDeductibleCount = entries.filter(e => e.is_tax_deductible).length

  return (
    <div style={S.page}>
      {/* Month picker */}
      <div style={S.monthRow}>
        <button onClick={() => { const d = new Date(year, month - 2); setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }} style={S.arrow}>‹</button>
        <span style={S.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button onClick={() => { const d = new Date(year, month); setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }} style={S.arrow}>›</button>
      </div>

      {error && <div style={S.error}>{error}</div>}

      {/* Summary card */}
      <div style={S.card}>
        <div style={S.cardRow}>
          <span style={S.cardLabel}>Total Spent</span>
          <span style={S.cardAmount}>RM {loading ? '—' : (summary?.expense ?? 0).toFixed(2)}</span>
        </div>
        <div style={S.divider} />
        <div style={S.cardRow}>
          <span style={S.cardLabel}>Tax Deductible entries</span>
          <span style={{ ...S.cardAmount, color: '#16a34a', fontSize: 16 }}>{taxDeductibleCount}</span>
        </div>
        <div style={S.cardRow}>
          <span style={S.cardLabel}>Total entries this month</span>
          <span style={{ ...S.cardAmount, fontSize: 16 }}>{loading ? '—' : (summary?.entry_count ?? 0)}</span>
        </div>
      </div>

      {/* Quick action */}
      <Link href="/personal/add" style={S.addBtn}>+ Add Expense</Link>

      {/* Recent entries */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <span style={S.sectionTitle}>Recent</span>
          <Link href="/personal/expenses" style={S.seeAll}>See all →</Link>
        </div>

        {loading && <div style={S.empty}>Loading…</div>}
        {!loading && entries.length === 0 && (
          <div style={S.empty}>No expenses yet this month.<br/>Tap + Add Expense to start.</div>
        )}
        {entries.map(entry => (
          <div key={entry.id} style={S.entryRow}>
            <div style={S.entryLeft}>
              <span style={S.entryCategory}>{entry.category}</span>
              {entry.is_tax_deductible && <span style={S.taxBadge}>Tax ✓</span>}
              <span style={S.entryDate}>{entry.entry_date}</span>
            </div>
            <span style={S.entryAmount}>RM {Number(entry.amount).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:          { display: 'flex', flexDirection: 'column', gap: 14 },
  monthRow:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow:         { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 4px' },
  monthLabel:    { fontSize: 16, fontWeight: 700, color: '#0f172a', minWidth: 100, textAlign: 'center' },
  card:          { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12 },
  cardRow:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel:     { fontSize: 13, color: '#64748b' },
  cardAmount:    { fontSize: 22, fontWeight: 800, color: '#0f172a' },
  divider:       { height: 1, backgroundColor: '#f1f5f9' },
  addBtn:        { display: 'block', textAlign: 'center', backgroundColor: '#0f172a', color: '#ffffff', padding: '14px 0', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' },
  section:       { backgroundColor: '#ffffff', borderRadius: 16, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  seeAll:        { fontSize: 12, color: '#64748b', textDecoration: 'none' },
  entryRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #f8fafc' },
  entryLeft:     { display: 'flex', flexDirection: 'column', gap: 2 },
  entryCategory: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  entryDate:     { fontSize: 11, color: '#94a3b8' },
  entryAmount:   { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  taxBadge:      { fontSize: 10, color: '#16a34a', backgroundColor: '#f0fdf4', borderRadius: 6, padding: '1px 6px', width: 'fit-content' },
  empty:         { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '24px 0', lineHeight: 1.6 },
  error:         { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
