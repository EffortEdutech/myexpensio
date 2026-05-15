'use client'
// apps/user/app/(app)/personal/bills/add/page.tsx
//
// Add a new recurring commitment (bill/loan/subscription).
// POSTs to /api/commitments — space auto-resolved server-side.
//
// Flow:
//   1. Pick category (icon grid) — auto-suggests tax relief for INSURANCE/EDUCATION
//   2. Fill name, amount, due day, start date
//   3. Optional: tax relief toggle + LHDN category, end date, notes
//   4. Submit → POST /api/commitments → redirect to /personal/bills

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Category definitions ──────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'LOAN',         icon: '🏦', label: 'Loan',         hint: 'Car, personal, PTPTN'         },
  { value: 'MORTGAGE',     icon: '🏠', label: 'Mortgage',     hint: 'House / property loan'         },
  { value: 'RENTAL',       icon: '🔑', label: 'Rental',       hint: 'House, room, office'           },
  { value: 'UTILITIES',    icon: '⚡', label: 'Utilities',    hint: 'TNB, Syabas, gas, water'       },
  { value: 'INSURANCE',    icon: '🛡️', label: 'Insurance',    hint: 'Life, medical, vehicle'        },
  { value: 'SUBSCRIPTION', icon: '📺', label: 'Subscription', hint: 'Astro, Netflix, Spotify, gym'  },
  { value: 'EDUCATION',    icon: '🎓', label: 'Education',    hint: 'School fees, tuition'          },
  { value: 'OTHER',        icon: '📦', label: 'Other',        hint: 'Anything else'                 },
] as const

type CategoryValue = typeof CATEGORIES[number]['value']

// ── LHDN categories eligible for bills ───────────────────────────────────────
// (subset — lifestyle/books not typically monthly commitments)

const LHDN_BILL_CATS = [
  { value: 'LIFE_INSURANCE_EPF', label: 'Life Insurance / EPF' },
  { value: 'EDUCATION',          label: 'Education Fees' },
  { value: 'MEDICAL',            label: 'Medical Insurance' },
  { value: 'OTHER',              label: 'Other Relief' },
]

// Auto-suggest tax relief + LHDN category when user picks these commitment categories
const TAX_SUGGEST: Partial<Record<CategoryValue, string>> = {
  INSURANCE: 'LIFE_INSURANCE_EPF',
  EDUCATION: 'EDUCATION',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().slice(0, 10)

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddBillPage() {
  const router = useRouter()

  // Step 1 = pick category  |  Step 2 = fill details
  const [step,         setStep]        = useState<1 | 2>(1)
  const [category,     setCategory]    = useState<CategoryValue | null>(null)

  // Form fields
  const [name,         setName]        = useState('')
  const [amount,       setAmount]      = useState('')
  const [dueDay,       setDueDay]      = useState('1')
  const [startDate,    setStartDate]   = useState(todayStr())
  const [endDate,      setEndDate]     = useState('')
  const [notes,        setNotes]       = useState('')

  // Tax relief fields
  const [isTaxRelief,  setIsTaxRelief] = useState(false)
  const [taxCategory,  setTaxCategory] = useState('')

  const [saving,       setSaving]      = useState(false)
  const [error,        setError]       = useState<string | null>(null)

  // ── Step 1: category picker ────────────────────────────────────────────────

  function selectCategory(val: CategoryValue) {
    setCategory(val)
    // Auto-suggest tax relief for applicable categories
    const suggested = TAX_SUGGEST[val]
    if (suggested) {
      setIsTaxRelief(true)
      setTaxCategory(suggested)
    } else {
      setIsTaxRelief(false)
      setTaxCategory('')
    }
    setStep(2)
  }

  // ── Step 2: submit ─────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!category) { setError('Please select a category.'); return }
    if (!name.trim()) { setError('Please enter a name.'); return }

    const amt = Number(amount)
    if (!amount || isNaN(amt) || amt <= 0) { setError('Please enter a valid amount.'); return }

    const day = Number(dueDay)
    if (!dueDay || isNaN(day) || day < 1 || day > 31) { setError('Due day must be between 1 and 31.'); return }

    if (!startDate) { setError('Please select a start date.'); return }

    setSaving(true)

    const res = await fetch('/api/commitments', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          name.trim(),
        amount:        amt,
        category,
        due_day:       day,
        start_date:    startDate,
        end_date:      endDate || undefined,
        notes:         notes.trim() || undefined,
        is_tax_relief: isTaxRelief,
        tax_category:  isTaxRelief ? taxCategory || undefined : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to save. Please try again.')
      setSaving(false)
      return
    }

    router.push('/personal/bills')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedMeta = CATEGORIES.find(c => c.value === category)

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.titleRow}>
        <button
          onClick={() => step === 2 ? setStep(1) : router.back()}
          style={S.back}
          aria-label="Back"
        >
          ‹
        </button>
        <h1 style={S.title}>
          {step === 1 ? 'Choose Category' : `Add ${selectedMeta?.label}`}
        </h1>
      </div>

      {/* Step 1: category grid */}
      {step === 1 && (
        <div style={S.grid}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => selectCategory(cat.value)}
              style={S.catBtn}
            >
              <span style={S.catIcon}>{cat.icon}</span>
              <span style={S.catLabel}>{cat.label}</span>
              <span style={S.catHint}>{cat.hint}</span>
              {TAX_SUGGEST[cat.value] && (
                <span style={S.taxBadge}>Tax relief</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: details form */}
      {step === 2 && (
        <form onSubmit={handleSubmit} style={S.form}>

          {/* Category pill (readonly) */}
          <div style={S.catPill}>
            <span style={{ fontSize: 22 }}>{selectedMeta?.icon}</span>
            <div>
              <div style={S.catPillLabel}>{selectedMeta?.label}</div>
              <div style={S.catPillHint}>{selectedMeta?.hint}</div>
            </div>
            <button type="button" onClick={() => setStep(1)} style={S.changeCat}>
              Change
            </button>
          </div>

          {error && <div style={S.errorBox}>{error}</div>}

          {/* Name */}
          <div style={S.field}>
            <label style={S.label}>Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={
                category === 'LOAN'         ? 'e.g. Proton X50 Loan' :
                category === 'MORTGAGE'     ? 'e.g. Taman Impian Mortgage' :
                category === 'RENTAL'       ? 'e.g. Sewa Rumah Cheras' :
                category === 'UTILITIES'    ? 'e.g. TNB Electric' :
                category === 'INSURANCE'    ? 'e.g. Great Eastern Life' :
                category === 'SUBSCRIPTION' ? 'e.g. Netflix Premium' :
                category === 'EDUCATION'    ? 'e.g. TARC Tuition Fee' :
                                              'e.g. Monthly contribution'
              }
              required
              style={S.input}
              autoFocus
            />
          </div>

          {/* Amount */}
          <div style={S.field}>
            <label style={S.label}>Monthly Amount (RM) *</label>
            <input
              type="number" inputMode="decimal" min="0.01" step="0.01"
              value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="0.00" required style={S.input}
            />
          </div>

          {/* Due Day */}
          <div style={S.field}>
            <label style={S.label}>Due Day *</label>
            <div style={S.dueRow}>
              <span style={S.dueHint}>Every month on day</span>
              <input
                type="number" inputMode="numeric" min="1" max="31"
                value={dueDay} onChange={e => setDueDay(e.target.value)}
                required style={{ ...S.input, ...S.dueInput }}
              />
              <span style={S.dueHint}>(1 – 31)</span>
            </div>
          </div>

          {/* Start Date */}
          <div style={S.field}>
            <label style={S.label}>Start Date *</label>
            <input
              type="date" value={startDate}
              onChange={e => setStartDate(e.target.value)}
              required style={S.input}
            />
          </div>

          {/* ── Tax Relief section ─────────────────────────────────────── */}
          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleTitle}>
                LHDN Tax Relief
                {isTaxRelief && category && TAX_SUGGEST[category] && (
                  <span style={S.autoTag}> auto-detected</span>
                )}
              </div>
              <div style={S.toggleHint}>This bill qualifies for LHDN personal relief</div>
            </div>
            <button
              type="button"
              onClick={() => { setIsTaxRelief(v => !v); if (isTaxRelief) setTaxCategory('') }}
              style={{ ...S.toggle, backgroundColor: isTaxRelief ? '#0f172a' : '#e2e8f0' }}
            >
              <span style={{ ...S.toggleThumb, transform: isTaxRelief ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>

          {isTaxRelief && (
            <div style={S.field}>
              <label style={S.label}>LHDN Relief Category</label>
              <select value={taxCategory} onChange={e => setTaxCategory(e.target.value)} style={S.select}>
                <option value="">— Select category —</option>
                {LHDN_BILL_CATS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <span style={S.fieldHint}>
                When you mark this bill as paid each month, it will be automatically recorded as a tax-deductible expense.
              </span>
            </div>
          )}

          {/* End Date (optional) */}
          <div style={S.field}>
            <label style={S.label}>End Date <span style={S.optional}>(optional)</span></label>
            <input
              type="date" value={endDate} min={startDate}
              onChange={e => setEndDate(e.target.value)}
              style={S.input}
            />
            <span style={S.fieldHint}>Leave blank if ongoing indefinitely</span>
          </div>

          {/* Notes */}
          <div style={S.field}>
            <label style={S.label}>Notes <span style={S.optional}>(optional)</span></label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Account no. 1234-5678, reference number"
              rows={3} style={S.textarea}
            />
          </div>

          {/* Submit */}
          <button
            type="submit" disabled={saving}
            style={{ ...S.submit, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving…' : 'Add Bill'}
          </button>

        </form>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 },

  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  back:     { fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 },
  title:    { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 4 },
  catBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    gap: 4, padding: '16px 14px', backgroundColor: '#fff',
    border: '1px solid #e2e8f0', borderRadius: 14,
    cursor: 'pointer', textAlign: 'left', position: 'relative',
  },
  catIcon:  { fontSize: 28, lineHeight: 1 },
  catLabel: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  catHint:  { fontSize: 11, color: '#94a3b8', lineHeight: 1.3 },
  taxBadge: {
    fontSize: 9, fontWeight: 700, color: '#16a34a',
    backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 4, padding: '1px 5px', marginTop: 2,
  },

  catPill: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 12,
  },
  catPillLabel: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  catPillHint:  { fontSize: 12, color: '#94a3b8' },
  changeCat: {
    marginLeft: 'auto', fontSize: 12, fontWeight: 600,
    color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px',
  },

  form:     { display: 'flex', flexDirection: 'column', gap: 14 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6 },
  label:    { fontSize: 13, fontWeight: 600, color: '#374151' },
  optional: { fontSize: 11, fontWeight: 400, color: '#94a3b8' },

  input: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 15, outline: 'none', backgroundColor: '#fff', color: '#0f172a',
    width: '100%', boxSizing: 'border-box' as const,
  },
  select: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 15, backgroundColor: '#fff', color: '#0f172a',
    appearance: 'auto' as const, width: '100%', boxSizing: 'border-box' as const,
  },

  dueRow:   { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const },
  dueInput: { width: 70, textAlign: 'center' as const, flexShrink: 0 },
  dueHint:  { fontSize: 13, color: '#64748b' },
  fieldHint: { fontSize: 11, color: '#64748b', lineHeight: 1.4 },

  // Tax relief toggle
  toggleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' },
  toggleTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  toggleHint:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  autoTag:     { fontSize: 10, fontWeight: 600, color: '#16a34a', backgroundColor: '#f0fdf4', padding: '1px 6px', borderRadius: 4 },
  toggle:      { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },

  textarea: {
    padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', backgroundColor: '#fff', color: '#0f172a',
    resize: 'vertical' as const, fontFamily: 'inherit',
    width: '100%', boxSizing: 'border-box' as const,
  },

  submit: {
    marginTop: 8, backgroundColor: '#0f172a', color: '#fff',
    padding: '15px 0', borderRadius: 12, fontWeight: 700,
    fontSize: 16, border: 'none', cursor: 'pointer', width: '100%',
  },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
