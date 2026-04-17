'use client'

/**
 * apps/admin/app/referrals/agents/page.tsx
 *
 * Partners (Agents) management page.
 * Org-as-agent model: each agent record is linked to an organisation via
 * agents.org_id. Admin creates, approves, suspends, and terminates partners here.
 *
 * Calls:
 *   GET  /api/admin/referrals/agents
 *   POST /api/admin/referrals/agents
 *   PATCH /api/admin/referrals/agents/[agentId]
 */

import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import ConfirmActionModal from '@/components/billing/ConfirmActionModal'
import KpiCard from '@/components/billing/KpiCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Agent = {
  id: string
  agent_code: string
  display_name: string
  email: string | null
  phone: string | null
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
  org_id: string | null          // populated via agents.org_id (our adaptation)
  commission_plan_id: string | null
  joined_at: string
  approved_at: string | null
  payout_method: string | null
  metadata: Record<string, unknown> | null
}

type Org = { id: string; name: string }

type CommissionPlan = { id: string; code: string; name: string }

type CreateAgentBody = {
  agent_code: string
  display_name: string
  email?: string
  phone?: string
  org_id?: string
  commission_plan_code?: string
  payout_method?: string
  payout_details?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
  return data as T
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [total, setTotal] = useState(0)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [plans, setPlans] = useState<CommissionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [actionAgent, setActionAgent] = useState<Agent | null>(null)
  const [actionType, setActionType] = useState<'APPROVE' | 'SUSPEND' | 'TERMINATE' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Create form
  const [form, setForm] = useState<Partial<CreateAgentBody>>({})
  const [creating, setCreating] = useState(false)

  // ---------------------------------------------------------------------------
  // Data loading
  // ---------------------------------------------------------------------------

  const loadAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) })
      if (statusFilter) params.set('status', statusFilter)
      if (query) params.set('q', query)

      const data = await apiFetch<{ items: Agent[]; total: number }>(
        `/api/admin/referrals/agents?${params}`
      )
      setAgents(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load agents.')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, query])

  useEffect(() => { void loadAgents() }, [loadAgents])

  // Load orgs + plans once for the create form
  useEffect(() => {
    async function loadMeta() {
      try {
        const [orgsData, plansData] = await Promise.all([
          apiFetch<{ data: Org[] }>('/api/admin/orgs?page_size=200'),
          apiFetch<{ items: CommissionPlan[] }>('/api/admin/billing/commission-plans'),
        ])
        setOrgs(orgsData.data ?? [])
        setPlans(plansData.items ?? [])
      } catch {
        // Non-fatal — create form falls back to manual entry
      }
    }
    void loadMeta()
  }, [])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  async function handleCreate() {
    if (!form.agent_code?.trim() || !form.display_name?.trim()) return
    setCreating(true)
    try {
      await apiFetch('/api/admin/referrals/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent_code: form.agent_code.trim().toUpperCase(),
          display_name: form.display_name.trim(),
          email: form.email?.trim() || undefined,
          phone: form.phone?.trim() || undefined,
          commission_plan_code: form.commission_plan_code || 'DEFAULT_DIRECT_15',
          payout_method: form.payout_method || 'MANUAL',
          // org_id is passed in metadata until the API is updated
          metadata: { org_id: form.org_id ?? null },
        }),
      })
      showToast('Partner created successfully.')
      setShowCreate(false)
      setForm({})
      void loadAgents()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(agent: Agent, newStatus: string, reason?: string) {
    setActionLoading(true)
    try {
      await apiFetch(`/api/admin/referrals/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, metadata: { status_reason: reason ?? null } }),
      })
      showToast(`Partner ${agent.display_name} updated to ${newStatus}.`)
      setActionAgent(null)
      setActionType(null)
      void loadAgents()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const counts = {
    active: agents.filter((a) => a.status === 'ACTIVE').length,
    pending: agents.filter((a) => a.status === 'PENDING').length,
    suspended: agents.filter((a) => a.status === 'SUSPENDED').length,
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: '#111827', color: '#fff', padding: '12px 20px',
          borderRadius: '8px', fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>
            Partners
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            Registered organisations earning commission from tenant subscriptions
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500,
            background: '#4f46e5', color: '#fff', border: 'none', cursor: 'pointer',
          }}
        >
          + New partner
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 180px))', gap: '14px', marginBottom: '24px' }}>
        <KpiCard label="Active" value={counts.active} accent="green" />
        <KpiCard label="Pending approval" value={counts.pending} accent="amber" />
        <KpiCard label="Suspended" value={counts.suspended} accent="red" />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          placeholder="Search code / name / email"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1) }}
          style={inputStyle}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          style={{ ...inputStyle, maxWidth: '180px' }}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="TERMINATED">Terminated</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <Th>Partner code</Th>
              <Th>Display name</Th>
              <Th>Org</Th>
              <Th>Status</Th>
              <Th>Payout method</Th>
              <Th>Joined</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  Loading…
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No partners found.{' '}
                  <button onClick={() => setShowCreate(true)} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                    Create the first one →
                  </button>
                </td>
              </tr>
            ) : (
              agents.map((agent) => {
                const orgName = orgs.find((o) => o.id === (agent.metadata?.org_id ?? agent.org_id))?.name
                return (
                  <tr key={agent.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
                        {agent.agent_code}
                      </span>
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{agent.display_name}</div>
                      {agent.email && <div style={{ fontSize: '12px', color: '#9ca3af' }}>{agent.email}</div>}
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: '13px', color: orgName ? '#374151' : '#d1d5db' }}>
                        {orgName ?? '— unlinked —'}
                      </span>
                    </td>
                    <td style={td}>
                      <StatusChip status={agent.status} size="sm" />
                    </td>
                    <td style={{ ...td, color: '#6b7280', fontSize: '13px' }}>
                      {agent.payout_method ?? '—'}
                    </td>
                    <td style={{ ...td, color: '#9ca3af', fontSize: '12px' }}>
                      {fmtDate(agent.joined_at)}
                    </td>
                    <td style={td}>
                      <ActionsMenu
                        agent={agent}
                        onApprove={() => { setActionAgent(agent); setActionType('APPROVE') }}
                        onSuspend={() => { setActionAgent(agent); setActionType('SUSPEND') }}
                        onTerminate={() => { setActionAgent(agent); setActionType('TERMINATE') }}
                      />
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <PageBtn label="← Prev" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
              <PageBtn label="Next →" disabled={page * PAGE_SIZE >= total} onClick={() => setPage((p) => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="New partner" onClose={() => { setShowCreate(false); setForm({}) }}>
          <FormRow label="Partner code *">
            <input
              placeholder="e.g. PARTNER-001"
              value={form.agent_code ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, agent_code: e.target.value.toUpperCase() }))}
              style={inputStyle}
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              Unique identifier. Auto-uppercased.
            </p>
          </FormRow>
          <FormRow label="Display name *">
            <input
              placeholder="Partner organisation name"
              value={form.display_name ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="Linked organisation">
            {orgs.length > 0 ? (
              <select
                value={form.org_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, org_id: e.target.value || undefined }))}
                style={inputStyle}
              >
                <option value="">— Select organisation —</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Organisation ID (UUID)"
                value={form.org_id ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, org_id: e.target.value || undefined }))}
                style={inputStyle}
              />
            )}
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
              The organisation that will earn commission from tenant payments.
            </p>
          </FormRow>
          <FormRow label="Commission plan">
            <select
              value={form.commission_plan_code ?? 'DEFAULT_DIRECT_15'}
              onChange={(e) => setForm((f) => ({ ...f, commission_plan_code: e.target.value }))}
              style={inputStyle}
            >
              {plans.length > 0 ? (
                plans.map((p) => (
                  <option key={p.id} value={p.code}>{p.name} ({p.code})</option>
                ))
              ) : (
                <option value="DEFAULT_DIRECT_15">Default Direct 15%</option>
              )}
            </select>
          </FormRow>
          <FormRow label="Contact email">
            <input
              type="email"
              placeholder="billing contact"
              value={form.email ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              style={inputStyle}
            />
          </FormRow>
          <FormRow label="Payout method">
            <select
              value={form.payout_method ?? 'MANUAL'}
              onChange={(e) => setForm((f) => ({ ...f, payout_method: e.target.value }))}
              style={inputStyle}
            >
              <option value="MANUAL">Manual</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="TOYYIBPAY">ToyyibPay</option>
            </select>
          </FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button onClick={() => { setShowCreate(false); setForm({}) }} style={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.agent_code || !form.display_name}
              style={btnPrimary(creating || !form.agent_code || !form.display_name)}
            >
              {creating ? 'Creating…' : 'Create partner'}
            </button>
          </div>
        </Modal>
      )}

      {/* Action confirm modals */}
      {actionAgent && actionType === 'APPROVE' && (
        <ConfirmActionModal
          title={`Approve ${actionAgent.display_name}`}
          description="This partner will become ACTIVE and can start earning commission. Their assigned tenants will be linked from this point."
          confirmLabel="Approve"
          confirmVariant="primary"
          loading={actionLoading}
          onConfirm={() => void handleStatusChange(actionAgent, 'ACTIVE')}
          onCancel={() => { setActionAgent(null); setActionType(null) }}
        />
      )}
      {actionAgent && actionType === 'SUSPEND' && (
        <ConfirmActionModal
          title={`Suspend ${actionAgent.display_name}`}
          description="This partner will be suspended. No new commission will be generated while suspended. Existing ledger entries are unaffected."
          confirmLabel="Suspend"
          requireReason
          reasonLabel="Reason for suspension"
          loading={actionLoading}
          onConfirm={(reason) => void handleStatusChange(actionAgent, 'SUSPENDED', reason)}
          onCancel={() => { setActionAgent(null); setActionType(null) }}
        />
      )}
      {actionAgent && actionType === 'TERMINATE' && (
        <ConfirmActionModal
          title={`Terminate ${actionAgent.display_name}`}
          description="This is irreversible. The partner record will be TERMINATED. All pending commission ledger entries must be resolved manually before terminating."
          confirmLabel="Terminate permanently"
          requireReason
          reasonLabel="Reason for termination"
          loading={actionLoading}
          onConfirm={(reason) => void handleStatusChange(actionAgent, 'TERMINATED', reason)}
          onCancel={() => { setActionAgent(null); setActionType(null) }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner components
// ---------------------------------------------------------------------------

function ActionsMenu({
  agent,
  onApprove,
  onSuspend,
  onTerminate,
}: {
  agent: Agent
  onApprove: () => void
  onSuspend: () => void
  onTerminate: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}
      >
        ···
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 50,
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '160px', overflow: 'hidden',
          }}>
            {agent.status === 'PENDING' && (
              <MenuItem label="Approve" onClick={() => { setOpen(false); onApprove() }} />
            )}
            {agent.status === 'ACTIVE' && (
              <MenuItem label="Suspend" onClick={() => { setOpen(false); onSuspend() }} danger />
            )}
            {agent.status !== 'TERMINATED' && (
              <MenuItem label="Terminate" onClick={() => { setOpen(false); onTerminate() }} danger />
            )}
            <MenuItem
              label="View ledger"
              onClick={() => { setOpen(false); window.location.href = `/referrals/ledger?agent_id=${agent.id}` }}
            />
            <MenuItem
              label="View assignments"
              onClick={() => { setOpen(false); window.location.href = `/referrals/attributions?agent_id=${agent.id}` }}
            />
          </div>
        </>
      )}
    </div>
  )
}

function MenuItem({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '9px 14px', background: 'none', border: 'none',
        fontSize: '13px', cursor: 'pointer', color: danger ? '#dc2626' : '#374151',
      }}
    >
      {label}
    </button>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

function Th({ children }: { children: string }) {
  return (
    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: disabled ? '#f9fafb' : '#fff', color: disabled ? '#d1d5db' : '#374151', fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Style tokens
// ---------------------------------------------------------------------------

const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px',
  color: '#111827', background: '#fff', fontFamily: 'inherit',
}

function btnPrimary(disabled: boolean): React.CSSProperties {
  return {
    padding: '9px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 500,
    border: 'none', background: disabled ? '#e5e7eb' : '#4f46e5',
    color: disabled ? '#9ca3af' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
  }
}

const btnSecondary: React.CSSProperties = {
  padding: '9px 18px', borderRadius: '7px', fontSize: '14px', fontWeight: 500,
  border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer',
}
