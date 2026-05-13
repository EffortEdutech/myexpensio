'use client'
// apps/user/app/(app)/personal/expenses/page.tsx
// Full list of personal expenses — filterable by month, with edit/delete.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Entry = {
  id:                string
  entry_date:        string
  category:          string
  description:       string | null
  amount:            number
  is_tax_deductible: boolean
  tax_category:      string | null
  payment_method:    string | null
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const PAY_LABEL: Record<string, string> = {
  CASH: 'Cash', CARD: 'Card', ONLINE_BANKING: 'Online', EWALLET: 'e-Wallet', OTHER: 'Other',
}

export default function PersonalExpenses() {
  const router  = useRouter()
  const now     = new Date()
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [entries, setEntries] = useState<Entry[]>([])
  const [total,   setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting,setDeleting]= useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spaces').then(r => r.json()).then(d => {
      const p = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'PERSONAL')
      if (p) setSpaceId(p.id)
    })
  }, [])

  useEffect(() => {
    if (!spaceId) return
    setLoading(true)
    fetch(`/api/ledger?spaceId=${spaceId}&month=${month}&year=${year}&limit=100`)
      .then(r => r.json())
      .then(d => {
        const items = d.entries ?? []
        setEntries(items)
        setTotal(items.reduce((s: number, e: Entry) => s + Number(e.amount), 0))
      })
      .catch(() => setError('Failed to load entries.'))
      .finally(() => setLoading(false))
  }, [spaceId, month, year])

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return
    setDeleting(id)
    await fetch(`/api/ledger/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
    setTotal(prev => prev - Number(entries.find(e => e.id === id)?.amount ?? 0))
    setDeleting(null)
  }

  const taxCount = entries.filter(e => e.is_tax_deductible).length

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => router.back()} style={S.back}>‹</button>
        <h1 style={S.title}>Expenses</h1>
      </div>

      {/* Month picker */}
      <div style={S.monthRow}>
        <button onClick={() => { const d = new Date(year, month - 2); setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }} style={S.arrow}>‹</button>
        <span style={S.monthLabel}>{MONTHS[month - 1]} {year}</span>
        <button onClick={() => { const d = new Date(year, month); setMonth(d.getMonth() + 1); setYear(d.getFullYear()) }} style={S.arrow}>›</button>
      </div>

      {/* Summary strip */}
      <div style={S.strip}>
        <div style={S.stripItem}>
          <span style={S.stripValue}>RM {total.toFixed(2)}</span>
          <span style={S.stripLabel}>Total</span>
        </div>
        <div style={S.stripDivider} />
        <div style={S.stripItem}>
          <span style={S.stripValue}>{entries.length}</span>
          <span style={S.stripLabel}>Entries</span>
        </div>
        <div style={S.stripDivider} />
        <div style={S.stripItem}>
          <span style={{ ...S.stripValue, color: '#16a34a' }}>{taxCount}</span>
          <span style={S.stripLabel}>Tax Deductible</span>
        </div>
      </div>

      {error && <div style={S.error}>{error}</div>}
      {loading && <div style={S.empty}>Loading…</div>}

      {!loading && entries.length === 0 && (
        <div style={S.empty}>No expenses for {MONTHS[month - 1]} {year}.<br/>Tap + Add to record one.</div>
      )}

      {entries.map(entry => (
        <div key={entry.id} style={S.card}>
          <div style={S.cardTop}>
            <div style={S.cardLeft}>
              <span style={S.category}>{entry.category}</span>
              <span style={S.entryDate}>{entry.entry_date}</span>
              {entry.description && <span style={S.desc}>{entry.description}</span>}
              <div style={S.badges}>
                {entry.is_tax_deductible && <span style={S.taxBadge}>Tax ✓</span>}
                {entry.payment_method && <span style={S.payBadge}>{PAY_LABEL[entry.payment_method] ?? entry.payment_method}</span>}
              </div>
            </div>
            <span style={S.amount}>RM {Number(entry.amount).toFixed(2)}</span>
          </div>
          <div style={S.cardActions}>
            <button style={S.deleteBtn} disabled={deleting === entry.id}
              onClick={() => handleDelete(entry.id)}>
              {deleting === entry.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 12 },
  header:      { display: 'flex', alignItems: 'center', gap: 10 },
  back:        { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 },
  title:       { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  monthRow:    { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 },
  arrow:       { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '0 4px' },
  monthLabel:  { fontSize: 15, fontWeight: 700, color: '#0f172a', minWidth: 100, textAlign: 'center' },
  strip:       { display: 'flex', backgroundColor: '#fff', borderRadius: 12, padding: '14px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  stripItem:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  stripValue:  { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  stripLabel:  { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  stripDivider:{ width: 1, backgroundColor: '#f1f5f9' },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft:    { display: 'flex', flexDirection: 'column', gap: 3 },
  category:    { fontSize: 15, fontWeight: 600, color: '#0f172a' },
  entryDate:   { fontSize: 11, color: '#94a3b8' },
  desc:        { fontSize: 12, color: '#64748b' },
  badges:      { display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 },
  taxBadge:    { fontSize: 10, color: '#16a34a', backgroundColor: '#f0fdf4', borderRadius: 6, padding: '1px 6px' },
  payBadge:    { fontSize: 10, color: '#475569', backgroundColor: '#f1f5f9', borderRadius: 6, padding: '1px 6px' },
  amount:      { fontSize: 16, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' },
  cardActions: { marginTop: 10, display: 'flex', justifyContent: 'flex-end' },
  deleteBtn:   { fontSize: 12, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0' },
  empty:       { textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '32px 0', lineHeight: 1.7 },
  error:       { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
