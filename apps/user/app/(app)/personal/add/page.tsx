'use client'
// apps/user/app/(app)/personal/add/page.tsx
//
// Add a personal expense entry.
// POSTs to /api/ledger with spaceId resolved from /api/spaces.
//
// Commitment categories (Utilities & Bills, Insurance, Education) are intentionally
// excluded — those expenses are auto-created when the user marks a bill as PAID
// in the Bills tab. Users should not enter them manually here.
//
// If is_tax_deductible, user can upload a PDF/image receipt as LHDN evidence.
// The file is uploaded first to /api/upload/expense-receipt, then the returned
// path + signedUrl are saved with the ledger entry.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// ── Categories — one-off personal expenses only ───────────────────────────────
// Monthly commitment categories (Utilities & Bills, Insurance, Education) are
// handled automatically via the Bills tab — no double-entry needed.

const PERSONAL_CATEGORIES = [
  'Groceries',
  'Food & Dining',
  'Shopping',
  'Entertainment',
  'Transport',
  'Medical',
  'Personal Care',
  'Others',
]

const LHDN_CATEGORIES = [
  { value: 'LIFESTYLE',            label: 'Lifestyle Relief' },
  { value: 'MEDICAL',              label: 'Medical (Self / Spouse / Child)' },
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

const MAX_FILE_BYTES = 10 * 1024 * 1024  // 10 MB

// ── Component ─────────────────────────────────────────────────────────────────

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

  // Receipt upload state
  const [receiptFile,      setReceiptFile]      = useState<File | null>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptPreview,   setReceiptPreview]   = useState<string | null>(null)  // object URL for images
  const fileInputRef                            = useRef<HTMLInputElement>(null)

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

  // ── Receipt file picker ────────────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setError('Receipt file too large — maximum 10 MB.')
      return
    }

    setReceiptFile(file)
    setError(null)

    // Show preview for images
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file))
    } else {
      setReceiptPreview(null)  // PDF — show name instead
    }
  }

  function removeReceipt() {
    setReceiptFile(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!spaceId) { setError('Personal space not ready. Please try again.'); return }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) { setError('Please enter a valid amount.'); return }

    setSaving(true)
    setError(null)

    // 1. Upload receipt if provided
    let attachmentPath: string | null = null
    let receiptUrl:     string | null = null

    if (receiptFile) {
      setUploadingReceipt(true)
      const fd = new FormData()
      fd.append('file', receiptFile)

      const upRes  = await fetch('/api/upload/expense-receipt', { method: 'POST', body: fd })
      const upData = await upRes.json()
      setUploadingReceipt(false)

      if (!upRes.ok) {
        setError(upData?.error?.message ?? 'Receipt upload failed. Please try again.')
        setSaving(false)
        return
      }

      attachmentPath = upData.path
      receiptUrl     = upData.signedUrl
    }

    // 2. Create ledger entry
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
        receipt_url:       receiptUrl,
        attachment_path:   attachmentPath,
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

  const isPdf = receiptFile?.type === 'application/pdf'

  return (
    <div style={S.page}>
      <div style={S.titleRow}>
        <button onClick={() => router.back()} style={S.back}>‹</button>
        <h1 style={S.title}>Add Expense</h1>
      </div>

      {/* Info banner — bills handled separately */}
      <div style={S.infoBanner}>
        <span>💡</span>
        <span>Monthly bills (utilities, insurance, education) are tracked under the <strong>Bills</strong> tab — no need to add them here.</span>
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
          <label style={S.label}>Description <span style={S.optional}>(optional)</span></label>
          <input
            type="text" value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. Aeon grocery run" style={S.input}
          />
        </div>

        {/* Payment method */}
        <div style={S.field}>
          <label style={S.label}>Payment Method <span style={S.optional}>(optional)</span></label>
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
            onClick={() => { setIsTaxDeductible(v => !v); if (isTaxDeductible) { setTaxCategory(''); removeReceipt() } }}
            style={{ ...S.toggle, backgroundColor: isTaxDeductible ? '#0f172a' : '#e2e8f0' }}
          >
            <span style={{ ...S.toggleThumb, transform: isTaxDeductible ? 'translateX(20px)' : 'translateX(0)' }} />
          </button>
        </div>

        {/* LHDN fields — shown when tax deductible */}
        {isTaxDeductible && (
          <>
            <div style={S.field}>
              <label style={S.label}>LHDN Relief Category</label>
              <select value={taxCategory} onChange={e => setTaxCategory(e.target.value)} style={S.select}>
                <option value="">— Select category —</option>
                {LHDN_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Receipt upload */}
            <div style={S.field}>
              <label style={S.label}>Receipt / Evidence <span style={S.optional}>(PDF or image, max 10 MB)</span></label>
              <div style={S.taxHint}>Upload your receipt as tax evidence for LHDN claims.</div>

              {!receiptFile ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} style={S.uploadBtn}>
                  <span style={{ fontSize: 20 }}>📎</span>
                  <span>Attach receipt (PDF / photo)</span>
                </button>
              ) : (
                <div style={S.filePreview}>
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Receipt preview" style={S.previewImg} />
                  ) : (
                    <div style={S.pdfRow}>
                      <span style={{ fontSize: 28 }}>📄</span>
                      <span style={S.pdfName}>{receiptFile.name}</span>
                    </div>
                  )}
                  <div style={S.fileActions}>
                    <span style={S.fileSize}>{(receiptFile.size / 1024).toFixed(0)} KB</span>
                    <button type="button" onClick={removeReceipt} style={S.removeBtn}>Remove</button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/heic"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving || uploadingReceipt}
          style={{ ...S.submit, opacity: (saving || uploadingReceipt) ? 0.6 : 1 }}
        >
          {uploadingReceipt ? 'Uploading receipt…' : saving ? 'Saving…' : 'Save Expense'}
        </button>

      </form>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:        { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 },
  titleRow:    { display: 'flex', alignItems: 'center', gap: 10 },
  back:        { fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 },
  title:       { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 },

  infoBanner:  {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 10, padding: '10px 12px',
    fontSize: 12, color: '#1e40af', lineHeight: 1.5,
  },

  form:        { display: 'flex', flexDirection: 'column', gap: 16 },
  field:       { display: 'flex', flexDirection: 'column', gap: 6 },
  label:       { fontSize: 13, fontWeight: 600, color: '#374151' },
  optional:    { fontSize: 11, fontWeight: 400, color: '#94a3b8' },
  taxHint:     { fontSize: 11, color: '#64748b' },

  input:       { padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, outline: 'none', backgroundColor: '#fff', color: '#0f172a' },
  select:      { padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, backgroundColor: '#fff', appearance: 'auto', color: '#0f172a' },

  toggleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' },
  toggleTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  toggleHint:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  toggle:      { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },

  // File upload
  uploadBtn: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '13px 16px', borderRadius: 10,
    border: '1.5px dashed #93c5fd', backgroundColor: '#eff6ff',
    color: '#1d4ed8', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
    justifyContent: 'center',
  },
  filePreview: {
    border: '1px solid #e2e8f0', borderRadius: 10,
    overflow: 'hidden', backgroundColor: '#fff',
  },
  previewImg:  { width: '100%', maxHeight: 200, objectFit: 'cover' as const, display: 'block' },
  pdfRow:      { display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' },
  pdfName:     { fontSize: 13, color: '#0f172a', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  fileActions: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #f1f5f9', backgroundColor: '#f8fafc' },
  fileSize:    { fontSize: 11, color: '#94a3b8' },
  removeBtn:   { fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' },

  submit:      { marginTop: 8, backgroundColor: '#0f172a', color: '#fff', padding: '15px 0', borderRadius: 12, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' },
  error:       { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },
}
