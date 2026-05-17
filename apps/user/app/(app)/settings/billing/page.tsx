'use client'
/**
 * apps/user/app/(app)/settings/billing/page.tsx
 *
 * Payment & subscription management page.
 * Shows plan status, upgrade options, and Stripe portal link.
 *
 * 2026-05-15: Rewritten for unified subscriptions table (S14-CLEANUP).
 *             Removed billing_catalog dependency (table dropped).
 *             Plans hardcoded: FREE (trial) | PRO RM18/mo | PREMIUM RM29/mo
 */
import { useEffect, useState } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BillingSummary = {
  subscription: {
    tier: string
    status: string
    period_end: string | null
    billing_status: string | null   // legacy compat field
    cancel_at_period_end: boolean
  } | null
  tier: string
  is_unlimited: boolean
}

type PlanOption = {
  tier: 'PRO' | 'PREMIUM'
  name: string
  price: number       // MYR per month
  icon: string
  badge?: string
  description: string
  features: string[]
}

// ---------------------------------------------------------------------------
// Plan definitions (hardcoded — no catalog API needed)
// ---------------------------------------------------------------------------

const PLANS: PlanOption[] = [
  {
    tier:        'PRO',
    name:        'Pro',
    icon:        '🚀',
    price:       18,
    description: 'For solo professionals and freelancers.',
    features: [
      'Unlimited route calculations',
      'Unlimited trips & exports',
      'Full claims management',
      'TNG statement import',
      'Receipt scanning',
      'PDF exports',
    ],
  },
  {
    tier:        'PREMIUM',
    name:        'Premium',
    icon:        '💎',
    price:       29,
    badge:       'Best value',
    description: 'For business owners and self-employed.',
    features: [
      'Everything in Pro',
      'Business income & expense tracker',
      'Profit & Loss reports',
      'LHDN business tax summary',
      'Annual P&L PDF download',
      'Priority support',
    ],
  },
]

const FREE_FEATURES = [
  '2 route calculations / month',
  'Unlimited trips',
  'Exports not included',
  'Claims management',
  'TNG statement import',
  'Receipt scanning',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res  = await fetch(url, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? data?.error ?? `HTTP ${res.status}`)
  return data as T
}

function statusColor(status: string | null) {
  if (!status) return { bg: '#f1f5f9', text: '#64748b' }
  if (status === 'ACTIVE')    return { bg: '#d1fae5', text: '#065f46' }
  if (status === 'TRIALING')  return { bg: '#dbeafe', text: '#1e40af' }
  if (status === 'PAST_DUE')  return { bg: '#fef3c7', text: '#92400e' }
  if (status === 'CANCELLED') return { bg: '#fee2e2', text: '#991b1b' }
  return { bg: '#f1f5f9', text: '#64748b' }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [summary, setSummary]       = useState<BillingSummary | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [selected, setSelected]     = useState<PlanOption>(PLANS[0])
  const [checkingOut, setCheckingOut]     = useState(false)
  const [checkoutErr, setCheckoutErr]     = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [portalErr, setPortalErr]         = useState<string | null>(null)

  // Stripe return param
  const checkoutResult = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('checkout')
    : null

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await apiFetch<BillingSummary>('/api/billing/summary')
        setSummary(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load billing info.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function handleUpgrade() {
    setCheckingOut(true); setCheckoutErr(null)
    try {
      const origin = window.location.origin
      const data   = await apiFetch<{ checkout_url: string }>('/api/billing/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tier:        selected.tier,
          success_url: `${origin}/upgrade/success?tier=${selected.tier}`,
          cancel_url:  `${origin}/settings/billing?checkout=cancel`,
        }),
      })
      window.location.href = data.checkout_url
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : 'Checkout failed.')
      setCheckingOut(false)
    }
  }

  async function handleOpenPortal() {
    setOpeningPortal(true); setPortalErr(null)
    try {
      const origin = window.location.origin
      const data   = await apiFetch<{ portal_url: string }>('/api/billing/portal', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ return_url: `${origin}/settings/billing` }),
      })
      window.location.href = data.portal_url
    } catch (e) {
      setPortalErr(e instanceof Error ? e.message : 'Could not open billing portal.')
      setOpeningPortal(false)
    }
  }

  const sub        = summary?.subscription
  const tier       = summary?.tier ?? sub?.tier ?? 'FREE'
  const isPaid     = tier === 'PRO' || tier === 'PREMIUM'
  const subStatus  = sub?.status ?? null
  const periodEnd  = sub?.period_end ?? null
  const statusClr  = statusColor(subStatus)

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
        Loading billing…
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* Back link */}
      <a href="/settings" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        ← Back to Settings
      </a>

      <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
        Plans & Billing
      </h1>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748b' }}>
        Manage your myexpensio subscription.
      </p>

      {/* Checkout result banners */}
      {checkoutResult === 'success' && (
        <div style={banner('green')}>
          ✓ Payment confirmed! Your plan will be upgraded shortly. Refresh in a moment if it hasn&apos;t updated.
        </div>
      )}
      {checkoutResult === 'cancel' && (
        <div style={banner('amber')}>
          Checkout was cancelled. Your plan has not changed.
        </div>
      )}
      {error && <div style={banner('red')}>{error}</div>}

      {/* ── Current subscription (paid users) ── */}
      {isPaid && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 }}>
                Current plan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                {tier === 'PREMIUM' ? '💎 Premium' : '🚀 Pro'}
              </div>
            </div>
            {subStatus && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: statusClr.bg, color: statusClr.text }}>
                {subStatus}
              </span>
            )}
          </div>

          {periodEnd && (
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Next billing / period end</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{fmtDate(periodEnd)}</div>
              </div>
            </div>
          )}

          {sub?.cancel_at_period_end && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontSize: 13 }}>
              ⚠️ Your subscription will cancel at the end of the current period ({fmtDate(periodEnd)}). You will not be charged again.
            </div>
          )}

          {/* Stripe portal */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => void handleOpenPortal()}
              disabled={openingPortal}
              style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, padding: '9px 16px', border: '1px solid #e0e7ff', borderRadius: 8, background: '#f5f3ff', cursor: openingPortal ? 'wait' : 'pointer' }}
            >
              {openingPortal ? 'Opening portal…' : 'Manage card & subscription in Stripe →'}
            </button>
            {portalErr && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{portalErr}</div>}
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
              Opens Stripe&apos;s secure portal to update payment method, switch plans, or cancel.
            </div>
          </div>
        </div>
      )}

      {/* ── Current plan (FREE users) ── */}
      {!isPaid && (
        <div style={{ ...card, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 }}>
                Current plan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>🆓 Free</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Limited to 2 route calculations per month.</div>
            </div>
            {subStatus && (
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: statusClr.bg, color: statusClr.text }}>
                {subStatus}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Upgrade section (FREE users) ── */}
      {!isPaid && (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Compare plans
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Free is for trial use. Upgrade to Pro or Premium to export claims.
          </div>

          {/* Plan cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: 12, marginBottom: 20, overflowX: 'auto' }}>
            <div style={{ padding: 16, borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>🆓</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Free</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                RM0<span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>Trial plan with export locked.</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {FREE_FEATURES.map((f) => (
                  <li key={f} style={{ fontSize: 12, color: f === 'Exports not included' ? '#dc2626' : '#374151', display: 'flex', gap: 6 }}>
                    <span style={{ color: f === 'Exports not included' ? '#dc2626' : '#94a3b8', fontWeight: 700 }}>{f === 'Exports not included' ? '×' : '✓'}</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            {PLANS.map((plan) => {
              const isSelected = selected.tier === plan.tier
              return (
                <label
                  key={plan.tier}
                  style={{
                    padding:        '16px',
                    borderRadius:   12,
                    cursor:         'pointer',
                    border:         isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    background:     isSelected ? '#f5f3ff' : '#fff',
                    position:       'relative',
                    minWidth:       180,
                  }}
                >
                  <input type="radio" name="plan" checked={isSelected} onChange={() => setSelected(plan)} style={{ position: 'absolute', top: 14, right: 14, accentColor: '#4f46e5' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, paddingRight: 20 }}>
                    <span style={{ fontSize: 18 }}>{plan.icon}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{plan.name}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                    RM{plan.price}<span style={{ fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>/mo</span>
                  </div>
                  {plan.badge && (
                    <span style={{ display: 'inline-flex', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: '#d1fae5', color: '#065f46', marginBottom: 8 }}>
                      {plan.badge}
                    </span>
                  )}
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{plan.description}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ fontSize: 12, color: '#374151', display: 'flex', gap: 6 }}>
                        <span style={{ color: '#059669', fontWeight: 700 }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </label>
              )
            })}
          </div>

          {checkoutErr && (
            <div style={{ ...banner('red'), marginBottom: 12 }}>{checkoutErr}</div>
          )}

          <button
            onClick={() => void handleUpgrade()}
            disabled={checkingOut}
            style={{
              width:        '100%',
              padding:      '14px',
              borderRadius: 10,
              fontSize:     15,
              fontWeight:   700,
              border:       'none',
              cursor:       checkingOut ? 'wait' : 'pointer',
              background:   checkingOut ? '#e5e7eb' : '#4f46e5',
              color:        checkingOut ? '#9ca3af' : '#fff',
            }}
          >
            {checkingOut ? 'Redirecting to Stripe…' : `Continue to payment → RM${selected.price}/month`}
          </button>
          <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
            Secured by Stripe · Cancel anytime · MYR billing
          </div>
        </div>
      )}

      {/* ── Upgrade nudge for PRO users (show Premium option) ── */}
      {tier === 'PRO' && (
        <div style={{ ...card, marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>💎 Upgrade to Premium</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
            Unlock the business suite — income tracking, P&L reports, and LHDN tax summaries.
          </div>
          <button
            onClick={() => { setSelected(PLANS[1]); void handleUpgrade() }}
            disabled={checkingOut}
            style={{ fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 8, border: '2px solid #4f46e5', background: '#f5f3ff', color: '#4338ca', cursor: checkingOut ? 'wait' : 'pointer' }}
          >
            {checkingOut ? 'Redirecting…' : 'Upgrade to Premium — RM29/month →'}
          </button>
          {checkoutErr && <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{checkoutErr}</div>}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24,
}

function banner(color: 'green' | 'amber' | 'red'): React.CSSProperties {
  const map = {
    green: { bg: '#d1fae5', border: '#6ee7b7', text: '#065f46' },
    amber: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    red:   { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
  }
  const c = map[color]
  return {
    padding: '12px 16px', borderRadius: 10, marginBottom: 20,
    background: c.bg, border: `1px solid ${c.border}`, color: c.text,
    fontSize: 14, fontWeight: 500,
  }
}
