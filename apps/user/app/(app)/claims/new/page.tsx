'use client'
// apps/user/app/(app)/claims/new/page.tsx
// Create a new DRAFT claim.
// Pre-fills period_start/end to current month.
// On success → redirects to /claims/[id]

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function currentMonthRange(): { start: string; end: string } {
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toDateInput(start), end: toDateInput(end) }
}

export default function NewClaimPage() {
  const router  = useRouter()
  const range   = currentMonthRange()

  const [title,        setTitle]       = useState('')
  const [periodStart,  setPeriodStart] = useState(range.start)
  const [periodEnd,    setPeriodEnd]   = useState(range.end)
  const [loading,      setLoading]     = useState(false)
  const [error,        setError]       = useState<string | null>(null)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!periodStart || !periodEnd) {
      setError('Period start and end are required.')
      return
    }
    if (periodStart > periodEnd) {
      setError('Start date must be before or equal to end date.')
      return
    }

    setLoading(true)
    const res  = await fetch('/api/claims', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        title:        title.trim() || null,
        period_start: periodStart,
        period_end:   periodEnd,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error?.message ?? 'Failed to create claim.')
      return
    }

    router.push(`/claims/${json.claim.id}`)
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <Link href="/claims" style={S.back}>← Claims</Link>
      </div>

      <h1 style={S.title}>New Claim</h1>
      <p style={S.subtitle}>Set the period, then add your trips and expenses.</p>

      <form onSubmit={handleCreate} style={S.form}>

        <div style={S.field}>
          <label style={S.label}>Title <span style={S.optional}>(optional)</span></label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. March 2026 — Site Visits"
            style={S.input}
            disabled={loading}
          />
          <p style={S.hint}>Leave blank to use the period as the title.</p>
        </div>

        <div style={S.fieldRow}>
          <div style={S.field}>
            <label style={S.label}>Period start <span style={S.required}>*</span></label>
            <input
              type="date"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
              style={S.input}
              disabled={loading}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Period end <span style={S.required}>*</span></label>
            <input
              type="date"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
              style={S.input}
              disabled={loading}
            />
          </div>
        </div>

        {error && <div style={S.errorBox}>{error}</div>}

        <button
          type="submit"
          style={{ ...S.btnCreate, opacity: loading ? 0.65 : 1 }}
          disabled={loading}
        >
          {loading ? 'Creating…' : 'Create Claim →'}
        </button>
      </form>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page:     { display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 },
  header:   { display: 'flex' },
  back:     { fontSize: 13, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  title:    { fontSize: 22, fontWeight: 800, color: '#0f172a', WebkitTextFillColor: '#0f172a', margin: 0 },
  subtitle: { fontSize: 13, color: '#64748b', margin: 0 },
  form:     { display: 'flex', flexDirection: 'column', gap: 16 },
  fieldRow: { display: 'flex', gap: 12 },
  field:    { display: 'flex', flexDirection: 'column', gap: 6, flex: 1 },
  label:    { fontSize: 13, fontWeight: 600, color: '#374151' },
  optional: { fontWeight: 400, color: '#94a3b8' },
  required: { color: '#dc2626' },
  hint:     { fontSize: 11, color: '#94a3b8', margin: 0 },
  input:    {
    padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, color: '#0f172a', WebkitTextFillColor: '#0f172a', outline: 'none', backgroundColor: '#fff',
    boxSizing: 'border-box', width: '100%',
  },
  errorBox: {
    padding: '10px 12px', backgroundColor: '#fef2f2',
    border: '1px solid #fecaca', borderRadius: 8,
    fontSize: 13, color: '#dc2626',
  },
  btnCreate: {
    padding: '14px 20px', backgroundColor: '#0f172a', color: '#fff',
    border: 'none', borderRadius: 10, fontSize: 15,
    fontWeight: 700, cursor: 'pointer',
  },
}
