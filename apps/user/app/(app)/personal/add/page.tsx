'use client'
// apps/user/app/(app)/personal/add/page.tsx
// Add a personal expense entry.
// POSTs to /api/ledger with spaceId resolved from /api/spaces.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const PERSONAL_CATEGORIES = [
  'Groceries', 'Food & Dining', 'Shopping', 'Utilities & Bills',
  'Entertainment', 'Transport', 'Medical', 'Education',
  'Insurance', 'Personal Care', 'Others',
]

const LHDN_CATEGORIES = [
  { value: 'LIFESTYLE',            label: 'Lifestyle Relief' },
  { value: 'MEDICAL',              label: 'Medical (Self / Spouse / Child)' },
  { value: 'EDUCATION',            label: 'Education (Self)' },
  { value: 'LIFE_INSURANCE_EPF',   label: 'Life Insurance / EPF' },
  { value: 'BOOKS',                label: 'Books & Learning Materials' },
  { value: 'DISABILITY_EQUIPMENT', label: 'Equipment for Disability' },
  { value: 'OTHER',                label: 'Other Deductible' },
]

const PAYMENT_METHODS = [
  { value: 'CASH',           label: 'Cash' },
  { value: 'CARD',           label: 'Credit / Debit Card' },
  { value: 'ONLINE_BANKING', label: 'Online Banking' },
  { value: 'EWALLET',        label: 'E-wallet (Touch n Go, GrabPay…)' },
  { value: 'OTHER',          label: 'Other' },
]

export default function AddPersonalExpense() {
  const router = useRouter()

  const [spaceId,          setSpaceId]          = useState<string | null>(null)
  const [amount,           setAmount]           = useState('')
  const [date,             setDate]             = useState(new Date().toISOString().slice(0, 10))
  const [category,         setCategory]         = useState(PERSONAL_CATEGORIES[0])
  const [description,      setDescription]      = useState('')
  const [isTaxDeductible,  setIsTaxDeductible]  = useState(false)
  const [taxCategory,      setTaxCategory]      = useState('')
  const [paymentMethod,    setPaymentMethod]    = useState('')
  const [saving,           setSaving]           = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/spaces')
      .then(r => r.json())
      .then(d => {
        const personal = (d.spaces ?? []).find((s: { type: string; id: string }) => s.type === 'PERSONAL')
        if (personal) setSpaceId(personal.id)
      })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!spaceId) { setError('Personal space not ready. Please try again.'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    setSaving(true)
    setError(null)

    const res = await fetch('/api/ledger', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        spaceId,
        entry_type:        'EXPENSE',
        amount:            Number(amount),
        entry_date:        date,
        category,
        description:       description.trim() || null,
        is_tax_deductible: isTaxDeductible,
        tax_category:      isTaxDeductible && taxCategory ? taxCategory : null,
        payment_method:    paymentMethod || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/personal')
  }

  return (
    <div style={S.page}>
      <div style={S.titleRow}>
        <button onClick={() => router.back()} style={S.back}>‹</button>
        <h1 style={S.title}>Add Expense</h1>
      </div>

      {error && <div style={S.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={S.form}>

        {/* Amount */}
        <div style={S.field}>
          <label style={S.label}>Amount (RM) *</label>
          <input
            type="number" inputMode="decimal" min="0.01" step="0.01"
            value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="0.00" required style={S.input}
          />
        </div>

        {/* Date */}
        <div style={S.field}>
          <label style={S.label}>Date *</label>
          <input
            type="date" value={date}
            onChange={e => setDate(e.target.value)}
            required style={S.input}
          />
        </div>

        {/* Category */}
        <div style={S.field}>
          <label style={S.label}>Category *</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={S.select}>
            {PERSONAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Description */}
        <div style={S.field}>
          <label style={S.label}>Description (optional)</label>
          <input
            type="text" value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Aeon grocery run" style={S.input}
          />
        </div>

        {/* Payment method */}
        <div style={S.field}>
          <label style={S.label}>Payment Method (optional)</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={S.select}>
            <option value="">— Select —</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Tax deductible toggle */}
        <div style={S.toggleRow}>
          <div>
            <div style={S.toggleTitle}>Tax Deductible</div>
            <div style={S.toggleHint}>Mark for LHDN personal relief claim</div>
          </div>
          <button
            type="button"
            onClick={() => { setIsTaxDeductible(v => !v); if (isTaxDeductible) setTaxCategory('') }}
            style={{ ...S.toggle, backgroundColor: isTaxDeductible ? '#0f172a' : '#e2e8f0' }}
          >
            <span style={{ ...S.toggleThumb, transform: isTaxDeductible ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>

        {/* LHDN category (shown only when tax deductible) */}
        {isTaxDeductible && (
          <div style={S.field}>
            <label style={S.label}>LHDN Relief Category</label>
            <select value={taxCategory} onChange={e => setTaxCategory(e.target.value)} style={S.select}>
              <option value="">— Select category —</option>
              {LHDN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}

        <button type="submit" disabled={saving} style={{ ...S.submit, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Expense'}
        </button>

      </form>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 16 },
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  back:        { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 },
  title:       { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },
  form:        { display: 'flex', flexDirection: 'column', gap: 16 },
  field:       { display: 'flex', flexDirection: 'column', gap: 6 },
  label:       { fontSize: 13, fontWeight: 600, color: '#374151' },
  input:       { padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, outline: 'none', backgroundColor: '#fff' },
  select:      { padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, backgroundColor: '#fff', appearance: 'auto' },
  toggleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' },
  toggleTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  toggleHint:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  toggle:      { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  submit:      { marginTop: 8, backgroundColor: '#0f172a', color: '#fff', padding: '15px 0', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  error:       { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
