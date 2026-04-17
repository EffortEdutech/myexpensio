'use client'
/**
 * apps/admin/app/(protected)/billing/events/page.tsx
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'

type BillingEvent = {
  id: string; provider: string; provider_event_id: string; event_type: string
  org_id: string | null; org_name: string | null; processing_status: string
  attempt_count: number; last_error: string | null; received_at: string
  processed_at: string | null; payload: Record<string, unknown>
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function WebhookEventsPage() {
  const [items, setItems] = useState<BillingEvent[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [provider, setProvider] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<BillingEvent | null>(null)
  const PAGE = 25

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (statusFilter) params.set('status', statusFilter)
      if (provider) params.set('provider', provider)
      const res = await fetch(`/api/admin/billing/events?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, statusFilter, provider])

  useEffect(() => { void load() }, [load])

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Webhook events</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Raw events received from Stripe and ToyyibPay</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={provider} onChange={(e) => { setProvider(e.target.value); setPage(1) }} style={inp}>
          <option value="">All providers</option>
          <option value="STRIPE">Stripe</option>
          <option value="TOYYIBPAY">ToyyibPay</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} style={inp}>
          <option value="">All statuses</option>
          {['RECEIVED','PROCESSED','FAILED','IGNORED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Received', 'Provider', 'Event type', 'Org', 'Status', 'Attempts', 'Error', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              : items.length === 0
              ? <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No events found.</td></tr>
              : items.map((ev) => (
                <tr
                  key={ev.id}
                  style={{ borderTop: '1px solid #f3f4f6', background: ev.processing_status === 'FAILED' ? '#fff5f5' : undefined, cursor: 'pointer' }}
                  onClick={() => setSelected(ev)}
                >
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(ev.received_at)}</td>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{ev.provider}</td>
                  <td style={{ ...td, fontFamily: 'monospace', fontSize: '12px', color: '#374151' }}>{ev.event_type}</td>
                  <td style={{ ...td, fontSize: '13px', color: '#6b7280' }}>{ev.org_name ?? (ev.org_id ? ev.org_id.slice(0, 8) + '…' : '—')}</td>
                  <td style={td}><StatusChip status={ev.processing_status} size="sm" /></td>
                  <td style={{ ...td, fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>{ev.attempt_count}</td>
                  <td style={{ ...td, fontSize: '12px', color: '#dc2626', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.last_error ?? '—'}
                  </td>
                  <td style={{ ...td, fontSize: '12px', color: '#4f46e5' }}>Payload →</td>
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

      {/* Payload drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => { if (e.target === e.currentTarget) setSelected(null) }}>
          <div style={{ width: '520px', background: '#fff', height: '100%', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Event payload</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' }}>Event type</p>
              <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '13px', color: '#374151' }}>{selected.event_type}</p>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' }}>Status</p>
              <StatusChip status={selected.processing_status} />
            </div>
            {selected.last_error && (
              <div style={{ padding: '12px', background: '#fef2f2', borderRadius: '6px' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' }}>Last error</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontFamily: 'monospace' }}>{selected.last_error}</p>
              </div>
            )}
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' }}>Raw payload</p>
              <pre style={{ margin: 0, padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '11px', color: '#374151', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
