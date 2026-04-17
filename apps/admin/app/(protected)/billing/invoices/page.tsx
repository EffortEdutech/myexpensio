'use client'
/**
 * apps/admin/app/(protected)/billing/invoices/page.tsx
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'

type Invoice = {
  id: string; org_id: string; org_name: string | null; provider: string
  invoice_number: string | null; status: string; amount_due: number
  amount_paid: number; currency: string; issued_at: string | null
  paid_at: string | null; created_at: string; invoice_url: string | null
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [provider, setProvider] = useState('')
  const [page, setPage] = useState(1)
  const PAGE = 25

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (status) params.set('status', status)
      if (provider) params.set('provider', provider)
      const res = await fetch(`/api/admin/billing/invoices?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, status, provider])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Invoices</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>All billing invoices across all organisations</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={inp}>
          <option value="">All statuses</option>
          {['PAID','OPEN','DRAFT','FAILED','VOID','REFUNDED','UNCOLLECTIBLE'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1) }} style={inp}>
          <option value="">All providers</option>
          <option value="STRIPE">Stripe</option>
          <option value="TOYYIBPAY">ToyyibPay</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Issued', 'Org', 'Invoice #', 'Provider', 'Status', 'Amount due', 'Amount paid', 'Paid at', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              : items.length === 0
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No invoices found.</td></tr>
              : items.map((inv) => (
                <tr key={inv.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{fmtDate(inv.issued_at ?? inv.created_at)}</td>
                  <td style={{ ...td, fontSize: '13px', fontWeight: 500, color: '#111827' }}>{inv.org_name ?? inv.org_id.slice(0, 8) + '…'}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>{inv.invoice_number ?? '—'}</td>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{inv.provider}</td>
                  <td style={td}><StatusChip status={inv.status} size="sm" /></td>
                  <td style={td}><MoneyCell amount={inv.amount_due} size="sm" /></td>
                  <td style={td}><MoneyCell amount={inv.amount_paid} size="sm" /></td>
                  <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(inv.paid_at)}</td>
                  <td style={td}>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '12px', color: '#4f46e5', textDecoration: 'none' }}>
                        View →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {total > PAGE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE >= total} style={pbtn(page * PAGE >= total)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
