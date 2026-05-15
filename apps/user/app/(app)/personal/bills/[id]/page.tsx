'use client'
// apps/user/app/(app)/personal/bills/[id]/page.tsx
//
// Commitment detail page.
//
// Sections:
//   1. Info card   — name, category, amount, due day, dates, active status
//   2. Year nav    — flip through years to see payment history
//   3. 12-month grid — each month shows status; tap → inline pay panel
//   4. Edit form   — toggle to edit name / amount / due day / end date / notes
//   5. Deactivate  — soft-delete (sets is_active = false)

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type Payment = {
  id:              string
  year:            number
  month:           number
  due_date:        string
  expected_amount: number
  status:          'PENDING' | 'PAID' | 'PARTIAL' | 'MISSED' | 'SKIPPED'
  paid_date:       string | null
  paid_amount:     number | null
  notes:           string | null
}

type Commitment = {
  id:                     string
  name:                   string
  amount:                 number
  category:               string
  due_day:                number
  start_date:             string
  end_date:               string | null
  is_active:              boolean
  notes:                  string | null
  is_tax_relief:          boolean
  tax_category:           string | null
  document_url:           string | null
  document_storage_path:  string | null
  commitment_payments:    Payment[]
}

// ── Category meta ─────────────────────────────────────────────────────────────

const CAT: Record<string, { icon: string; color: string; bg: string }> = {
  LOAN:         { icon: '🏦', color: '#1d4ed8', bg: '#eff6ff' },
  MORTGAGE:     { icon: '🏠', color: '#0f766e', bg: '#f0fdfa' },
  RENTAL:       { icon: '🔑', color: '#b45309', bg: '#fffbeb' },
  UTILITIES:    { icon: '⚡', color: '#6d28d9', bg: '#f5f3ff' },
  INSURANCE:    { icon: '🛡️', color: '#0369a1', bg: '#f0f9ff' },
  SUBSCRIPTION: { icon: '📺', color: '#0f172a', bg: '#f8fafc' },
  EDUCATION:    { icon: '🎓', color: '#065f46', bg: '#ecfdf5' },
  OTHER:        { icon: '📦', color: '#64748b', bg: '#f8fafc' },
}

// ── Status display ────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

type EffectiveStatus = 'UPCOMING' | 'DUE_TODAY' | 'OVERDUE' | 'PAID' | 'PARTIAL' | 'MISSED' | 'SKIPPED' | 'PENDING'

const STATUS_STYLE: Record<EffectiveStatus, { label: string; color: string; bg: string; border: string }> = {
  PAID:      { label: 'Paid',      color: '#166534', bg: '#dcfce7', border: '#86efac' },
  PARTIAL:   { label: 'Partial',   color: '#92400e', bg: '#fef3c7', border: '#fcd34d' },
  MISSED:    { label: 'Missed',    color: '#991b1b', bg: '#fee2e2', border: '#fca5a5' },
  SKIPPED:   { label: 'Skipped',   color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  OVERDUE:   { label: 'Overdue',   color: '#991b1b', bg: '#fff1f2', border: '#fda4af' },
  DUE_TODAY: { label: 'Due Today', color: '#7c2d12', bg: '#ffedd5', border: '#fdba74' },
  PENDING:   { label: 'Pending',   color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
  UPCOMING:  { label: 'Upcoming',  color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cap(day: number, year: number, month: number) {
  return Math.min(day, new Date(year, month, 0).getDate())
}

function dueDateStr(dueDay: number, year: number, month: number) {
  const d = cap(dueDay, year, month)
  return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function effectiveStatus(
  payment: Payment | undefined,
  dueDay: number,
  year: number,
  month: number,
): EffectiveStatus {
  if (payment && payment.status !== 'PENDING') return payment.status as EffectiveStatus
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const due = dueDateStr(dueDay, year, month)
  if (due > todayStr) return 'UPCOMING'
  if (due === todayStr) return 'DUE_TODAY'
  return 'OVERDUE'
}

// Is the month within the commitment's active range?
function isMonthActive(c: Commitment, year: number, month: number) {
  const start = c.start_date.slice(0, 7) // YYYY-MM
  const key   = `${year}-${String(month).padStart(2, '0')}`
  if (key < start) return false
  if (c.end_date) {
    const end = c.end_date.slice(0, 7)
    if (key > end) return false
  }
  return true
}

function fmtMYR(n: number) {
  return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  const [y, m, d] = s.split('-')
  return `${d} ${MONTH_NAMES[Number(m) - 1]} ${y}`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommitmentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [commitment,   setCommitment]   = useState<Commitment | null>(null)
  const [loading,      setLoading]      = useState(true)
  const [year,         setYear]         = useState(new Date().getFullYear())

  // Active month panel
  const [activeMonth,  setActiveMonth]  = useState<number | null>(null)
  const [payStatus,    setPayStatus]    = useState<string>('PAID')
  const [payAmount,    setPayAmount]    = useState('')
  const [payNote,      setPayNote]      = useState('')
  const [payDate,      setPayDate]      = useState(new Date().toISOString().slice(0, 10))
  const [markSaving,   setMarkSaving]   = useState(false)
  const [markError,    setMarkError]    = useState<string | null>(null)

  // Edit mode
  const [editing,          setEditing]          = useState(false)
  const [editName,         setEditName]         = useState('')
  const [editAmount,       setEditAmount]       = useState('')
  const [editDueDay,       setEditDueDay]       = useState('')
  const [editEndDate,      setEditEndDate]      = useState('')
  const [editNotes,        setEditNotes]        = useState('')
  const [editIsTaxRelief,  setEditIsTaxRelief]  = useState(false)
  const [editTaxCategory,  setEditTaxCategory]  = useState('')
  const [editSaving,       setEditSaving]       = useState(false)
  const [editError,        setEditError]        = useState<string | null>(null)

  // Document upload
  const [docFile,       setDocFile]       = useState<File | null>(null)
  const [docUploading,  setDocUploading]  = useState(false)
  const [docError,      setDocError]      = useState<string | null>(null)
  const docInputRef                       = useRef<HTMLInputElement>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchCommitment = useCallback(async () => {
    setLoading(true)
    const res  = await fetch(`/api/commitments/${id}`)
    const data = await res.json()
    if (res.ok) {
      setCommitment(data.commitment)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchCommitment() }, [fetchCommitment])

  // ── Build payment map for active year ─────────────────────────────────────

  const paymentMap: Record<number, Payment> = {}
  if (commitment) {
    for (const p of commitment.commitment_payments) {
      if (p.year === year) paymentMap[p.month] = p
    }
  }

  // ── Mark payment ──────────────────────────────────────────────────────────

  function openMonth(month: number) {
    if (activeMonth === month) { setActiveMonth(null); return }
    setActiveMonth(month)
    setMarkError(null)
    const existing = paymentMap[month]
    setPayStatus(existing?.status === 'PAID' || existing?.status === 'PARTIAL'
      ? existing.status : 'PAID')
    setPayAmount(existing?.paid_amount != null ? String(existing.paid_amount) : '')
    setPayDate(existing?.paid_date ?? new Date().toISOString().slice(0, 10))
    setPayNote(existing?.notes ?? '')
  }

  async function handleMarkPay() {
    if (!commitment) return
    setMarkSaving(true)
    setMarkError(null)

    const body: Record<string, unknown> = {
      year,
      month:  activeMonth,
      status: payStatus,
      notes:  payNote.trim() || undefined,
    }
    if (payStatus === 'PAID') {
      body.paid_date   = payDate
      body.paid_amount = commitment.amount
    }
    if (payStatus === 'PARTIAL') {
      body.paid_date   = payDate
      body.paid_amount = payAmount ? Number(payAmount) : undefined
    }

    const res  = await fetch(`/api/commitments/${id}/pay`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    })
    const data = await res.json()

    if (!res.ok) {
      setMarkError(data?.error?.message ?? 'Failed to save.')
      setMarkSaving(false)
      return
    }

    setMarkSaving(false)
    setActiveMonth(null)
    fetchCommitment()
  }

  // ── Edit commitment ────────────────────────────────────────────────────────

  function startEdit() {
    if (!commitment) return
    setEditName(commitment.name)
    setEditAmount(String(commitment.amount))
    setEditDueDay(String(commitment.due_day))
    setEditEndDate(commitment.end_date ?? '')
    setEditNotes(commitment.notes ?? '')
    setEditIsTaxRelief(commitment.is_tax_relief ?? false)
    setEditTaxCategory(commitment.tax_category ?? '')
    setEditError(null)
    setEditing(true)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    setEditError(null)
    setEditSaving(true)

    const res  = await fetch(`/api/commitments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        name:          editName.trim(),
        amount:        Number(editAmount),
        due_day:       Number(editDueDay),
        end_date:      editEndDate || null,
        notes:         editNotes.trim() || null,
        is_tax_relief: editIsTaxRelief,
        tax_category:  editIsTaxRelief ? editTaxCategory || null : null,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setEditError(data?.error?.message ?? 'Failed to update.')
      setEditSaving(false)
      return
    }
    // Reload full commitment (PATCH returns only the row, without joined payments)
    setEditing(false)
    setEditSaving(false)
    fetchCommitment()
  }

  // ── Deactivate ─────────────────────────────────────────────────────────────

  async function handleDeactivate() {
    if (!commitment) return
    const action = commitment.is_active ? 'deactivate' : 'reactivate'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${commitment.name}"?`)) return

    const res = await fetch(`/api/commitments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ is_active: !commitment.is_active }),
    })
    await res.json()
    if (res.ok) fetchCommitment()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        Loading…
      </div>
    )
  }

  if (!commitment) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Commitment not found.</div>
        <button onClick={() => router.push('/personal/bills')} style={S.backLink}>
          ← Back to Bills
        </button>
      </div>
    )
  }

  const catMeta = CAT[commitment.category] ?? CAT.OTHER

  // Stats for this year
  const thisYearPayments = commitment.commitment_payments.filter(p => p.year === year)
  const paidCount   = thisYearPayments.filter(p => p.status === 'PAID' || p.status === 'PARTIAL').length
  const missedCount = thisYearPayments.filter(p => p.status === 'MISSED').length

  return (
    <div style={S.page}>

      {/* Back + title */}
      <div style={S.titleRow}>
        <button onClick={() => router.push('/personal/bills')} style={S.back}>‹</button>
        <h1 style={S.title}>Bill Detail</h1>
        <button onClick={startEdit} style={S.editBtn}>Edit</button>
      </div>

      {/* Info card */}
      {!editing && (
        <div style={{ ...S.infoCard, opacity: commitment.is_active ? 1 : 0.6 }}>
          <div style={S.infoTop}>
            <div style={{ ...S.catCircle, backgroundColor: catMeta.bg }}>
              <span style={{ fontSize: 26 }}>{catMeta.icon}</span>
            </div>
            <div style={S.infoMain}>
              <div style={S.infoName}>{commitment.name}</div>
              <div style={S.infoSub}>{commitment.category}</div>
            </div>
            <div style={S.infoAmount}>
              <div style={S.amountBig}>{fmtMYR(commitment.amount)}</div>
              <div style={S.amountSub}>per month</div>
            </div>
          </div>
          <div style={S.infoGrid}>
            <div style={S.infoGridItem}>
              <span style={S.infoGridLabel}>Due day</span>
              <span style={S.infoGridValue}>Day {commitment.due_day}</span>
            </div>
            <div style={S.infoGridItem}>
              <span style={S.infoGridLabel}>Started</span>
              <span style={S.infoGridValue}>{fmtDate(commitment.start_date)}</span>
            </div>
            <div style={S.infoGridItem}>
              <span style={S.infoGridLabel}>Ends</span>
              <span style={S.infoGridValue}>{commitment.end_date ? fmtDate(commitment.end_date) : 'Ongoing'}</span>
            </div>
            <div style={S.infoGridItem}>
              <span style={S.infoGridLabel}>Status</span>
              <span style={{
                ...S.infoGridValue,
                color: commitment.is_active ? '#166534' : '#64748b',
                fontWeight: 700,
              }}>
                {commitment.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {/* Tax relief badge */}
          {commitment.is_tax_relief && (
            <div style={S.taxReliefRow}>
              <span style={S.taxReliefBadge}>🟢 LHDN Tax Relief</span>
              {commitment.tax_category && (
                <span style={S.taxCatLabel}>
                  {commitment.tax_category === 'LIFE_INSURANCE_EPF' ? 'Life Insurance / EPF' :
                   commitment.tax_category === 'EDUCATION'          ? 'Education Fees' :
                   commitment.tax_category === 'MEDICAL'            ? 'Medical Insurance' :
                   commitment.tax_category}
                </span>
              )}
              <span style={S.taxReliefHint}>Auto-recorded as tax-deductible when paid</span>
            </div>
          )}

          {commitment.notes && (
            <div style={S.notesRow}>
              <span style={{ fontSize: 12 }}>📝</span>
              <span style={S.notesText}>{commitment.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleEdit} style={S.editForm}>
          <div style={S.editHeader}>
            <span style={S.editTitle}>Edit Bill</span>
            <button type="button" onClick={() => setEditing(false)} style={S.cancelBtn}>Cancel</button>
          </div>

          {editError && <div style={S.errorBox}>{editError}</div>}

          <div style={S.field}>
            <label style={S.label}>Name *</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required style={S.input} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Monthly Amount (RM) *</label>
            <input type="number" inputMode="decimal" min="0.01" step="0.01"
              value={editAmount} onChange={e => setEditAmount(e.target.value)} required style={S.input} />
          </div>
          <div style={S.field}>
            <label style={S.label}>Due Day (1–31) *</label>
            <input type="number" inputMode="numeric" min="1" max="31"
              value={editDueDay} onChange={e => setEditDueDay(e.target.value)} required style={{ ...S.input, width: 80 }} />
          </div>
          <div style={S.field}>
            <label style={S.label}>End Date <span style={S.optional}>(optional)</span></label>
            <input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} style={S.input} />
          </div>
          {/* Tax relief toggle */}
          <div style={S.toggleRow}>
            <div>
              <div style={S.toggleTitle}>LHDN Tax Relief</div>
              <div style={S.toggleHint}>Auto-records as tax-deductible when paid</div>
            </div>
            <button type="button"
              onClick={() => { setEditIsTaxRelief(v => !v); if (editIsTaxRelief) setEditTaxCategory('') }}
              style={{ ...S.toggle, backgroundColor: editIsTaxRelief ? '#0f172a' : '#e2e8f0' }}
            >
              <span style={{ ...S.toggleThumb, transform: editIsTaxRelief ? 'translateX(20px)' : 'translateX(0)' }} />
            </button>
          </div>

          {editIsTaxRelief && (
            <div style={S.field}>
              <label style={S.label}>LHDN Relief Category</label>
              <select value={editTaxCategory} onChange={e => setEditTaxCategory(e.target.value)} style={S.selectEdit}>
                <option value="">— Select category —</option>
                <option value="LIFE_INSURANCE_EPF">Life Insurance / EPF</option>
                <option value="EDUCATION">Education Fees</option>
                <option value="MEDICAL">Medical Insurance</option>
                <option value="OTHER">Other Relief</option>
              </select>
            </div>
          )}

          <div style={S.field}>
            <label style={S.label}>Notes <span style={S.optional}>(optional)</span></label>
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
              rows={3} style={S.textarea} />
          </div>

          <button type="submit" disabled={editSaving}
            style={{ ...S.saveBtn, opacity: editSaving ? 0.6 : 1 }}>
            {editSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      )}

      {/* Document upload section */}
      {!editing && <DocumentSection commitment={commitment} id={id} docInputRef={docInputRef} docFile={docFile} setDocFile={setDocFile} docUploading={docUploading} setDocUploading={setDocUploading} docError={docError} setDocError={setDocError} onSaved={fetchCommitment} />}

      {/* Year nav + stats */}
      <div style={S.yearBar}>
        <button onClick={() => setYear(y => y - 1)} style={S.yearArrow}>‹</button>
        <div style={S.yearCenter}>
          <span style={S.yearLabel}>{year}</span>
          <span style={S.yearStats}>{paidCount} paid · {missedCount} missed</span>
        </div>
        <button
          onClick={() => setYear(y => y + 1)}
          disabled={year >= new Date().getFullYear()}
          style={{ ...S.yearArrow, opacity: year >= new Date().getFullYear() ? 0.3 : 1 }}
        >›</button>
      </div>

      {/* 12-month grid */}
      <div style={S.monthGrid}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
          const active   = isMonthActive(commitment, year, month)
          const payment  = paymentMap[month]
          const status   = active ? effectiveStatus(payment, commitment.due_day, year, month) : null
          const st       = status ? STATUS_STYLE[status] : null
          const isOpen   = activeMonth === month
          return (
            <div key={month}>
              <button
                onClick={() => active && openMonth(month)}
                style={{
                  ...S.monthCell,
                  backgroundColor: st?.bg ?? '#f8fafc',
                  border:          `1px solid ${st?.border ?? '#e2e8f0'}`,
                  cursor:          active ? 'pointer' : 'default',
                  opacity:         active ? 1 : 0.35,
                }}
              >
                <span style={S.monthName}>{MONTH_NAMES[month - 1]}</span>
                {status && (
                  <span style={{ ...S.statusDot, backgroundColor: st?.color ?? '#94a3b8' }} />
                )}
                <span style={{ ...S.monthStatus, color: st?.color ?? '#94a3b8' }}>
                  {status ? st?.label : '—'}
                </span>
                {payment?.paid_amount != null && (
                  <span style={S.paidAmt}>
                    {fmtMYR(payment.paid_amount)}
                  </span>
                )}
              </button>

              {/* Inline pay panel */}
              {isOpen && (
                <div style={S.payPanel}>
                  <div style={S.payTitle}>
                    Mark {MONTH_NAMES[month - 1]} {year}
                  </div>

                  {markError && <div style={S.errorBox}>{markError}</div>}

                  {/* Status buttons */}
                  <div style={S.statusRow}>
                    {(['PAID', 'PARTIAL', 'MISSED', 'SKIPPED'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => setPayStatus(s)}
                        style={{
                          ...S.statusChip,
                          backgroundColor: payStatus === s ? STATUS_STYLE[s].bg : '#f8fafc',
                          color:           payStatus === s ? STATUS_STYLE[s].color : '#64748b',
                          border:          `1.5px solid ${payStatus === s ? STATUS_STYLE[s].border : '#e2e8f0'}`,
                          fontWeight:      payStatus === s ? 700 : 500,
                        }}
                      >
                        {STATUS_STYLE[s].label}
                      </button>
                    ))}
                  </div>

                  {/* Partial amount */}
                  {payStatus === 'PARTIAL' && (
                    <div style={S.field}>
                      <label style={S.label}>Amount Paid (RM)</label>
                      <input type="number" inputMode="decimal" min="0.01" step="0.01"
                        value={payAmount} onChange={e => setPayAmount(e.target.value)}
                        placeholder={String(commitment.amount)} style={S.input} />
                    </div>
                  )}

                  {/* Paid date */}
                  {(payStatus === 'PAID' || payStatus === 'PARTIAL') && (
                    <div style={S.field}>
                      <label style={S.label}>Date Paid</label>
                      <input type="date" value={payDate}
                        onChange={e => setPayDate(e.target.value)} style={S.input} />
                    </div>
                  )}

                  {/* Note */}
                  <div style={S.field}>
                    <label style={S.label}>Note <span style={S.optional}>(optional)</span></label>
                    <input type="text" value={payNote}
                      onChange={e => setPayNote(e.target.value)}
                      placeholder="e.g. Receipt ref XYZ" style={S.input} />
                  </div>

                  <div style={S.payActions}>
                    <button onClick={() => setActiveMonth(null)} style={S.cancelBtn}>Cancel</button>
                    <button
                      onClick={handleMarkPay}
                      disabled={markSaving}
                      style={{ ...S.saveBtn, opacity: markSaving ? 0.6 : 1, flex: 1 }}
                    >
                      {markSaving ? 'Saving…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment history list (paid months only) */}
      {thisYearPayments.filter(p => p.status !== 'PENDING').length > 0 && (
        <div style={S.historySection}>
          <div style={S.historyTitle}>Payment Log — {year}</div>
          {thisYearPayments
            .filter(p => p.status !== 'PENDING')
            .sort((a, b) => b.month - a.month)
            .map(p => {
              const st = STATUS_STYLE[p.status as EffectiveStatus]
              return (
                <div key={p.id} style={S.historyRow}>
                  <div style={S.historyLeft}>
                    <span style={S.historyMonth}>{MONTH_NAMES[p.month - 1]} {p.year}</span>
                    {p.notes && <span style={S.historyNote}>{p.notes}</span>}
                  </div>
                  <div style={S.historyRight}>
                    {p.paid_amount != null && (
                      <span style={S.historyAmt}>{fmtMYR(p.paid_amount)}</span>
                    )}
                    <span style={{
                      ...S.historyBadge,
                      color:           st.color,
                      backgroundColor: st.bg,
                      border:          `1px solid ${st.border}`,
                    }}>{st.label}</span>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* Deactivate / Reactivate */}
      <div style={{ marginTop: 8 }}>
        <button
          onClick={handleDeactivate}
          style={{
            ...S.deactivateBtn,
            color:           commitment.is_active ? '#dc2626' : '#16a34a',
            borderColor:     commitment.is_active ? '#fca5a5' : '#86efac',
            backgroundColor: commitment.is_active ? '#fef2f2' : '#f0fdf4',
          }}
        >
          {commitment.is_active ? '🚫 Deactivate this bill' : '✅ Reactivate this bill'}
        </button>
      </div>

    </div>
  )
}

// ── DocumentSection sub-component ────────────────────────────────────────────

type DocSectionProps = {
  commitment:     Commitment
  id:             string
  docInputRef:    React.RefObject<HTMLInputElement | null>
  docFile:        File | null
  setDocFile:     (f: File | null) => void
  docUploading:   boolean
  setDocUploading:(v: boolean) => void
  docError:       string | null
  setDocError:    (e: string | null) => void
  onSaved:        () => void
}

function DocumentSection({ commitment, id, docInputRef, docFile, setDocFile, docUploading, setDocUploading, docError, setDocError, onSaved }: DocSectionProps) {
  async function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) { setDocError('File too large — maximum 20 MB.'); return }
    setDocFile(file)
    setDocError(null)
    await uploadDoc(file)
  }

  async function uploadDoc(file: File) {
    setDocUploading(true)
    setDocError(null)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('commitmentId', id)

    const upRes  = await fetch('/api/upload/bill-document', { method: 'POST', body: fd })
    const upData = await upRes.json()

    if (!upRes.ok) {
      setDocError(upData?.error?.message ?? 'Upload failed.')
      setDocUploading(false)
      setDocFile(null)
      return
    }

    // Save path + url to commitment via PATCH
    const patchRes = await fetch(`/api/commitments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        document_url:          upData.signedUrl,
        document_storage_path: upData.path,
      }),
    })

    setDocUploading(false)
    if (patchRes.ok) { onSaved() }
    else { setDocError('Upload succeeded but failed to save reference.') }
  }

  async function removeDoc() {
    if (!confirm('Remove this document?')) return
    await fetch(`/api/commitments/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ document_url: null, document_storage_path: null }),
    })
    setDocFile(null)
    onSaved()
  }

  const hasDoc = commitment.document_url || commitment.document_storage_path

  return (
    <div style={DS.section}>
      <div style={DS.header}>
        <span style={DS.title}>📂 Document</span>
        <span style={DS.subtitle}>Loan letter, agreement, policy doc</span>
      </div>

      {docError && <div style={DS.errBox}>{docError}</div>}

      {hasDoc ? (
        <div style={DS.docRow}>
          <span style={{ fontSize: 24 }}>📄</span>
          <div style={DS.docInfo}>
            <span style={DS.docName}>
              {commitment.document_storage_path?.split('/').pop() ?? 'Document'}
            </span>
            <div style={DS.docActions}>
              {commitment.document_url && (
                <a href={commitment.document_url} target="_blank" rel="noreferrer" style={DS.viewLink}>
                  View
                </a>
              )}
              <button type="button" onClick={() => docInputRef.current?.click()} style={DS.replaceBtn}>
                Replace
              </button>
              <button type="button" onClick={removeDoc} style={DS.removeBtn}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => docInputRef.current?.click()}
          disabled={docUploading}
          style={DS.uploadBtn}
        >
          {docUploading
            ? '⏳ Uploading…'
            : <><span style={{ fontSize: 20 }}>📎</span><span>Attach document (PDF / photo, max 20 MB)</span></>
          }
        </button>
      )}

      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp,image/heic"
        onChange={handleDocChange}
        style={{ display: 'none' }}
      />
    </div>
  )
}

const DS: Record<string, React.CSSProperties> = {
  section:    { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 },
  header:     { display: 'flex', flexDirection: 'column', gap: 2 },
  title:      { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  subtitle:   { fontSize: 11, color: '#94a3b8' },
  errBox:     { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '8px 12px', fontSize: 12 },
  docRow:     { display: 'flex', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px 14px' },
  docInfo:    { flex: 1, display: 'flex', flexDirection: 'column' as const, gap: 6 },
  docName:    { fontSize: 13, fontWeight: 600, color: '#0f172a', wordBreak: 'break-all' as const },
  docActions: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' as const },
  viewLink:   { fontSize: 12, fontWeight: 600, color: '#6366f1', textDecoration: 'none' },
  replaceBtn: { fontSize: 12, fontWeight: 600, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  removeBtn:  { fontSize: 12, fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 },
  uploadBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: '13px 16px', borderRadius: 10,
    border: '1.5px dashed #cbd5e1', backgroundColor: '#f8fafc',
    color: '#475569', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', width: '100%',
  },
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:       { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 },

  // Header
  titleRow:   { display: 'flex', alignItems: 'center', gap: 10 },
  back:       { fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0, lineHeight: 1 },
  title:      { fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, flex: 1 },
  editBtn:    { fontSize: 13, fontWeight: 600, color: '#6366f1', background: 'none', border: '1px solid #e0e7ff', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' },
  backLink:   { marginTop: 16, fontSize: 14, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' },

  // Info card
  infoCard:   { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  infoTop:    { display: 'flex', alignItems: 'center', gap: 12 },
  catCircle:  { width: 50, height: 50, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  infoMain:   { flex: 1 },
  infoName:   { fontSize: 16, fontWeight: 700, color: '#0f172a' },
  infoSub:    { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  infoAmount: { textAlign: 'right' as const, flexShrink: 0 },
  amountBig:  { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  amountSub:  { fontSize: 11, color: '#94a3b8' },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 0' },
  infoGridItem: { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  infoGridLabel: { fontSize: 11, color: '#94a3b8' },
  infoGridValue: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  notesRow:      { display: 'flex', gap: 6, alignItems: 'flex-start', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: 8 },
  notesText:     { fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  taxReliefRow:  { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' },
  taxReliefBadge: { fontSize: 12, fontWeight: 700, color: '#166534' },
  taxCatLabel:   { fontSize: 11, fontWeight: 600, color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: 20 },
  taxReliefHint: { fontSize: 11, color: '#4ade80', width: '100%' },

  // Edit form
  editForm:   { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 },
  editHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  editTitle:  { fontSize: 15, fontWeight: 700, color: '#0f172a' },

  // Year nav
  yearBar:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px' },
  yearArrow:  { fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: '#0f172a', padding: '0 4px' },
  yearCenter: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 },
  yearLabel:  { fontSize: 18, fontWeight: 800, color: '#0f172a' },
  yearStats:  { fontSize: 11, color: '#94a3b8' },

  // Month grid
  monthGrid:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 },
  monthCell:  {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            4,
    padding:        '10px 6px',
    borderRadius:   12,
    width:          '100%',
    fontFamily:     'inherit',
    transition:     'box-shadow 0.15s',
  },
  monthName:   { fontSize: 12, fontWeight: 700, color: '#374151' },
  statusDot:   { width: 6, height: 6, borderRadius: '50%' },
  monthStatus: { fontSize: 10, fontWeight: 600 },
  paidAmt:     { fontSize: 10, color: '#64748b' },

  // Pay panel
  payPanel:   { backgroundColor: '#fff', border: '1px solid #c7d2fe', borderRadius: 12, padding: 14, marginTop: 6, display: 'flex', flexDirection: 'column', gap: 10 },
  payTitle:   { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  statusRow:  { display: 'flex', gap: 6, flexWrap: 'wrap' as const },
  statusChip: { fontSize: 12, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' },
  payActions: { display: 'flex', gap: 8, marginTop: 4 },

  // History
  historySection: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' },
  historyTitle:   { fontSize: 13, fontWeight: 700, color: '#64748b', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' },
  historyRow:     { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #f8fafc' },
  historyLeft:    { display: 'flex', flexDirection: 'column' as const, gap: 2 },
  historyMonth:   { fontSize: 14, fontWeight: 600, color: '#0f172a' },
  historyNote:    { fontSize: 11, color: '#94a3b8' },
  historyRight:   { display: 'flex', alignItems: 'center', gap: 8 },
  historyAmt:     { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  historyBadge:   { fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 },

  // Shared form
  field:      { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  label:      { fontSize: 13, fontWeight: 600, color: '#374151' },
  optional:   { fontSize: 11, fontWeight: 400, color: '#94a3b8' },
  input: {
    padding:         '11px 13px',
    borderRadius:    10,
    border:          '1px solid #e2e8f0',
    fontSize:        14,
    outline:         'none',
    backgroundColor: '#fff',
    color:           '#0f172a',
    width:           '100%',
    boxSizing:       'border-box' as const,
  },
  textarea: {
    padding: '11px 13px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 14, outline: 'none', backgroundColor: '#fff',
    color: '#0f172a', resize: 'vertical' as const, fontFamily: 'inherit',
    width: '100%', boxSizing: 'border-box' as const,
  },
  saveBtn: {
    backgroundColor: '#0f172a', color: '#fff',
    padding: '12px 0', borderRadius: 10, fontWeight: 700,
    fontSize: 14, border: 'none', cursor: 'pointer',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9', color: '#475569',
    padding: '12px 16px', borderRadius: 10, fontWeight: 600,
    fontSize: 14, border: 'none', cursor: 'pointer',
  },
  errorBox:    { backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: '10px 14px', fontSize: 13 },

  // Tax relief toggle (in edit form)
  toggleRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' },
  toggleTitle: { fontSize: 13, fontWeight: 600, color: '#0f172a' },
  toggleHint:  { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  toggle:      { width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
  toggleThumb: { position: 'absolute', top: 2, left: 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff', transition: 'transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' },
  selectEdit: {
    padding: '11px 13px', borderRadius: 10, border: '1px solid #e2e8f0',
    fontSize: 14, backgroundColor: '#fff', color: '#0f172a',
    appearance: 'auto' as const, width: '100%', boxSizing: 'border-box' as const,
  },
  deactivateBtn: {
    width: '100%', padding: '13px 0', borderRadius: 12, fontWeight: 600,
    fontSize: 14, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
  },
}
