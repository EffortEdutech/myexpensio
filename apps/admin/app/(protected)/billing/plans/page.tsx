'use client'
/**
 * apps/admin/app/(protected)/billing/plans/page.tsx
 *
 * Plans & Pricing — two-tab page:
 *   Tab 1: Plans   — edit entitlements, name, description per plan
 *   Tab 2: Prices  — Stripe/ToyyibPay price mappings for each plan
 *
 * Replaces the previous read-only plans page.
 */

import { useCallback, useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell from '@/components/billing/MoneyCell'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Plan = {
  id: string; code: string; name: string; tier: string
  interval: string | null; is_active: boolean; sort_order: number
  description: string | null
  entitlements: {
    routeCalculationsPerMonth?: number | null
    tripsPerMonth?:             number | null
    exportsPerMonth?:           number | null
  } | null
  updated_at: string
}

type Price = {
  id: string; plan_id: string; plan_code: string | null; plan_name: string | null
  plan_tier: string | null; provider: string
  provider_product_id: string | null; provider_price_id: string | null
  currency: string; amount: number; interval: string | null
  is_active: boolean; is_default: boolean; updated_at: string
}

type PlanFormState = {
  name: string; description: string; sort_order: string
  routes: string; trips: string; exports_: string
}

type PriceFormState = {
  plan_id: string; provider: string; provider_product_id: string
  provider_price_id: string; amount: string; interval: string; is_default: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function limitDisplay(v: number | null | undefined) {
  return v === null || v === undefined ? '∞ unlimited' : String(v)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(url, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
  return data as T
}

const EMPTY_PRICE_FORM: PriceFormState = {
  plan_id: '', provider: 'STRIPE', provider_product_id: '',
  provider_price_id: '', amount: '', interval: 'MONTH', is_default: true,
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PlansAndPricingPage() {
  const [tab, setTab]         = useState<'plans' | 'prices'>('plans')
  const [plans, setPlans]     = useState<Plan[]>([])
  const [prices, setPrices]   = useState<Price[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [toast, setToast]     = useState<string | null>(null)

  // Plan edit state
  const [editPlan, setEditPlan]     = useState<Plan | null>(null)
  const [planForm, setPlanForm]     = useState<PlanFormState | null>(null)
  const [savingPlan, setSavingPlan] = useState(false)
  const [planErr, setPlanErr]       = useState<string | null>(null)

  // Price form state
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [editPrice, setEditPrice]           = useState<Price | null>(null)
  const [priceForm, setPriceForm]           = useState<PriceFormState>(EMPTY_PRICE_FORM)
  const [savingPrice, setSavingPrice]       = useState(false)
  const [priceErr, setPriceErr]             = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  const loadPlans = useCallback(async () => {
    const data = await apiFetch<{ items: Plan[] }>('/api/admin/billing/plans?page_size=50')
    setPlans(data.items ?? [])
  }, [])

  const loadPrices = useCallback(async () => {
    const data = await apiFetch<{ items: Price[] }>('/api/admin/billing/prices')
    setPrices(data.items ?? [])
  }, [])

  useEffect(() => {
    setLoading(true); setError(null)
    Promise.all([loadPlans(), loadPrices()])
      .catch(e => setError(e instanceof Error ? e.message : 'Load failed'))
      .finally(() => setLoading(false))
  }, [loadPlans, loadPrices])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3500) }

  // ---------------------------------------------------------------------------
  // Plan actions
  // ---------------------------------------------------------------------------

  function openEditPlan(plan: Plan) {
    setEditPlan(plan)
    const e = plan.entitlements
    setPlanForm({
      name:        plan.name,
      description: plan.description ?? '',
      sort_order:  String(plan.sort_order),
      routes:      e?.routeCalculationsPerMonth == null ? '' : String(e.routeCalculationsPerMonth),
      trips:       e?.tripsPerMonth             == null ? '' : String(e.tripsPerMonth),
      exports_:    e?.exportsPerMonth           == null ? '' : String(e.exportsPerMonth),
    })
    setPlanErr(null)
  }

  function closePlanEdit() { setEditPlan(null); setPlanForm(null) }

  async function savePlan() {
    if (!editPlan || !planForm) return
    setSavingPlan(true); setPlanErr(null)
    try {
      // empty string = null = unlimited
      const toLimit = (v: string) => v.trim() === '' ? null : parseInt(v, 10)
      await apiFetch(`/api/admin/billing/plans/${editPlan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:        planForm.name.trim(),
          description: planForm.description.trim() || null,
          sort_order:  parseInt(planForm.sort_order, 10) || editPlan.sort_order,
          entitlements: {
            routeCalculationsPerMonth: toLimit(planForm.routes),
            tripsPerMonth:             toLimit(planForm.trips),
            exportsPerMonth:           toLimit(planForm.exports_),
          },
        }),
      })
      showToast(`Plan "${planForm.name}" saved.`)
      closePlanEdit()
      await loadPlans()
    } catch (e) { setPlanErr(e instanceof Error ? e.message : 'Save failed.') }
    finally { setSavingPlan(false) }
  }

  async function togglePlan(plan: Plan) {
    try {
      await apiFetch('/api/admin/billing/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
      })
      await loadPlans()
    } catch { alert('Toggle failed.') }
  }

  // ---------------------------------------------------------------------------
  // Price actions
  // ---------------------------------------------------------------------------

  function openNewPrice() {
    setEditPrice(null)
    setPriceForm({ ...EMPTY_PRICE_FORM, plan_id: plans[0]?.id ?? '' })
    setPriceErr(null)
    setShowPriceModal(true)
  }

  function openEditPrice(price: Price) {
    setEditPrice(price)
    setPriceForm({
      plan_id:             price.plan_id,
      provider:            price.provider,
      provider_product_id: price.provider_product_id ?? '',
      provider_price_id:   price.provider_price_id   ?? '',
      amount:              String(price.amount),
      interval:            price.interval             ?? 'MONTH',
      is_default:          price.is_default,
    })
    setPriceErr(null)
    setShowPriceModal(true)
  }

  async function savePrice() {
    setPriceErr(null)
    if (!priceForm.plan_id) { setPriceErr('Select a plan.'); return }
    const amount = parseFloat(priceForm.amount)
    if (isNaN(amount) || amount < 0) { setPriceErr('Enter a valid amount.'); return }

    setSavingPrice(true)
    try {
      if (editPrice) {
        await apiFetch(`/api/admin/billing/prices/${editPrice.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider_product_id: priceForm.provider_product_id.trim() || null,
            provider_price_id:   priceForm.provider_price_id.trim()   || null,
            amount,
            is_default: priceForm.is_default,
          }),
        })
        showToast('Price mapping updated.')
      } else {
        await apiFetch('/api/admin/billing/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan_id:             priceForm.plan_id,
            provider:            priceForm.provider,
            provider_product_id: priceForm.provider_product_id.trim() || null,
            provider_price_id:   priceForm.provider_price_id.trim()   || null,
            currency:            'MYR',
            amount,
            interval:            priceForm.interval || null,
            is_default:          priceForm.is_default,
          }),
        })
        showToast('Price mapping created.')
      }
      setShowPriceModal(false)
      await loadPrices()
    } catch (e) { setPriceErr(e instanceof Error ? e.message : 'Save failed.') }
    finally { setSavingPrice(false) }
  }

  async function deactivatePrice(price: Price) {
    if (!confirm(`Deactivate this ${price.provider} price mapping for ${price.plan_name ?? price.plan_id}?`)) return
    try {
      await apiFetch(`/api/admin/billing/prices/${price.id}`, { method: 'DELETE' })
      showToast('Price mapping deactivated.')
      await loadPrices()
    } catch { alert('Failed to deactivate.') }
  }

  async function setDefault(price: Price) {
    try {
      await apiFetch(`/api/admin/billing/prices/${price.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })
      showToast('Default updated.')
      await loadPrices()
    } catch { alert('Failed.') }
  }

  // stripe prices only — for checkout warning
  const stripeActivePrices = prices.filter(p => p.provider === 'STRIPE' && p.is_active)
  const hasStripeDefault   = stripeActivePrices.some(p => p.is_default)

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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Plans & Pricing</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Manage plan entitlements and map them to Stripe price IDs for checkout.
        </p>
      </div>

      {/* Stripe warning banner — only shows if no Stripe default price exists */}
      {!loading && !hasStripeDefault && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#92400e' }}>
              No Stripe price mapping configured
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#92400e' }}>
              Checkout will fail until at least one active Stripe price is set as default.
              Go to the <button onClick={() => setTab('prices')} style={{ color: '#92400e', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Prices tab</button> and add a mapping.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px' }}>
        {(['plans', 'prices'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 20px', fontSize: '14px', fontWeight: 500, border: 'none',
              background: 'none', cursor: 'pointer',
              color: tab === t ? '#4f46e5' : '#6b7280',
              borderBottom: tab === t ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t === 'plans' ? 'Plans' : 'Price mappings'}
            {t === 'prices' && (
              <span style={{ marginLeft: '6px', background: stripeActivePrices.length > 0 ? '#d1fae5' : '#fee2e2', color: stripeActivePrices.length > 0 ? '#065f46' : '#991b1b', fontSize: '11px', fontWeight: 600, padding: '1px 6px', borderRadius: '10px' }}>
                {stripeActivePrices.length} Stripe
              </span>
            )}
          </button>
        ))}
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</div>}

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Table */}
          <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  {['Sort', 'Code', 'Plan', 'Tier', 'Interval', 'Routes / mo', 'Trips / mo', 'Exports / mo', 'Active', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
                ) : plans.map(plan => {
                  const isEditing = editPlan?.id === plan.id
                  return (
                    <tr key={plan.id} style={{ borderTop: '1px solid #f3f4f6', background: isEditing ? '#f0f4ff' : undefined }}>
                      <td style={td}><span style={{ color: '#9ca3af', fontSize: '12px' }}>{plan.sort_order}</span></td>
                      <td style={td}><span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#374151', background: '#f3f4f6', padding: '1px 6px', borderRadius: '3px' }}>{plan.code}</span></td>
                      <td style={td}><span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{plan.name}</span></td>
                      <td style={td}><StatusChip status={plan.tier} size="sm" /></td>
                      <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{plan.interval ?? '—'}</td>
                      <td style={{ ...td, fontSize: '13px', color: plan.entitlements?.routeCalculationsPerMonth == null ? '#059669' : '#374151' }}>
                        {limitDisplay(plan.entitlements?.routeCalculationsPerMonth)}
                      </td>
                      <td style={{ ...td, fontSize: '13px', color: plan.entitlements?.tripsPerMonth == null ? '#059669' : '#374151' }}>
                        {limitDisplay(plan.entitlements?.tripsPerMonth)}
                      </td>
                      <td style={{ ...td, fontSize: '13px', color: plan.entitlements?.exportsPerMonth == null ? '#059669' : '#374151' }}>
                        {limitDisplay(plan.entitlements?.exportsPerMonth)}
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: '12px', fontWeight: 500, color: plan.is_active ? '#059669' : '#9ca3af' }}>
                          {plan.is_active ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td style={td}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <SmallBtn label={isEditing ? 'Close' : 'Edit'} onClick={() => isEditing ? closePlanEdit() : openEditPlan(plan)} />
                          <SmallBtn label={plan.is_active ? 'Deactivate' : 'Activate'} onClick={() => void togglePlan(plan)} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Edit panel */}
          {editPlan && planForm && (
            <div style={{ width: '300px', flexShrink: 0, border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>Edit — {editPlan.code}</h3>
                <button onClick={closePlanEdit} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
              </div>

              <FormRow label="Name">
                <input value={planForm.name} onChange={e => setPlanForm(f => f ? { ...f, name: e.target.value } : f)} style={inp} />
              </FormRow>
              <FormRow label="Description">
                <textarea value={planForm.description} onChange={e => setPlanForm(f => f ? { ...f, description: e.target.value } : f)} rows={2} style={{ ...inp, resize: 'vertical' }} />
              </FormRow>
              <FormRow label="Sort order">
                <input type="number" value={planForm.sort_order} onChange={e => setPlanForm(f => f ? { ...f, sort_order: e.target.value } : f)} style={{ ...inp, maxWidth: '80px' }} />
              </FormRow>

              <p style={{ margin: '16px 0 8px', fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Entitlements (leave blank = unlimited)
              </p>

              <FormRow label="Route calculations / month">
                <input type="number" min="0" placeholder="blank = ∞" value={planForm.routes} onChange={e => setPlanForm(f => f ? { ...f, routes: e.target.value } : f)} style={{ ...inp, maxWidth: '120px' }} />
              </FormRow>
              <FormRow label="Trips / month">
                <input type="number" min="0" placeholder="blank = ∞" value={planForm.trips} onChange={e => setPlanForm(f => f ? { ...f, trips: e.target.value } : f)} style={{ ...inp, maxWidth: '120px' }} />
              </FormRow>
              <FormRow label="Exports / month">
                <input type="number" min="0" placeholder="blank = ∞" value={planForm.exports_} onChange={e => setPlanForm(f => f ? { ...f, exports_: e.target.value } : f)} style={{ ...inp, maxWidth: '120px' }} />
              </FormRow>

              {planErr && <div style={{ padding: '8px 10px', borderRadius: '5px', background: '#fef2f2', color: '#dc2626', fontSize: '12px', marginBottom: '10px' }}>{planErr}</div>}

              <button onClick={() => void savePlan()} disabled={savingPlan} style={{ ...btnPrimary, width: '100%', opacity: savingPlan ? 0.6 : 1 }}>
                {savingPlan ? 'Saving…' : 'Save plan'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Prices tab ── */}
      {tab === 'prices' && (
        <>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              Map each billing plan to a Stripe price ID. The checkout route uses these to create Stripe sessions.
            </p>
            <button onClick={openNewPrice} style={btnPrimary}>+ Add price mapping</button>
          </div>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  {['Plan', 'Provider', 'Stripe price ID', 'Amount (MYR)', 'Interval', 'Default', 'Active', 'Updated', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
                ) : prices.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No price mappings yet.{' '}
                    <button onClick={openNewPrice} style={{ color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>Add the first one →</button>
                  </td></tr>
                ) : prices.map(price => (
                  <tr key={price.id} style={{ borderTop: '1px solid #f3f4f6', opacity: price.is_active ? 1 : 0.5 }}>
                    <td style={td}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: '#111827' }}>{price.plan_name ?? price.plan_id.slice(0,8)}</span>
                      {price.plan_code && <span style={{ marginLeft: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#9ca3af' }}>{price.plan_code}</span>}
                    </td>
                    <td style={td}>
                      <span style={{ fontSize: '12px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: price.provider === 'STRIPE' ? '#ede9fe' : '#dbeafe', color: price.provider === 'STRIPE' ? '#5b21b6' : '#1e40af' }}>
                        {price.provider}
                      </span>
                    </td>
                    <td style={td}>
                      {price.provider_price_id
                        ? <code style={{ fontSize: '11px', color: '#374151', background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>{price.provider_price_id}</code>
                        : <span style={{ color: '#fca5a5', fontSize: '12px' }}>⚠ not set</span>}
                    </td>
                    <td style={td}><MoneyCell amount={price.amount} size="sm" /></td>
                    <td style={{ ...td, fontSize: '12px', color: '#6b7280' }}>{price.interval ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'center' }}>
                      {price.is_default
                        ? <span style={{ fontSize: '11px', fontWeight: 600, color: '#059669', background: '#d1fae5', padding: '2px 7px', borderRadius: '10px' }}>Default</span>
                        : <button onClick={() => void setDefault(price)} style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '2px 7px', cursor: 'pointer' }}>Set default</button>}
                    </td>
                    <td style={{ ...td, fontSize: '12px', fontWeight: 500, color: price.is_active ? '#059669' : '#9ca3af' }}>
                      {price.is_active ? 'Active' : 'Inactive'}
                    </td>
                    <td style={{ ...td, fontSize: '11px', color: '#9ca3af' }}>{fmtDate(price.updated_at)}</td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <SmallBtn label="Edit" onClick={() => openEditPrice(price)} />
                        {price.is_active && <SmallBtn label="Deactivate" danger onClick={() => void deactivatePrice(price)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Price modal ── */}
      {showPriceModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPriceModal(false) }}
        >
          <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#111827' }}>
                {editPrice ? 'Edit price mapping' : 'New price mapping'}
              </h2>
              <button onClick={() => setShowPriceModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>

            {!editPrice && (
              <>
                <FormRow label="Plan *">
                  <select value={priceForm.plan_id} onChange={e => setPriceForm(f => ({ ...f, plan_id: e.target.value }))} style={inp}>
                    <option value="">— Select plan —</option>
                    {plans.filter(p => p.tier !== 'FREE').map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                  <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>FREE plan does not require a payment mapping.</p>
                </FormRow>
                <FormRow label="Provider *">
                  <select value={priceForm.provider} onChange={e => setPriceForm(f => ({ ...f, provider: e.target.value }))} style={inp}>
                    <option value="STRIPE">Stripe</option>
                    <option value="TOYYIBPAY">ToyyibPay</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </FormRow>
                <FormRow label="Interval *">
                  <select value={priceForm.interval} onChange={e => setPriceForm(f => ({ ...f, interval: e.target.value }))} style={inp}>
                    <option value="MONTH">Monthly</option>
                    <option value="YEAR">Yearly</option>
                    <option value="LIFETIME">Lifetime</option>
                  </select>
                </FormRow>
              </>
            )}

            <FormRow label="Stripe price ID (price_xxx)">
              <input
                placeholder="price_1AbCdEfGhIjKlMnO"
                value={priceForm.provider_price_id}
                onChange={e => setPriceForm(f => ({ ...f, provider_price_id: e.target.value }))}
                style={inp}
              />
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                From Stripe Dashboard → Products → your product → price ID.
              </p>
            </FormRow>

            <FormRow label="Provider product ID (prod_xxx) — optional">
              <input
                placeholder="prod_1AbCdEfGhIjKlMnO"
                value={priceForm.provider_product_id}
                onChange={e => setPriceForm(f => ({ ...f, provider_product_id: e.target.value }))}
                style={inp}
              />
            </FormRow>

            <FormRow label="Amount (MYR) *">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>RM</span>
                <input
                  type="number" min="0" step="0.01" placeholder="29.00"
                  value={priceForm.amount}
                  onChange={e => setPriceForm(f => ({ ...f, amount: e.target.value }))}
                  style={{ ...inp, maxWidth: '120px' }}
                />
                <span style={{ fontSize: '13px', color: '#9ca3af' }}>
                  {priceForm.interval === 'MONTH' ? '/ month' : priceForm.interval === 'YEAR' ? '/ year' : ''}
                </span>
              </div>
            </FormRow>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox" id="is_default"
                checked={priceForm.is_default}
                onChange={e => setPriceForm(f => ({ ...f, is_default: e.target.checked }))}
                style={{ width: '16px', height: '16px' }}
              />
              <label htmlFor="is_default" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                Set as default for this plan + provider
              </label>
            </div>

            {priceErr && <div style={{ padding: '8px 10px', borderRadius: '5px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{priceErr}</div>}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowPriceModal(false)} style={btnSecondary}>Cancel</button>
              <button onClick={() => void savePrice()} disabled={savingPrice} style={{ ...btnPrimary, opacity: savingPrice ? 0.6 : 1 }}>
                {savingPrice ? 'Saving…' : editPrice ? 'Save changes' : 'Add mapping'}
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

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '5px' }}>{label}</label>
      {children}
    </div>
  )
}

function SmallBtn({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '4px 10px', borderRadius: '5px', fontSize: '12px', cursor: 'pointer', border: `1px solid ${danger ? '#fca5a5' : '#e5e7eb'}`, background: danger ? '#fef2f2' : '#fff', color: danger ? '#dc2626' : '#374151' }}>
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Style tokens
// ---------------------------------------------------------------------------

const td: React.CSSProperties = { padding: '10px 12px', verticalAlign: 'middle' }

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
