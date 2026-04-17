'use client'
/**
 * apps/admin/app/(protected)/referrals/attributions/page.tsx
 *
 * Assignments — admin creates and manages org-to-agent links.
 * Source is always ADMIN_ASSIGN in the org-as-agent model.
 */
import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import ConfirmActionModal from '@/components/billing/ConfirmActionModal'

type Attribution = {
  id: string; org_id: string; org_name: string | null
  agent_id: string; agent_code: string | null; agent_name: string | null
  source: string; status: string; attributed_at: string
  locked_at: string | null; notes: string | null
}
type Agent = { id: string; agent_code: string; display_name: string }
type Org   = { id: string; name: string }

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AttributionsPage() {
  const [items, setItems]         = useState<Attribution[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(1)
  const [agents, setAgents]       = useState<Agent[]>([])
  const [orgs, setOrgs]           = useState<Org[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]           = useState<{ org_id: string; agent_id: string; notes: string }>({ org_id: '', agent_id: '', notes: '' })
  const [creating, setCreating]   = useState(false)
  const [toast, setToast]         = useState<string | null>(null)
  const [confirmItem, setConfirmItem] = useState<{ attr: Attribution; newStatus: string } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const PAGE = 20

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/referrals/attributions?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setItems(data.items ?? []); setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, statusFilter])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    async function loadMeta() {
      const [ar, or_] = await Promise.all([
        fetch('/api/admin/referrals/agents?page_size=200&status=ACTIVE').then(r => r.json()).catch(() => ({ items: [] })),
        fetch('/api/admin/orgs?page_size=200').then(r => r.json()).catch(() => ({ data: [] })),
      ])
      setAgents(ar.items ?? [])
      setOrgs(or_.data ?? [])
    }
    void loadMeta()
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  async function handleCreate() {
    if (!form.org_id || !form.agent_id) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/referrals/attributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: form.org_id, agent_id: form.agent_id, notes: form.notes || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) throw new Error('This org is already assigned to a partner.')
        throw new Error(data?.error?.message ?? 'Create failed')
      }
      showToast('Assignment created.'); setShowCreate(false); setForm({ org_id: '', agent_id: '', notes: '' }); void load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setCreating(false) }
  }

  async function handleStatusChange(attr: Attribution, newStatus: string, reason?: string) {
    setActionLoading(true)
    try {
      const res = await fetch('/api/admin/referrals/attributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: attr.id, status: newStatus, notes: reason }),
      })
      if (!res.ok) throw new Error('Action failed')
      showToast(`Assignment ${newStatus.toLowerCase()}.`); setConfirmItem(null); void load()
    } catch (e) { alert(e instanceof Error ? e.message : 'Error') }
    finally { setActionLoading(false) }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>
      {toast && <Toast msg={toast} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Assignments</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            Link tenant organisations to partner agents. Commission is earned based on these assignments.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} style={btnPrimary}>+ New assignment</button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={statusFilter} onChange={(e) => { setStatus(e.target.value); setPage(1) }} style={inp}>
          <option value="">All statuses</option>
          {['PENDING','ACTIVE','REJECTED','REVERSED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Assigned', 'Tenant org', 'Partner', 'Source', 'Status', 'Notes', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              : items.length === 0
              ? <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No assignments yet.{' '}
                  <button onClick={() => setShowCreate(true)} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                    Create the first one →
                  </button>
                </td></tr>
              : items.map(attr => (
                <tr key={attr.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(attr.attributed_at)}</td>
                  <td style={{ ...td, fontSize: '13px', fontWeight: 500, color: '#111827' }}>{attr.org_name ?? attr.org_id.slice(0,8)+'…'}</td>
                  <td style={td}>
                    <div style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{attr.agent_name ?? '—'}</div>
                    {attr.agent_code && <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{attr.agent_code}</div>}
                  </td>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{attr.source}</td>
                  <td style={td}><StatusChip status={attr.status} size="sm" /></td>
                  <td style={{ ...td, fontSize: '12px', color: '#9ca3af', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attr.notes ?? '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {attr.status === 'ACTIVE' && (
                        <ActionBtn label="Reverse" danger onClick={() => setConfirmItem({ attr, newStatus: 'REVERSED' })} />
                      )}
                      {attr.status === 'PENDING' && (
                        <>
                          <ActionBtn label="Approve" onClick={() => setConfirmItem({ attr, newStatus: 'ACTIVE' })} />
                          <ActionBtn label="Reject" danger onClick={() => setConfirmItem({ attr, newStatus: 'REJECTED' })} />
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
        <Modal title="New assignment" onClose={() => { setShowCreate(false); setForm({ org_id: '', agent_id: '', notes: '' }) }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Tenant organisation *</label>
            {orgs.length > 0
              ? <select value={form.org_id} onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))} style={inp}>
                  <option value="">— Select org —</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              : <input placeholder="Org ID (UUID)" value={form.org_id} onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))} style={inp} />}
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>The org whose subscription payments will generate commission.</p>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={lbl}>Partner agent *</label>
            {agents.length > 0
              ? <select value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))} style={inp}>
                  <option value="">— Select partner —</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.display_name} ({a.agent_code})</option>)}
                </select>
              : <input placeholder="Agent ID (UUID)" value={form.agent_id} onChange={e => setForm(f => ({ ...f, agent_id: e.target.value }))} style={inp} />}
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...inp, resize: 'vertical' }} placeholder="Optional — reason for assignment" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button onClick={() => { setShowCreate(false); setForm({ org_id: '', agent_id: '', notes: '' }) }} style={btnSecondary}>Cancel</button>
            <button onClick={handleCreate} disabled={creating || !form.org_id || !form.agent_id} style={btnPrimary}>
              {creating ? 'Creating…' : 'Create assignment'}
            </button>
          </div>
        </Modal>
      )}

      {/* Confirm modal */}
      {confirmItem && (
        <ConfirmActionModal
          title={`${confirmItem.newStatus === 'ACTIVE' ? 'Approve' : confirmItem.newStatus === 'REJECTED' ? 'Reject' : 'Reverse'} assignment`}
          description={
            confirmItem.newStatus === 'REVERSED'
              ? `Reversing this assignment will stop future commission generation for ${confirmItem.attr.org_name ?? 'this org'}. Existing ledger entries are unaffected.`
              : confirmItem.newStatus === 'REJECTED'
              ? `Reject this assignment. No commission will be generated.`
              : `Approve and activate this assignment. Commission will be generated on the next paid invoice.`
          }
          confirmLabel={confirmItem.newStatus === 'ACTIVE' ? 'Approve' : confirmItem.newStatus === 'REJECTED' ? 'Reject' : 'Reverse'}
          confirmVariant={confirmItem.newStatus === 'ACTIVE' ? 'primary' : 'danger'}
          requireReason={confirmItem.newStatus === 'REVERSED' || confirmItem.newStatus === 'REJECTED'}
          reasonLabel="Reason"
          loading={actionLoading}
          onConfirm={(reason) => void handleStatusChange(confirmItem.attr, confirmItem.newStatus, reason)}
          onCancel={() => setConfirmItem(null)}
        />
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function ActionBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: '5px', border: `1px solid ${danger ? '#fca5a5' : '#e5e7eb'}`, background: danger ? '#fef2f2' : '#fff', fontSize: '12px', color: danger ? '#dc2626' : '#374151', cursor: 'pointer' }}>
      {label}
    </button>
  )
}

function Toast({ msg }: { msg: string }) {
  return <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>{msg}</div>
}

const td: React.CSSProperties = { padding: '11px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const lbl: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }
const btnPrimary: React.CSSProperties = { padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }
const btnSecondary: React.CSSProperties = { padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
