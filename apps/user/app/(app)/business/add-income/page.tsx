'use client'
// apps/user/app/(app)/business/add-income/page.tsx
// Add an income entry to the BUSINESS space.
// Fields: amount, date, source, category, description (note).
// POSTs to /api/ledger with entry_type=INCOME.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'GRAB',        label: 'Grab payout' },
  { value: 'FOODPANDA',   label: 'FoodPanda payout' },
  { value: 'LALAMOVE',    label: 'Lalamove payout' },
  { value: 'CLIENT',      label: 'Client payment' },
  { value: 'BANK',        label: 'Bank transfer' },
  { value: 'CASH',        label: 'Cash' },
  { value: 'SHOPEE',      label: 'Shopee / Lazada' },
  { value: 'OTHER',       label: 'Other' },
]

const CATEGORIES = [
  { value: 'Ride',        label: 'Ride income' },
  { value: 'Delivery',    label: 'Delivery income' },
  { value: 'Sales',       label: 'Sales' },
  { value: 'Service',     label: 'Service / freelance' },
  { value: 'Commission',  label: 'Commission' },
  { value: 'Others',      label: 'Others' },
]

export default function AddIncomePage() {
  const router = useRouter()
  const today  = new Date().toISOString().slice(0, 10)

  const [spaceId,     setSpaceId]     = useState<string | null>(null)
  const [amount,      setAmount]      = useState('')
  const [date,        setDate]        = useState(today)
  const [source,      setSource]      = useState('GRAB')
  const [category,    setCategory]    = useState('Ride')
  const [description, setDescription] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const biz = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'BUSINESS')
        if (biz) setSpaceId(biz.id)
      })
      .catch(() => setError('Failed to load spaces.'))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!spaceId) { setError('Business space not found.'); return }

    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { setError('Please enter a valid amount greater than 0.'); return }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ledger', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id:    spaceId,
          entry_type:  'INCOME',
          amount:      amt,
          entry_date:  date,
          category,
          income_source: source,
          description: description.trim() || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error?.message ?? 'Failed to save income entry.')
        return
      }

      router.push('/business/income')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <button onClick={() => router.back()} style={S.backBtn}>‹ Back</button>
        <h1 style={S.title}>Add Income</h1>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} style={S.form}>

        {/* Amount */}
        <div style={S.field}>
          <label style={S.label}>Amount (RM) *</label>
          <div style={S.amountRow}>
            <span style={S.currencyPrefix}>RM</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={S.amountInput}
              required
            />
          </div>
        </div>

        {/* Date */}
        <div style={S.field}>
          <label style={S.label}>Date *</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={S.input}
            required
          />
        </div>

        {/* Source */}
        <div style={S.field}>
          <label style={S.label}>Income Source *</label>
          <select value={source} onChange={e => setSource(e.target.value)} style={S.input}>
            {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Category */}
        <div style={S.field}>
          <label style={S.label}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={S.input}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Note */}
        <div style={S.field}>
          <label style={S.label}>Note (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Weekly Grab payout, client invoice #42"
            style={S.textarea}
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading} style={S.submitBtn}>
          {loading ? 'Saving…' : '✓ Save Income'}
        </button>
      </form>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:          { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 },
  header:        { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn:       { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#475569', padding: 0 },
  title:         { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  errorBox:      { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
  form:          { display: 'flex', flexDirection: 'column', gap: 16 },
  field:         { display: 'flex', flexDirection: 'column', gap: 6 },
  label:         { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:         { height: 46, borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 15, color: '#0f172a', backgroundColor: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
  amountRow:     { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  currencyPrefix:{ padding: '0 12px', fontSize: 15, fontWeight: 700, color: '#64748b', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', height: 46, display: 'flex', alignItems: 'center' },
  amountInput:   { flex: 1, height: 46, border: 'none', padding: '0 14px', fontSize: 22, fontWeight: 700, color: '#0f172a', outline: 'none', backgroundColor: 'transparent' },
  textarea:      { borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '12px 14px', fontSize: 14, color: '#0f172a', resize: 'none', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  submitBtn:     { height: 52, borderRadius: 14, border: 'none', backgroundColor: '#16a34a', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
}
