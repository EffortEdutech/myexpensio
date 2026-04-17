'use client'
/**
 * apps/admin/app/(protected)/referrals/ledger/page.tsx
 * Calls: GET /api/admin/referrals/commissions
 *        PATCH /api/admin/referrals/commissions (approve / hold / void)
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'
import ConfirmActionModal from '@/components/billing/ConfirmActionModal'

type LedgerRow = {
  id: string; agent_id: string; org_id: string; entry_type: string
  basis_amount: number; rate_pct: number | null; commission_amount: number
  currency: string; status: string; eligible_at: string | null
  approved_at: string | null; paid_at: string | null; created_at: string
  billing_invoice_id: string | null; metadata: Record<string, unknown> | null
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUSES = ['PENDING','APPROVED','HELD','PAID','REVERSED','VOID']

export default function CommissionLedgerPage() {
  const [items, setItems]         = useState<LedgerRow[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(1)
  const [confirm, setConfirm]     = useState<{ row: LedgerRow; action: string } | null>(null)
  const [actionLoading, setAL]    = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const PAGE = 25

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/referrals/commissions?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { void load() }, [load])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  async function handleAction(row: LedgerRow, newStatus: string) {
    setAL(true)
    try {
      const res = await fetch('/api/admin/referrals/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, status: newStatus }),
      })
      if (!res.ok) throw new Error('Action failed')
      showToast(`Entry ${newStatus.toLowerCase()}.`); setConfirm(null); void load()
    } catch { alert('Action failed.') }
    finally { setAL(false) }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>{toast}</div>}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Commission ledger</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Immutable commission entries. Actions create status transitions — no data is rewritten.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inp}>
          <option value="">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Date','Agent org','Type','Basis','Rate','Commission','Status','Eligible','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              : items.length === 0
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No ledger entries found.</td></tr>
              : items.map(row => {
                const agentOrgId = row.metadata?.agent_org_id as string | null
                return (
                  <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(row.created_at)}</td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {agentOrgId ? agentOrgId.slice(0,8)+'…' : row.agent_id.slice(0,8)+'…'}
                    </td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{row.entry_type}</td>
                    <td style={td}><MoneyCell amount={row.basis_amount} size="sm" /></td>
                    <td style={{ ...td, fontSize: '13px', color: '#6b7280' }}>{row.rate_pct != null ? `${row.rate_pct}%` : '—'}</td>
                    <td style={td}><MoneyCell amount={row.commission_amount} size="sm" /></td>
                    <td style={td}><StatusChip status={row.status} size="sm" /></td>
                    <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(row.eligible_at)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {row.status === 'PENDING' && (
                          <>
                            <SmallBtn label="Approve" onClick={() => setConfirm({ row, action: 'APPROVED' })} />
                            <SmallBtn label="Hold" onClick={() => setConfirm({ row, action: 'HELD' })} />
                            <SmallBtn label="Void" danger onClick={() => setConfirm({ row, action: 'VOID' })} />
                          </>
                        )}
                        {row.status === 'HELD' && <SmallBtn label="Approve" onClick={() => setConfirm({ row, action: 'APPROVED' })} />}
                      </div>
                    </td>
                  </tr>
                )
              })}
          </tbody>
        </table>
        {total > PAGE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{(page-1)*PAGE+1}–{Math.min(page*PAGE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p-1)} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*PAGE >= total} style={pbtn(page*PAGE >= total)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmActionModal
          title={`${confirm.action === 'APPROVED' ? 'Approve' : confirm.action === 'HELD' ? 'Hold' : 'Void'} commission entry`}
          description={
            confirm.action === 'VOID'
              ? 'This entry will be voided and excluded from all payout runs. This cannot be undone.'
              : confirm.action === 'HELD'
              ? 'Entry will be held pending review. It will not be included in payout runs until approved.'
              : 'Entry will be approved and eligible for inclusion in the next payout run.'
          }
          confirmLabel={confirm.action === 'APPROVED' ? 'Approve' : confirm.action === 'HELD' ? 'Hold' : 'Void'}
          confirmVariant={confirm.action === 'VOID' ? 'danger' : 'primary'}
          loading={actionLoading}
          onConfirm={() => void handleAction(confirm.row, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function SmallBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '3px 8px', borderRadius: '4px', border: `1px solid ${danger ? '#fca5a5' : '#e5e7eb'}`, background: danger ? '#fef2f2' : '#fff', fontSize: '11px', color: danger ? '#dc2626' : '#374151', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
