'use client'
/**
 * apps/admin/app/(protected)/claims/page.tsx
 * Admin view of all org claims — all users, filterable, read-only.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'

type Claim = {
  id: string; org_id: string; user_id: string
  status: string; title: string | null; total_amount: number
  currency: string; period_start: string | null; period_end: string | null
  submitted_at: string | null; created_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminClaimsPage() {
  const [claims, setClaims]     = useState<Claim[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [status, setStatus]     = useState('')
  const [q, setQ]               = useState('')
  const [page, setPage]         = useState(1)
  const PAGE = 25

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (status) params.set('status', status)
      if (q)      params.set('q', q)
      const res  = await fetch(`/api/admin/claims?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setClaims(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, status, q])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Claims</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          All organisation claims. SUBMITTED claims are read-only — no admin edits in Phase 1.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input placeholder="Search user or title" value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }} style={inp} />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={{ ...inp, maxWidth: '160px' }}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['User', 'Title', 'Period', 'Status', 'Total', 'Submitted', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
            ) : claims.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No claims found.</td></tr>
            ) : claims.map((claim) => {
              const profile = claim.profiles as { display_name?: string | null; email?: string | null } | null
              return (
                <tr key={claim.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={td}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{profile?.display_name ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{profile?.email ?? ''}</div>
                  </td>
                  <td style={{ ...td, fontSize: '13px', color: '#374151', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {claim.title ?? '(untitled)'}
                  </td>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {claim.period_start ? `${fmtDate(claim.period_start)} – ${fmtDate(claim.period_end)}` : '—'}
                  </td>
                  <td style={td}><StatusChip status={claim.status} size="sm" /></td>
                  <td style={td}><MoneyCell amount={claim.total_amount} size="sm" /></td>
                  <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(claim.submitted_at)}</td>
                  <td style={td}>
                    <Link href={`/claims/${claim.id}`} style={{ fontSize: '13px', color: '#4f46e5', textDecoration: 'none' }}>
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {total > PAGE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * PAGE >= total} style={pbtn(page * PAGE >= total)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const td: React.CSSProperties  = { padding: '11px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
