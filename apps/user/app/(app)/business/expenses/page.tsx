'use client'
// apps/user/app/(app)/business/expenses/page.tsx
// List business expense entries for the BUSINESS space, filtered by month.

import { useEffect, useState } from 'react'
import Link from 'next/link'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type Entry = {
  id:               string
  entry_date:       string
  category:         string
  description:      string | null
  amount:           number
  is_tax_deductible: boolean
  payment_method:   string | null
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Cash', CARD: 'Card', ONLINE_BANKING: 'Online banking',
  EWALLET: 'E-wallet', OTHER: 'Other',
}

export default function BusinessExpensesPage() {
  const now  = new Date()
  const [month,        setMonth]        = useState(now.getMonth() + 1)
  const [year,         setYear]         = useState(now.getFullYear())
  const [spaceId,      setSpaceId]      = useState<string | null>(null)
  const [entries,      setEntries]      = useState<Entry[]>([])
  const [total,        setTotal]        = useState(0)
  const [deductTotal,  setDeductTotal]  = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const biz = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'BUSINESS')
        if (biz) setSpaceId(biz.id)
        else setError('Business space not found.')
      })
      .catch(() => setError('Failed to load spaces.'))
  }, [])

  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    setError(null)

    fetch(`/api/ledger?spaceId=${spaceId}&month=${month}&year=${year}&type=EXPENSE&limit=100`)
      .then(r => r.json())
      .then(d => {
        const list = (d.entries ?? []) as Entry[]
        setEntries(list)
        setTotal(list.reduce((s, e) => s + Number(e.amount), 0))
        setDeductTotal(list.filter(e => e.is_tax_deductible).reduce((s, e) => s + Number(e.amount), 0))
      })
      .catch(() => setError('Failed to load expense entries.'))
      .finally(() => setLoading(false))
  }, [spaceId, month, year])

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense entry?')) return
    const deleted = entries.find(e => e.id === id)
    await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
    if (deleted) {
      setTotal(prev => prev - Number(deleted.amount))
      if (deleted.is_tax_deductible) setDeductTotal(prev => prev - Number(deleted.amount))
    }
  }

  const prevMonth = () => { const d = new Date(year, month - 2); setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }
  const nextMonth = () => { const d = new Date(year, month);     setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }

  return (
    <div style={S.page}>
      {/* Month navigator */}
      <div style={S.monthRow}>
        <button onClick={prevMonth} style={S.arrow}>‹</button>
        <span style={S.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button onClick={nextMonth} style={S.arrow}>›</button>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      {/* Summary strip */}
      <div style={S.summaryCard}>
        <div>
          <div style={S.summaryLabel}>Total Expenses</div>
          <div style={S.summaryAmount}>RM {total.toFixed(2)}</div>
        </div>
        <div style={S.summaryMid}>
          <div style={S.summaryLabel}>Deductible</div>
          <div style={{ ...S.summaryAmount, fontSize: 16, color: '#16a34a' }}>RM {deductTotal.toFixed(2)}</div>
        </div>
        <div style={S.summaryRight}>
          <div style={S.summaryLabel}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</div>
          <Link href="/business/add-expense" style={S.addBtn}>+ Add</Link>
        </div>
      </div>

      {/* Entry list */}
      <div style={S.listCard}>
        {loading && <div style={S.empty}>Loading…</div>}
        {!loading && entries.length === 0 && (
          <div style={S.empty}>No expenses for {MONTHS[month - 1]} {year}.<br />
            <Link href="/business/add-expense" style={S.emptyLink}>Add your first business expense →</Link>
          </div>
        )}
        {entries.map((entry, i) => (
          <div key={entry.id} style={{ ...S.entryRow, borderTop: i === 0 ? 'none' : '1px solid #f8fafc' }}>
            <div style={S.entryLeft}>
              <div style={S.entryCategory}>{entry.category}</div>
              <div style={S.badgeRow}>
                {entry.is_tax_deductible && <span style={S.taxBadge}>Tax ✓</span>}
                {entry.payment_method && (
                  <span style={S.payBadge}>{PAYMENT_LABELS[entry.payment_method] ?? entry.payment_method}</span>
                )}
              </div>
              {entry.description && <div style={S.entryNote}>{entry.description}</div>}
              <div style={S.entryDate}>{entry.entry_date}</div>
            </div>
            <div style={S.entryRight}>
              <div style={S.entryAmount}>RM {Number(entry.amount).toFixed(2)}</div>
              <button onClick={() => handleDelete(entry.id)} style={S.deleteBtn}>✕</button>
            </div>
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
  errorBox:      { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  summaryCard:   { backgroundColor: '#ffffff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel:  { fontSize: 12, color: '#64748b', marginBottom: 4 },
  summaryAmount: { fontSize: 22, fontWeight: 800, color: '#0f172a' },
  summaryMid:    { textAlign: 'center' },
  summaryRight:  { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  addBtn:        { display: 'inline-block', padding: '8px 16px', borderRadius: 10, backgroundColor: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none' },
  listCard:      { backgroundColor: '#ffffff', borderRadius: 16, padding: '4px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  empty:         { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '32px 0', lineHeight: 1.8 },
  emptyLink:     { color: '#0f172a', fontWeight: 600, textDecoration: 'none' },
  entryRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', gap: 12 },
  entryLeft:     { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  entryCategory: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  badgeRow:      { display: 'flex', gap: 6, flexWrap: 'wrap' },
  taxBadge:      { fontSize: 10, color: '#16a34a', backgroundColor: '#f0fdf4', borderRadius: 6, padding: '2px 7px' },
  payBadge:      { fontSize: 10, color: '#64748b', backgroundColor: '#f8fafc', borderRadius: 6, padding: '2px 7px' },
  entryNote:     { fontSize: 12, color: '#64748b' },
  entryDate:     { fontSize: 11, color: '#94a3b8' },
  entryRight:    { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 },
  entryAmount:   { fontSize: 15, fontWeight: 700, color: '#0f172a' },
  deleteBtn:     { background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 14, padding: 0 },
}
