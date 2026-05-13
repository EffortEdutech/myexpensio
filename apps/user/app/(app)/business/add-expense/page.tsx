'use client'
// apps/user/app/(app)/business/add-expense/page.tsx
// Add a business expense entry to the BUSINESS space.
// Business-appropriate categories (vehicle, operations).
// All business expenses are tax-deductible by default.

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
  { group: 'Transport & Vehicle', items: ['Fuel', 'Toll', 'Parking', 'Car service / maintenance', 'Car insurance', 'Road tax'] },
  { group: 'Business Operations', items: ['Phone bill', 'Internet / broadband', 'Software subscriptions', 'Equipment', 'Marketing & advertising', 'Professional fees'] },
  { group: 'Other', items: ['Meals (business)', 'Entertainment', 'Others'] },
]

const ALL_CATEGORIES = CATEGORIES.flatMap(g => g.items)

const PAYMENT_METHODS = [
  { value: 'CASH',           label: 'Cash' },
  { value: 'CARD',           label: 'Debit / Credit card' },
  { value: 'ONLINE_BANKING', label: 'Online banking' },
  { value: 'EWALLET',        label: 'E-wallet (Touch "n" Go, GrabPay…)' },
  { value: 'OTHER',          label: 'Other' },
]

// Non-deductible categories (entertainment / meals above threshold)
const NON_DEDUCTIBLE_DEFAULTS = new Set(['Meals (business)', 'Entertainment'])

export default function AddBusinessExpensePage() {
  const router = useRouter()
  const today  = new Date().toISOString().slice(0, 10)

  const [spaceId,       setSpaceId]       = useState<string | null>(null)
  const [amount,        setAmount]        = useState('')
  const [date,          setDate]          = useState(today)
  const [category,      setCategory]      = useState('Fuel')
  const [description,   setDescription]   = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [isTaxDeductible, setTaxDeductible] = useState(true)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)

  // Auto-set deductibility when category changes
  useEffect(() => {
    setTaxDeductible(!NON_DEDUCTIBLE_DEFAULTS.has(category))
  }, [category])

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
          space_id:         spaceId,
          entry_type:       'EXPENSE',
          amount:           amt,
          entry_date:       date,
          category,
          description:      description.trim() || null,
          payment_method:   paymentMethod,
          is_tax_deductible: isTaxDeductible,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        setError(d.error?.message ?? 'Failed to save expense.')
        return
      }

      router.push('/business/expenses')
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
        <h1 style={S.title}>Add Business Expense</h1>
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

        {/* Category */}
        <div style={S.field}>
          <label style={S.label}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={S.input}>
            {CATEGORIES.map(g => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map(item => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Description */}
        <div style={S.field}>
          <label style={S.label}>Note (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Shell petrol RM 80, monthly Digi bill"
            style={S.textarea}
            rows={2}
          />
        </div>

        {/* Payment method */}
        <div style={S.field}>
          <label style={S.label}>Payment method (optional)</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={S.input}>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <span style={S.hint}>Label only — not tracked as balance</span>
        </div>

        {/* Tax deductible toggle */}
        <div style={S.toggleRow}>
          <div>
            <div style={S.toggleLabel}>Tax deductible</div>
            <div style={S.toggleHint}>
              {isTaxDeductible ? 'This expense will appear in your LHDN tax summary' : 'Excluded from tax summary'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTaxDeductible(v => !v)}
            style={{ ...S.toggle, backgroundColor: isTaxDeductible ? '#16a34a' : '#e2e8f0' }}
          >
            <span style={{ ...S.toggleThumb, transform: isTaxDeductible ? 'translateX(20px)' : 'translateX(2px)' }} />
          </button>
        </div>

        <button type="submit" disabled={loading} style={S.submitBtn}>
          {loading ? 'Saving…' : '✓ Save Expense'}
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
  hint:          { fontSize: 11, color: '#94a3b8' },
  input:         { height: 46, borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '0 14px', fontSize: 15, color: '#0f172a', backgroundColor: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' },
  amountRow:     { display: 'flex', alignItems: 'center', border: '1.5px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' },
  currencyPrefix:{ padding: '0 12px', fontSize: 15, fontWeight: 700, color: '#64748b', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', height: 46, display: 'flex', alignItems: 'center' },
  amountInput:   { flex: 1, height: 46, border: 'none', padding: '0 14px', fontSize: 22, fontWeight: 700, color: '#0f172a', outline: 'none', backgroundColor: 'transparent' },
  textarea:      { borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '12px 14px', fontSize: 14, color: '#0f172a', resize: 'none', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  toggleRow:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: '14px 16px' },
  toggleLabel:   { fontSize: 14, fontWeight: 600, color: '#0f172a', marginBottom: 2 },
  toggleHint:    { fontSize: 11, color: '#64748b' },
  toggle:        { width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background-color 0.2s' },
  toggleThumb:   { position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'transform 0.2s', display: 'block' },
  submitBtn:     { height: 52, borderRadius: 14, border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 },
}
