'use client'
/**
 * apps/admin/app/(protected)/referrals/payout-runs/page.tsx
 * Calls: GET  /api/admin/referrals/payout-batches
 *        POST /api/admin/referrals/payout-batches
 *        PATCH /api/admin/referrals/payout-batches/[batchId]
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'
import ConfirmActionModal from '@/components/billing/ConfirmActionModal'

type PayoutRun = {
  id: string; agent_id: string; period_start: string; period_end: string
  gross_amount: number; adjustment_amount: number; net_amount: number
  currency: string; status: string; payout_method: string | null
  payout_reference: string | null; paid_at: string | null; created_at: string
}
type Agent = { id: string; agent_code: string; display_name: string }

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PayoutRunsPage() {
  const [items, setItems]       = useState<PayoutRun[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]         = useState(1)
  const [agents, setAgents]     = useState<Agent[]>([])
  const [showCreate, setCreate] = useState(false)
  const [form, setForm]         = useState({ agent_id: '', period_start: '', period_end: '', payout_method: 'MANUAL' })
  const [creating, setCreating] = useState(false)
  const [confirm, setConfirm]   = useState<{ run: PayoutRun; action: 'APPROVED' | 'PAID' | 'CANCELED' } | null>(null)
  const [payRef, setPayRef]     = useState('')
  const [actionL, setActionL]   = useState(false)
  const [toast, setToast]       = useState<string | null>(null)
  const PAGE = 20

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/referrals/payout-batches?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    fetch('/api/admin/referrals/agents?status=ACTIVE&page_size=200')
      .then(r => r.json()).then(d => setAgents(d.items ?? [])).catch(() => {})
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  async function handleCreate() {
    if (!form.agent_id || !form.period_start || !form.period_end) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/referrals/payout-batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: form.agent_id, period_start: form.period_start, period_end: form.period_end, payout_method: form.payout_method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      showToast('Payout run created.'); setCreate(false); setForm({ agent_id: '', period_start: '', period_end: '', payout_method: 'MANUAL' }); void load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setCreating(false) }
  }

  async function handleAction(run: PayoutRun, action: string, reference?: string) {
    setActionL(true)
    try {
      const body: Record<string, unknown> = { status: action }
      if (action === 'PAID' && reference) body.payout_reference = reference
      const res = await fetch(`/api/admin/referrals/payout-batches/${run.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Action failed')
      showToast(`Run ${action.toLowerCase()}.`); setConfirm(null); setPayRef(''); void load()
    } catch { alert('Action failed.') }
    finally { setActionL(false) }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>
      {toast && <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>{toast}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Payout runs</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Batch commission approvals and release to partners</p>
        </div>
        <button onClick={() => setCreate(true)} style={btnPrimary}>+ New payout run</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={statusFilter} onChange={e => { setStatus(e.target.value); setPage(1) }} style={inp}>
          <option value="">All statuses</option>
          {['DRAFT','APPROVED','PROCESSING','PAID','FAILED','CANCELED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Period','Partner','Gross','Net','Method','Status','Paid','Reference','Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              : items.length === 0
              ? <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No payout runs yet.{' '}
                  <button onClick={() => setCreate(true)} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Create one →</button>
                </td></tr>
              : items.map(run => {
                const agentName = agents.find(a => a.id === run.agent_id)?.display_name ?? run.agent_id.slice(0,8)+'…'
                return (
                  <tr key={run.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDate(run.period_start)} – {fmtDate(run.period_end)}</td>
                    <td style={{ ...td, fontSize: '13px', fontWeight: 500, color: '#111827' }}>{agentName}</td>
                    <td style={td}><MoneyCell amount={run.gross_amount} size="sm" /></td>
                    <td style={td}><MoneyCell amount={run.net_amount} size="sm" /></td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{run.payout_method ?? '—'}</td>
                    <td style={td}><StatusChip status={run.status} size="sm" /></td>
                    <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(run.paid_at)}</td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{run.payout_reference ?? '—'}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {run.status === 'DRAFT' && (
                          <>
                            <SmallBtn label="Approve" onClick={() => setConfirm({ run, action: 'APPROVED' })} />
                            <SmallBtn label="Cancel" danger onClick={() => setConfirm({ run, action: 'CANCELED' })} />
                          </>
                        )}
                        {run.status === 'APPROVED' && (
                          <SmallBtn label="Mark paid" onClick={() => { setConfirm({ run, action: 'PAID' }); setPayRef('') }} />
                        )}
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

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) setCreate(false) }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '460px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>New payout run</h2>
              <button onClick={() => setCreate(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Partner *</label>
              <select value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))} style={inp}>
                <option value="">— Select partner —</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.display_name} ({a.agent_code})</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={lbl}>Period start *</label>
                <input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={lbl}>Period end *</label>
                <input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} style={inp} />
              </div>
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={lbl}>Payout method</label>
              <select value={form.payout_method} onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))} style={inp}>
                <option value="MANUAL">Manual</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="TOYYIBPAY">ToyyibPay</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setCreate(false)} style={btnSecondary}>Cancel</button>
              <button onClick={handleCreate} disabled={creating || !form.agent_id || !form.period_start || !form.period_end} style={{ ...btnPrimary, opacity: creating || !form.agent_id || !form.period_start || !form.period_end ? 0.5 : 1 }}>
                {creating ? 'Creating…' : 'Create run'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve / Cancel confirm */}
      {confirm && confirm.action !== 'PAID' && (
        <ConfirmActionModal
          title={confirm.action === 'APPROVED' ? 'Approve payout run' : 'Cancel payout run'}
          description={confirm.action === 'APPROVED'
            ? 'Approved runs are locked for payout. You will then mark it as paid once the transfer is made.'
            : 'This payout run will be cancelled. Ledger entries return to APPROVED status.'}
          confirmLabel={confirm.action === 'APPROVED' ? 'Approve' : 'Cancel run'}
          confirmVariant={confirm.action === 'CANCELED' ? 'danger' : 'primary'}
          loading={actionL}
          onConfirm={() => void handleAction(confirm.run, confirm.action)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Mark paid — needs reference */}
      {confirm?.action === 'PAID' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 600, color: '#111827' }}>Mark as paid</h2>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6b7280' }}>Enter the payment reference so this payout is fully auditable.</p>
            <label style={lbl}>Payment reference *</label>
            <input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="e.g. TT-20260501-001" style={{ ...inp, marginBottom: '24px' }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => { setConfirm(null); setPayRef('') }} style={btnSecondary}>Cancel</button>
              <button onClick={() => void handleAction(confirm.run, 'PAID', payRef)} disabled={actionL || !payRef.trim()} style={{ ...btnPrimary, opacity: actionL || !payRef.trim() ? 0.5 : 1 }}>
                {actionL ? 'Saving…' : 'Confirm payment'}
              </button>
            </div>
          </div>
        </div>
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

const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
