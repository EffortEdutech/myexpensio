'use client'
/**
 * apps/user/app/(app)/settings/billing/page.tsx
 *
 * Billing settings — shows current plan, usage this month, invoice
 * history, and an upgrade flow that redirects to Stripe checkout.
 *
 * Calls:
 *   GET /api/billing/summary     — subscription status + invoices
 *   GET /api/billing/catalog     — available plans + prices
 *   POST /api/billing/checkout   — initiate Stripe checkout
 */

import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingSummary = {
  org: { org_id: string; org_name: string }
  subscription_status: {
    tier: string; billing_status: string | null; plan_code: string | null
    cancel_at_period_end: boolean; period_start: string | null
    period_end: string | null; last_invoice_at: string | null
  } | null
  live_subscription: {
    amount: number; currency: string; interval: string | null
    current_period_start: string | null; current_period_end: string | null
    cancel_at_period_end: boolean
  } | null
  invoices: Array<{
    id: string; status: string; amount_paid: number; currency: string
    invoice_number: string | null; invoice_url: string | null; paid_at: string | null
    created_at: string
  }>
}

type AvailablePlan = {
  plan: { id: string; code: string; name: string; tier: string; interval: string | null; description: string | null; entitlements: Record<string, unknown> | null }
  price: { id: string; provider: string; provider_price_id: string | null; currency: string; amount: number; interval: string | null } | null
}

type UsageCounters = {
  routes_calls: number
  trips_created: number
  exports_created: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMYR(amount: number) {
  return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(url, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
  return data as T
}

function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  const isUnlimited = limit === null
  const pct = isUnlimited ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100)
  const color = pct >= 90 ? '#dc2626' : pct >= 70 ? '#d97706' : '#4f46e5'

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: isUnlimited ? '#059669' : '#374151' }}>
          {isUnlimited ? `${used} / ∞ unlimited` : `${used} / ${limit}`}
        </span>
      </div>
      <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
        {!isUnlimited && (
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.3s ease' }} />
        )}
        {isUnlimited && (
          <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #d1fae5, #6ee7b7)', borderRadius: '3px' }} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingSettingsPage() {
  const [summary, setSummary]   = useState<BillingSummary | null>(null)
  const [usage, setUsage]       = useState<UsageCounters | null>(null)
  const [plans, setPlans]       = useState<AvailablePlan[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [showUpgrade, setShowUpgrade]     = useState(false)
  const [selectedPlan, setSelectedPlan]   = useState<AvailablePlan | null>(null)
  const [checkingOut, setCheckingOut]     = useState(false)
  const [checkoutErr, setCheckoutErr]     = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const [summaryData, usageData] = await Promise.all([
          apiFetch<BillingSummary>('/api/billing/summary'),
          apiFetch<{ counters: UsageCounters | null }>('/api/usage/current').catch(() => ({ counters: null })),
        ])
        setSummary(summaryData)
        setUsage(usageData.counters)

        // Load available PRO plans with Stripe prices
        const proPlanCodes = ['PRO_MONTHLY', 'PRO_YEARLY']
        const planResults = await Promise.allSettled(
          proPlanCodes.map(code =>
            apiFetch<AvailablePlan>(`/api/billing/catalog?plan_code=${code}&provider=STRIPE`)
          )
        )
        const available = planResults
          .filter((r): r is PromiseFulfilledResult<AvailablePlan> => r.status === 'fulfilled' && r.value.price !== null)
          .map(r => r.value)
        setPlans(available)
        if (available.length > 0) setSelectedPlan(available[0])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load billing info.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // ---------------------------------------------------------------------------
  // Checkout
  // ---------------------------------------------------------------------------

  async function handleUpgrade() {
    if (!selectedPlan?.plan?.code) return
    setCheckingOut(true); setCheckoutErr(null)
    try {
      const origin = window.location.origin
      const data = await apiFetch<{ checkout_url: string }>('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_code:   selectedPlan.plan.code,
          provider:    'STRIPE',
          success_url: `${origin}/settings/billing?checkout=success`,
          cancel_url:  `${origin}/settings/billing?checkout=cancel`,
        }),
      })
      // Redirect to Stripe checkout
      window.location.href = data.checkout_url
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : 'Checkout failed.')
      setCheckingOut(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const ss     = summary?.subscription_status
  const live   = summary?.live_subscription
  const isFree = !ss || ss.tier === 'FREE'
  const isPro  = ss?.tier === 'PRO'

  // Entitlement limits from the seeded billing_plans
  // FREE = 2 routes/month, PRO = unlimited
  const routeLimit = isFree ? 2 : null

  // Check URL for checkout result
  const checkoutResult = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('checkout')
    : null

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Loading billing information…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '32px', maxWidth: '700px' }}>
        <div style={{ padding: '14px 18px', borderRadius: '8px', background: '#fef2f2', color: '#dc2626', fontSize: '14px' }}>
          {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px', maxWidth: '700px' }}>

      {/* Checkout success / cancel banners */}
      {checkoutResult === 'success' && (
        <div style={{ padding: '14px 18px', borderRadius: '8px', background: '#d1fae5', color: '#065f46', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>
          ✓ Payment confirmed! Your plan will be upgraded shortly. Please refresh in a moment.
        </div>
      )}
      {checkoutResult === 'cancel' && (
        <div style={{ padding: '14px 18px', borderRadius: '8px', background: '#fef3c7', color: '#92400e', fontSize: '14px', marginBottom: '24px' }}>
          Checkout was cancelled. Your plan has not been changed.
        </div>
      )}

      {/* Current plan card */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>
              {isFree ? 'Free plan' : 'Pro plan'}
            </h2>
            {ss?.billing_status && ss.billing_status !== 'INACTIVE' && (
              <span style={{
                display: 'inline-block', marginTop: '4px', fontSize: '12px', fontWeight: 500,
                padding: '2px 8px', borderRadius: '4px',
                background: ss.billing_status === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                color:      ss.billing_status === 'ACTIVE' ? '#065f46' : '#92400e',
              }}>
                {ss.billing_status}
              </span>
            )}
          </div>

          {/* Price for Pro */}
          {isPro && live && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>
                {fmtMYR(live.amount)}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#6b7280' }}>
                per {live.interval?.toLowerCase() ?? 'period'}
              </p>
            </div>
          )}
        </div>

        {/* Period info */}
        {isPro && (ss?.period_start || ss?.period_end) && (
          <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Period start</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{fmtDate(ss.period_start)}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>Next billing date</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{fmtDate(ss.period_end)}</p>
            </div>
            {ss.cancel_at_period_end && (
              <div>
                <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>Cancels at period end</p>
              </div>
            )}
          </div>
        )}

        {/* Upgrade CTA for free users */}
        {isFree && (
          <div style={{ padding: '16px', borderRadius: '8px', background: '#f5f3ff', border: '1px solid #ede9fe' }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: '#4f46e5' }}>
              Upgrade to Pro
            </p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280' }}>
              Unlimited route calculations, trips, and exports. Cancel anytime.
            </p>
            <button
              onClick={() => setShowUpgrade(true)}
              style={{ padding: '9px 20px', borderRadius: '7px', fontSize: '14px', fontWeight: 500, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
            >
              See pricing →
            </button>
          </div>
        )}
      </div>

      {/* Usage this month */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px', background: '#fff' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
          Usage this month
        </h3>
        <UsageBar
          used={usage?.routes_calls ?? 0}
          limit={routeLimit}
          label="Route calculations"
        />
        <UsageBar
          used={usage?.trips_created ?? 0}
          limit={null}
          label="Trips created"
        />
        <UsageBar
          used={usage?.exports_created ?? 0}
          limit={null}
          label="Exports"
        />

        {isFree && (usage?.routes_calls ?? 0) >= 2 && (
          <div style={{ padding: '10px 14px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fecaca', marginTop: '8px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#dc2626', fontWeight: 500 }}>
              Route calculation limit reached for this month.{' '}
              <button onClick={() => setShowUpgrade(true)} style={{ color: '#dc2626', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                Upgrade to Pro
              </button>{' '}
              for unlimited calculations.
            </p>
          </div>
        )}
      </div>

      {/* Invoice history */}
      {(summary?.invoices ?? []).length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', background: '#fff' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#111827' }}>
            Invoice history
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Date', 'Invoice', 'Amount', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(summary?.invoices ?? []).map(inv => (
                <tr key={inv.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px', fontSize: '13px', color: '#6b7280' }}>{fmtDate(inv.paid_at ?? inv.created_at)}</td>
                  <td style={{ padding: '8px', fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{inv.invoice_number ?? '—'}</td>
                  <td style={{ padding: '8px', fontSize: '13px', fontWeight: 500, color: '#111827' }}>{fmtMYR(inv.amount_paid)}</td>
                  <td style={{ padding: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px', background: inv.status === 'PAID' ? '#d1fae5' : '#fef3c7', color: inv.status === 'PAID' ? '#065f46' : '#92400e' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#4f46e5', textDecoration: 'none' }}>
                        View →
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upgrade modal ── */}
      {showUpgrade && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false) }}
        >
          <div style={{ background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '32px', boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>Upgrade to Pro</h2>
              <button onClick={() => setShowUpgrade(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
              Unlimited route calculations, trips, and exports. Cancel anytime from your billing settings.
            </p>

            {plans.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af', fontSize: '14px', borderRadius: '8px', background: '#f9fafb' }}>
                No pricing plans available yet. Please contact support.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                {plans.map(p => (
                  <label
                    key={p.plan.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '16px 18px', borderRadius: '10px', cursor: 'pointer',
                      border: selectedPlan?.plan.id === p.plan.id ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                      background: selectedPlan?.plan.id === p.plan.id ? '#f5f3ff' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="radio"
                        name="plan_select"
                        checked={selectedPlan?.plan.id === p.plan.id}
                        onChange={() => setSelectedPlan(p)}
                        style={{ accentColor: '#4f46e5', width: '16px', height: '16px' }}
                      />
                      <div>
                        <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>{p.plan.name}</p>
                        {p.plan.interval === 'YEAR' && (
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#059669', fontWeight: 500 }}>Save ~17% vs monthly</p>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                        {fmtMYR(p.price?.amount ?? 0)}
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                        / {p.plan.interval?.toLowerCase() ?? 'period'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {checkoutErr && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
                {checkoutErr}
              </div>
            )}

            <button
              onClick={() => void handleUpgrade()}
              disabled={checkingOut || !selectedPlan || plans.length === 0}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px', fontSize: '15px',
                fontWeight: 600, border: 'none',
                background: checkingOut || !selectedPlan || plans.length === 0 ? '#e5e7eb' : '#4f46e5',
                color:      checkingOut || !selectedPlan || plans.length === 0 ? '#9ca3af' : '#fff',
                cursor:     checkingOut || !selectedPlan || plans.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {checkingOut ? 'Redirecting to Stripe…' : `Continue to payment →`}
            </button>

            <p style={{ margin: '12px 0 0', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
              Secured by Stripe. Cancel anytime. MYR billing.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
