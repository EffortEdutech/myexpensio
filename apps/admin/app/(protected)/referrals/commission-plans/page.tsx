'use client'
/**
 * apps/admin/app/(protected)/referrals/commission-plans/page.tsx
 *
 * Commission Plans management — create, edit, deactivate plans,
 * and see which partner orgs are on each plan.
 */
import { useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommissionPlan = {
  id: string
  code: string
  name: string
  status: string
  rules: Record<string, unknown>
  is_platform_default: boolean
  partner_count: number
  direct_rate_pct: number
  basis: string
  trigger: string
  eligible_months: number
  created_at: string
  updated_at: string
}

type PartnerRef = {
  id: string
  name: string
  partner_code: string | null
  partner_status: string | null
}

type PlanDetail = {
  plan: CommissionPlan
  partners: PartnerRef[]
  default_partners: PartnerRef[]
}

type FormState = {
  name: string
  code: string
  direct_rate_pct: string
  basis: string
  trigger: string
  eligible_months: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const EMPTY_FORM: FormState = {
  name: '', code: '', direct_rate_pct: '15',
  basis: 'NET_PAID', trigger: 'INVOICE_PAID', eligible_months: '12',
}

function fmtDate(iso: string) {
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

export default function CommissionPlansPage() {
  const [plans, setPlans]         = useState<CommissionPlan[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Detail drawer
  const [detail, setDetail]       = useState<PlanDetail | null>(null)
  const [detailLoading, setDL]    = useState(false)

  // Create / Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editPlan, setEditPlan]   = useState<CommissionPlan | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)

  // Deactivate confirm
  const [deactivateTarget, setDeactivateTarget] = useState<CommissionPlan | null>(null)
  const [deactivating, setDeactivating]         = useState(false)

  const [toast, setToast] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  async function load() {
    setLoading(true); setError(null)
    try {
      const data = await apiFetch<{ items: CommissionPlan[] }>(
        '/api/admin/billing/commission-plans'
      )
      setPlans(data.items ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function loadDetail(plan: CommissionPlan) {
    setDL(true); setDetail(null)
    try {
      const data = await apiFetch<PlanDetail>(
        `/api/admin/billing/commission-plans/${plan.id}`
      )
      setDetail(data)
    } catch { /* non-fatal */ }
    finally { setDL(false) }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  function openCreate() {
    setEditPlan(null)
    setForm(EMPTY_FORM)
    setFormError(null)
    setShowModal(true)
  }

  function openEdit(plan: CommissionPlan) {
    setEditPlan(plan)
    setForm({
      name:            plan.name,
      code:            plan.code,
      direct_rate_pct: String(plan.direct_rate_pct),
      basis:           plan.basis,
      trigger:         plan.trigger,
      eligible_months: String(plan.eligible_months),
    })
    setFormError(null)
    setShowModal(true)
  }

  async function handleSave() {
    setFormError(null)
    const name = form.name.trim()
    const code = form.code.trim().toUpperCase()
    const ratePct = parseFloat(form.direct_rate_pct)

    if (!name) { setFormError('Name is required.'); return }
    if (!editPlan && !code) { setFormError('Code is required.'); return }
    if (isNaN(ratePct) || ratePct <= 0 || ratePct > 100) {
      setFormError('Rate must be between 0 and 100.')
      return
    }

    setSaving(true)
    try {
      if (editPlan) {
        await apiFetch(`/api/admin/billing/commission-plans/${editPlan.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            direct_rate_pct: ratePct,
            basis:           form.basis,
            trigger:         form.trigger,
            eligible_months: parseInt(form.eligible_months, 10),
          }),
        })
        showToast(`Plan "${name}" updated.`)
      } else {
        await apiFetch('/api/admin/billing/commission-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            name,
            direct_rate_pct: ratePct,
            basis:           form.basis,
            trigger:         form.trigger,
            eligible_months: parseInt(form.eligible_months, 10),
          }),
        })
        showToast(`Plan "${name}" created.`)
      }
      setShowModal(false)
      void load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Save failed.')
    } finally { setSaving(false) }
  }

  async function handleDeactivate(plan: CommissionPlan) {
    setDeactivating(true)
    try {
      await apiFetch(`/api/admin/billing/commission-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      })
      showToast(`Plan "${plan.name}" deactivated.`)
      setDeactivateTarget(null)
      if (detail?.plan.id === plan.id) setDetail(null)
      void load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Deactivate failed.')
    } finally { setDeactivating(false) }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>

      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, background: '#111827', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontSize: '14px' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>
            Commission plans
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
            Define the revenue-share rates that partner orgs earn from their subscriptions.
            Each partner org can be assigned a specific plan, or uses the platform default.
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>+ New plan</button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Main layout — table left, detail drawer right */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>

        {/* Plans table */}
        <div style={{ flex: 1, minWidth: 0, border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb' }}>
              <tr>
                {['Plan', 'Code', 'Rate', 'Basis', 'Status', 'Partners', 'Updated', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
              ) : plans.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                  No plans yet.{' '}
                  <button onClick={openCreate} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Create one →</button>
                </td></tr>
              ) : plans.map(plan => {
                const isSelected = detail?.plan.id === plan.id
                return (
                  <tr
                    key={plan.id}
                    style={{ borderTop: '1px solid #f3f4f6', background: isSelected ? '#f0f4ff' : undefined, cursor: 'pointer' }}
                    onClick={() => { void loadDetail(plan) }}
                  >
                    <td style={td}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{plan.name}</div>
                      {plan.is_platform_default && (
                        <div style={{ fontSize: '11px', color: '#4f46e5', fontWeight: 500, marginTop: '2px' }}>Platform default</div>
                      )}
                    </td>
                    <td style={td}>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f3f4f6', padding: '2px 7px', borderRadius: '4px', color: '#374151' }}>
                        {plan.code}
                      </span>
                    </td>
                    <td style={{ ...td, fontSize: '15px', fontWeight: 700, color: '#059669' }}>
                      {plan.direct_rate_pct}%
                    </td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{plan.basis}</td>
                    <td style={td}><StatusChip status={plan.status} size="sm" /></td>
                    <td style={{ ...td, fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                      {plan.partner_count}
                    </td>
                    <td style={{ ...td, fontSize: '12px', color: '#9ca3af' }}>{fmtDate(plan.updated_at)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                        <SmallBtn label="Edit" onClick={() => openEdit(plan)} />
                        {plan.status === 'ACTIVE' && !plan.is_platform_default && (
                          <SmallBtn label="Deactivate" danger onClick={() => setDeactivateTarget(plan)} />
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {(detail || detailLoading) && (
          <div style={{ width: '320px', flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', padding: '20px' }}>
            {detailLoading ? (
              <p style={{ color: '#9ca3af', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>Loading…</p>
            ) : detail && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>{detail.plan.name}</h3>
                  <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                </div>

                {/* Rules summary */}
                <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
                  <RuleRow label="Rate" value={`${detail.plan.direct_rate_pct}% of invoice`} accent />
                  <RuleRow label="Basis" value={detail.plan.basis} />
                  <RuleRow label="Trigger" value={detail.plan.trigger} />
                  <RuleRow label="Eligible months" value={`${detail.plan.eligible_months} months`} />
                </div>

                {/* Partners on this plan */}
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Partners on this plan ({detail.partners.length + detail.default_partners.length})
                </p>

                {detail.partners.length === 0 && detail.default_partners.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No partners assigned.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
                    {[...detail.partners, ...detail.default_partners].map(p => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderRadius: '6px', background: '#f9fafb' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{p.name}</div>
                          {p.partner_code && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9ca3af' }}>{p.partner_code}</div>}
                        </div>
                        <StatusChip status={p.partner_status ?? 'ACTIVE'} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit modal ── */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>
                {editPlan ? `Edit — ${editPlan.name}` : 'New commission plan'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {!editPlan && (
              <FormRow label="Plan code *">
                <input
                  placeholder="e.g. DIRECT_20 (auto-uppercased)"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  style={inp}
                />
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>Unique. Cannot be changed after creation.</p>
              </FormRow>
            )}

            <FormRow label="Plan name *">
              <input
                placeholder="e.g. Direct 20% — Gold Partners"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={inp}
              />
            </FormRow>

            <FormRow label="Commission rate (%) *">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={form.direct_rate_pct}
                  onChange={e => setForm(f => ({ ...f, direct_rate_pct: e.target.value }))}
                  style={{ ...inp, maxWidth: '100px' }}
                />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>% of net paid invoice amount</span>
              </div>
            </FormRow>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <FormRow label="Basis">
                <select value={form.basis} onChange={e => setForm(f => ({ ...f, basis: e.target.value }))} style={inp}>
                  <option value="NET_PAID">Net paid</option>
                  <option value="GROSS_INVOICE">Gross invoice</option>
                </select>
              </FormRow>
              <FormRow label="Eligible months">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={form.eligible_months}
                  onChange={e => setForm(f => ({ ...f, eligible_months: e.target.value }))}
                  style={inp}
                />
              </FormRow>
            </div>

            {formError && (
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowModal(false)} style={btnSecondary}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : editPlan ? 'Save changes' : 'Create plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivate confirm ── */}
      {deactivateTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '420px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h2 style={{ margin: '0 0 10px', fontSize: '17px', fontWeight: 600, color: '#111827' }}>
              Deactivate &ldquo;{deactivateTarget.name}&rdquo;?
            </h2>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#6b7280', lineHeight: 1.6 }}>
              Deactivated plans cannot be assigned to new partners. Existing partner assignments are unaffected — they continue using this plan until manually changed.
            </p>
            {deactivateTarget.partner_count > 0 && (
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#fffbeb', color: '#92400e', fontSize: '13px', marginBottom: '12px' }}>
                ⚠️ {deactivateTarget.partner_count} partner(s) currently use this plan.
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setDeactivateTarget(null)} style={btnSecondary}>Cancel</button>
              <button onClick={() => void handleDeactivate(deactivateTarget)} disabled={deactivating} style={{ ...btnDanger, opacity: deactivating ? 0.6 : 1 }}>
                {deactivating ? 'Deactivating…' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RuleRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
      <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: accent ? 700 : 500, color: accent ? '#059669' : '#111827' }}>
        {value}
      </span>
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

function SmallBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer',
        border: `1px solid ${danger ? '#fca5a5' : '#e5e7eb'}`,
        background: danger ? '#fef2f2' : '#fff',
        color: danger ? '#dc2626' : '#374151',
      }}
    >
      {label}
    </button>
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

const btnDanger: React.CSSProperties = {
  padding: '9px 18px', borderRadius: '7px', fontSize: '14px',
  fontWeight: 500, border: 'none', background: '#dc2626',
  color: '#fff', cursor: 'pointer',
}
