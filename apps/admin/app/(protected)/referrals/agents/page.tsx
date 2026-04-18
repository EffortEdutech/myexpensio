'use client'
/**
 * apps/admin/app/(protected)/referrals/agents/page.tsx
 *
 * Partners page — lists and manages partner organisations.
 * An org becomes a partner by setting is_partner = true.
 * No separate agents table. Commission plan lives on the org itself.
 *
 * Calls:
 *   GET  /api/admin/partners
 *   POST /api/admin/partners
 *   PATCH /api/admin/partners/[orgId]
 *   GET  /api/admin/orgs                    (for "mark existing" picker)
 *   GET  /api/admin/billing/commission-plans (for plan picker)
 */

import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import KpiCard from '@/components/billing/KpiCard'
import ConfirmActionModal from '@/components/billing/ConfirmActionModal'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Partner = {
  id: string
  name: string
  status: string
  is_partner: boolean
  partner_code: string | null
  partner_status: string | null
  payout_method: string | null
  commission_plan_id: string | null
  commission_plan_code: string | null
  commission_plan_name: string | null
  created_at: string
}

type Org = { id: string; name: string }
type CommissionPlan = { id: string; code: string; name: string }

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

export default function PartnersPage() {
  const [partners, setPartners]   = useState<Partner[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [statusFilter, setStatus] = useState('')
  const [q, setQ]                 = useState('')
  const [page, setPage]           = useState(1)
  const PAGE = 20

  // Meta for pickers
  const [orgs, setOrgs]   = useState<Org[]>([])
  const [plans, setPlans] = useState<CommissionPlan[]>([])

  // Modals
  const [showCreate, setShowCreate] = useState(false)
  const [createMode, setCreateMode] = useState<'new' | 'existing'>('new')
  const [form, setForm] = useState({
    name:               '',
    org_id:             '',
    partner_code:       '',
    commission_plan_id: '',
    payout_method:      'MANUAL',
  })
  const [creating, setCreating]   = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [actionTarget, setActionTarget] = useState<Partner | null>(null)
  const [actionType, setActionType]     = useState<'SUSPEND' | 'TERMINATE' | 'REACTIVATE' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (statusFilter) params.set('status', statusFilter)
      if (q) params.set('q', q)
      const data = await apiFetch<{ items: Partner[]; total: number }>(
        `/api/admin/partners?${params}`
      )
      setPartners(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, statusFilter, q])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    // Non-partner orgs for the "mark existing" picker
    Promise.all([
      apiFetch<{ data: Org[] }>('/api/admin/orgs?page_size=200').catch(() => ({ data: [] })),
      apiFetch<{ items: CommissionPlan[] }>('/api/admin/billing/commission-plans').catch(() => ({ items: [] })),
    ]).then(([orgsData, plansData]) => {
      setOrgs((orgsData.data ?? []).filter(o => !partners.find(p => p.id === o.id)))
      setPlans(plansData.items ?? [])
    })
  }, [partners])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function resetForm() {
    setForm({ name: '', org_id: '', partner_code: '', commission_plan_id: '', payout_method: 'MANUAL' })
    setFormError(null)
  }

  async function handleCreate() {
    setFormError(null)
    if (createMode === 'new' && !form.name.trim()) {
      setFormError('Organisation name is required.')
      return
    }
    if (createMode === 'existing' && !form.org_id) {
      setFormError('Select an organisation.')
      return
    }

    setCreating(true)
    try {
      const body: Record<string, unknown> = {
        partner_code:       form.partner_code.trim().toUpperCase() || undefined,
        commission_plan_id: form.commission_plan_id || undefined,
        payout_method:      form.payout_method || 'MANUAL',
      }
      if (createMode === 'new') body.name = form.name.trim()
      else body.org_id = form.org_id

      await apiFetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      showToast(
        createMode === 'new'
          ? `Partner "${form.name.trim()}" created.`
          : 'Organisation registered as partner.'
      )
      setShowCreate(false); resetForm(); void load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(
    partner: Partner,
    newStatus: 'ACTIVE' | 'SUSPENDED' | 'TERMINATED'
  ) {
    setActionLoading(true)
    try {
      await apiFetch(`/api/admin/partners/${partner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_status: newStatus }),
      })
      showToast(`${partner.name} is now ${newStatus.toLowerCase()}.`)
      setActionTarget(null); setActionType(null); void load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived counts (from current page only — full counts come from API)
  // ---------------------------------------------------------------------------

  const activeCount     = partners.filter(p => p.partner_status === 'ACTIVE').length
  const suspendedCount  = partners.filter(p => p.partner_status === 'SUSPENDED').length

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Partners</h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            Organisations earning commission from their tenants' monthly subscriptions.
            Each partner <strong>is</strong> an organisation — no separate record needed.
          </p>
        </div>
        <button onClick={() => { setShowCreate(true); resetForm() }} style={btnPrimary}>
          + Register partner
        </button>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 180px))', gap: '14px', marginBottom: '24px' }}>
        <KpiCard label="Total partners" value={total} accent="blue" loading={loading} />
        <KpiCard label="Active" value={activeCount} accent="green" loading={loading} />
        <KpiCard label="Suspended" value={suspendedCount} accent="amber" loading={loading} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <input
          placeholder="Search name or code"
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1) }}
          style={inp}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          style={{ ...inp, maxWidth: '180px' }}
        >
          <option value="">All statuses</option>
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
              {['Organisation', 'Partner code', 'Commission plan', 'Payout method', 'Status', 'Registered', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  Loading…
                </td>
              </tr>
            ) : partners.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No partners registered yet.{' '}
                  <button onClick={() => { setShowCreate(true); resetForm() }} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
                    Register the first one →
                  </button>
                </td>
              </tr>
            ) : (
              partners.map(partner => (
                <tr key={partner.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={td}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{partner.name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>{partner.id.slice(0, 8)}…</div>
                  </td>
                  <td style={td}>
                    {partner.partner_code
                      ? <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#374151', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>{partner.partner_code}</span>
                      : <span style={{ fontSize: '12px', color: '#d1d5db' }}>— not set —</span>}
                  </td>
                  <td style={{ ...td, fontSize: '13px', color: '#6b7280' }}>
                    {partner.commission_plan_name ?? partner.commission_plan_code ?? (
                      <span style={{ color: '#d1d5db' }}>Default 15%</span>
                    )}
                  </td>
                  <td style={{ ...td, fontSize: '13px', color: '#6b7280' }}>
                    {partner.payout_method ?? '—'}
                  </td>
                  <td style={td}>
                    <StatusChip status={partner.partner_status ?? 'ACTIVE'} size="sm" />
                  </td>
                  <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>
                    {fmtDate(partner.created_at)}
                  </td>
                  <td style={td}>
                    <ActionsMenu
                      partner={partner}
                      onSuspend={() => { setActionTarget(partner); setActionType('SUSPEND') }}
                      onTerminate={() => { setActionTarget(partner); setActionType('TERMINATE') }}
                      onReactivate={() => { setActionTarget(partner); setActionType('REACTIVATE') }}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {total > PAGE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>
              {(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * PAGE >= total} style={pbtn(page * PAGE >= total)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Create / Register modal ── */}
      {showCreate && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) { setShowCreate(false); resetForm() } }}
        >
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>Register partner</h2>
              <button onClick={() => { setShowCreate(false); resetForm() }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: '#f9fafb', borderRadius: '8px', padding: '4px' }}>
              {(['new', 'existing'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setCreateMode(mode)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', border: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                    background: createMode === mode ? '#fff' : 'transparent',
                    color: createMode === mode ? '#111827' : '#6b7280',
                    boxShadow: createMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {mode === 'new' ? 'Create new org' : 'Mark existing org'}
                </button>
              ))}
            </div>

            {/* Form fields */}
            {createMode === 'new' ? (
              <FormRow label="Organisation name *">
                <input
                  placeholder="e.g. Acme Sdn Bhd"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  style={inp}
                />
              </FormRow>
            ) : (
              <FormRow label="Select organisation *">
                {orgs.length > 0 ? (
                  <select
                    value={form.org_id}
                    onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))}
                    style={inp}
                  >
                    <option value="">— Choose an organisation —</option>
                    {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                ) : (
                  <input
                    placeholder="Organisation ID (UUID)"
                    value={form.org_id}
                    onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))}
                    style={inp}
                  />
                )}
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                  This will set is_partner = true on the selected org. Existing users and data are unaffected.
                </p>
              </FormRow>
            )}

            <FormRow label="Partner code">
              <input
                placeholder="e.g. PARTNER-001 (auto-uppercased)"
                value={form.partner_code}
                onChange={e => setForm(f => ({ ...f, partner_code: e.target.value }))}
                style={inp}
              />
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                Optional unique identifier. Used internally and in commission reports.
              </p>
            </FormRow>

            <FormRow label="Commission plan">
              <select
                value={form.commission_plan_id}
                onChange={e => setForm(f => ({ ...f, commission_plan_id: e.target.value }))}
                style={inp}
              >
                <option value="">Default (15% direct)</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </FormRow>

            <FormRow label="Payout method">
              <select
                value={form.payout_method}
                onChange={e => setForm(f => ({ ...f, payout_method: e.target.value }))}
                style={inp}
              >
                <option value="MANUAL">Manual</option>
                <option value="BANK_TRANSFER">Bank transfer</option>
                <option value="TOYYIBPAY">ToyyibPay</option>
              </select>
            </FormRow>

            {formError && (
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => { setShowCreate(false); resetForm() }} style={btnSecondary}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{ ...btnPrimary, opacity: creating ? 0.6 : 1 }}
              >
                {creating ? 'Registering…' : 'Register partner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Suspend confirm ── */}
      {actionTarget && actionType === 'SUSPEND' && (
        <ConfirmActionModal
          title={`Suspend ${actionTarget.name}`}
          description="This partner will be suspended. No new commission entries will be created while suspended. Existing approved entries are unaffected."
          confirmLabel="Suspend"
          confirmVariant="danger"
          requireReason
          reasonLabel="Reason for suspension"
          loading={actionLoading}
          onConfirm={() => void handleStatusChange(actionTarget, 'SUSPENDED')}
          onCancel={() => { setActionTarget(null); setActionType(null) }}
        />
      )}

      {/* ── Terminate confirm ── */}
      {actionTarget && actionType === 'TERMINATE' && (
        <ConfirmActionModal
          title={`Terminate ${actionTarget.name}`}
          description="Termination is permanent. No commission will be generated. Resolve any pending ledger entries before terminating. This cannot be undone."
          confirmLabel="Terminate permanently"
          confirmVariant="danger"
          requireReason
          reasonLabel="Reason for termination"
          loading={actionLoading}
          onConfirm={() => void handleStatusChange(actionTarget, 'TERMINATED')}
          onCancel={() => { setActionTarget(null); setActionType(null) }}
        />
      )}

      {/* ── Reactivate confirm ── */}
      {actionTarget && actionType === 'REACTIVATE' && (
        <ConfirmActionModal
          title={`Reactivate ${actionTarget.name}`}
          description="This partner will be set back to ACTIVE. Commission will resume on the next paid invoice."
          confirmLabel="Reactivate"
          confirmVariant="primary"
          loading={actionLoading}
          onConfirm={() => void handleStatusChange(actionTarget, 'ACTIVE')}
          onCancel={() => { setActionTarget(null); setActionType(null) }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ActionsMenu({
  partner,
  onSuspend,
  onTerminate,
  onReactivate,
}: {
  partner: Partner
  onSuspend: () => void
  onTerminate: () => void
  onReactivate: () => void
}) {
  const [open, setOpen] = useState(false)
  const status = partner.partner_status ?? 'ACTIVE'

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '5px', padding: '4px 10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}
      >
        ···
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: '4px', zIndex: 50, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: '180px', overflow: 'hidden' }}>
            {status === 'ACTIVE' && (
              <MenuItem label="Suspend" danger onClick={() => { setOpen(false); onSuspend() }} />
            )}
            {(status === 'SUSPENDED') && (
              <MenuItem label="Reactivate" onClick={() => { setOpen(false); onReactivate() }} />
            )}
            {status !== 'TERMINATED' && (
              <MenuItem label="Terminate" danger onClick={() => { setOpen(false); onTerminate() }} />
            )}
            <MenuItem
              label="View assignments"
              onClick={() => { setOpen(false); window.location.href = `/referrals/attributions?partner_org_id=${partner.id}` }}
            />
            <MenuItem
              label="View ledger"
              onClick={() => { setOpen(false); window.location.href = `/referrals/ledger?partner_org_id=${partner.id}` }}
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
      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', fontSize: '13px', cursor: 'pointer', color: danger ? '#dc2626' : '#374151' }}
    >
      {label}
    </button>
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

// ---------------------------------------------------------------------------
// Style tokens
// ---------------------------------------------------------------------------

const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }

const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '8px 10px',
  border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px',
  color: '#111827', background: '#fff', fontFamily: 'inherit',
}

const btnPrimary: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '7px', fontSize: '14px',
  fontWeight: 500, border: 'none', background: '#4f46e5',
  color: '#fff', cursor: 'pointer',
}

const btnSecondary: React.CSSProperties = {
  padding: '9px 18px', borderRadius: '7px', fontSize: '14px',
  fontWeight: 500, border: '1px solid #d1d5db', background: '#fff',
  color: '#374151', cursor: 'pointer',
}

const pbtn = (disabled: boolean): React.CSSProperties => ({
  padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb',
  background: disabled ? '#f9fafb' : '#fff',
  color: disabled ? '#d1d5db' : '#374151',
  fontSize: '13px', cursor: disabled ? 'not-allowed' : 'pointer',
})
