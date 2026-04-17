'use client'
/**
 * apps/admin/app/(protected)/billing/subscriptions/page.tsx
 * Calls: GET /api/admin/billing/overview (queries v_org_billing_snapshot)
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'

type OrgSnapshot = {
  org_id: string; org_name: string; tier: string
  billing_status: string | null; plan_code: string | null
  provider: string | null; current_amount: number | null
  current_currency: string | null; current_period_end: string | null
  cancel_at_period_end: boolean | null; last_invoice_at: string | null
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function SubscriptionsPage() {
  const [items, setItems] = useState<OrgSnapshot[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [tier, setTier] = useState('')
  const [billingStatus, setBillingStatus] = useState('')
  const [page, setPage] = useState(1)
  const PAGE = 20

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (q) params.set('q', q)
      if (tier) params.set('tier', tier)
      if (billingStatus) params.set('billing_status', billingStatus)
      const res = await fetch(`/api/admin/billing/overview?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, q, tier, billingStatus])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Subscriptions</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>All organisation subscription snapshots</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input placeholder="Search org name" value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} style={inp} />
        <select value={tier} onChange={(e) => { setTier(e.target.value); setPage(1) }} style={{ ...inp, maxWidth: '140px' }}>
          <option value="">All tiers</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
        </select>
        <select value={billingStatus} onChange={(e) => { setBillingStatus(e.target.value); setPage(1) }} style={{ ...inp, maxWidth: '160px' }}>
          <option value="">All statuses</option>
          {['ACTIVE','TRIALING','PAST_DUE','UNPAID','CANCELED','EXPIRED','INACTIVE'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Org', 'Tier', 'Plan', 'Status', 'Provider', 'Amount', 'Period ends', 'Cancel at end', 'Last invoice'].map((h) => (
                <Th key={h}>{h}</Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRow cols={9} /> : items.length === 0 ? <EmptyRow cols={9} label="No subscriptions found." /> : items.map((row) => (
              <tr key={row.org_id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ ...td, fontWeight: 500, fontSize: '13px', color: '#111827' }}>{row.org_name}</td>
                <td style={td}><StatusChip status={row.tier} size="sm" /></td>
                <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>{row.plan_code ?? '—'}</td>
                <td style={td}><StatusChip status={row.billing_status ?? 'INACTIVE'} size="sm" /></td>
                <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{row.provider ?? '—'}</td>
                <td style={td}><MoneyCell amount={row.current_amount} size="sm" dimZero /></td>
                <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{fmtDate(row.current_period_end)}</td>
                <td style={{ ...td, fontSize: '13px', color: row.cancel_at_period_end ? '#dc2626' : '#9ca3af' }}>
                  {row.cancel_at_period_end ? 'Yes' : 'No'}
                </td>
                <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(row.last_invoice_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pager page={page} pageSize={PAGE} total={total} onPrev={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} />
      </div>
    </div>
  )
}

function Th({ children }: { children: string }) {
  return <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{children}</th>
}
function LoadingRow({ cols }: { cols: number }) {
  return <tr><td colSpan={cols} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
}
function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return <tr><td colSpan={cols} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>{label}</td></tr>
}
function ErrorBanner({ msg }: { msg: string }) {
  return <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{msg}</div>
}
function Pager({ page, pageSize, total, onPrev, onNext }: { page: number; pageSize: number; total: number; onPrev: () => void; onNext: () => void }) {
  if (total <= pageSize) return null
  return (
    <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: '#6b7280' }}>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onPrev} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
        <button onClick={onNext} disabled={page * pageSize >= total} style={pbtn(page * pageSize >= total)}>Next →</button>
      </div>
    </div>
  )
}
const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (disabled: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#d1d5db' : '#374151', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer' })
