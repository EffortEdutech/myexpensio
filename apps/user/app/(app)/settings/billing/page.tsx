'use client'
/**
 * apps/user/app/(app)/settings/billing/page.tsx
 *
 * Payment & subscription management page.
 * Shows: plan comparison, upgrade flow, invoice history.
 * Links to Stripe Customer Portal for card/cancel management.
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
    invoice_number: string | null; invoice_url: string | null
    invoice_pdf_url: string | null; paid_at: string | null; created_at: string
  }>
}

type AvailablePlan = {
  plan: { id: string; code: string; name: string; tier: string; interval: string | null; description: string | null }
  price: { id: string; provider: string; provider_price_id: string | null; currency: string; amount: number; interval: string | null } | null
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
  const res = await fetch(url, init)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message ?? `HTTP ${res.status}`)
  return data as T
}

const FEATURES = [
  { label: 'Route calculations / month', free: '2', pro: 'Unlimited' },
  { label: 'Trips', free: 'Unlimited', pro: 'Unlimited' },
  { label: 'Exports', free: 'Unlimited', pro: 'Unlimited' },
  { label: 'Claims management', free: '✓', pro: '✓' },
  { label: 'TNG statement import', free: '✓', pro: '✓' },
  { label: 'Receipt scanning', free: '✓', pro: '✓' },
  { label: 'PDF exports', free: '✓', pro: '✓' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const [summary, setSummary]   = useState<BillingSummary | null>(null)
  const [plans, setPlans]       = useState<AvailablePlan[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [selected, setSelected] = useState<AvailablePlan | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [portalErr, setPortalErr] = useState<string | null>(null)

  // Check for Stripe return
  const checkoutResult = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('checkout')
    : null

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const summaryData = await apiFetch<BillingSummary>('/api/billing/summary')
        setSummary(summaryData)

        // Load both PRO plans
        const codes = ['PRO_MONTHLY', 'PRO_YEARLY']
        const results = await Promise.allSettled(
          codes.map((code) =>
            apiFetch<AvailablePlan>(`/api/billing/catalog?plan_code=${code}&provider=STRIPE`)
          )
        )
        const available = results
          .filter((r): r is PromiseFulfilledResult<AvailablePlan> => r.status === 'fulfilled')
          .map((r) => r.value)
        setPlans(available)
        if (available.length > 0) setSelected(available[0])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load billing info.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function handleUpgrade() {
    if (!selected) return
    setCheckingOut(true); setCheckoutErr(null)
    try {
      const origin = window.location.origin
      const data = await apiFetch<{ checkout_url: string }>('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_code:   selected.plan.code,
          provider:    'STRIPE',
          success_url: `${origin}/settings/billing?checkout=success`,
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
      const data = await apiFetch<{ url: string }>('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_url: `${origin}/settings/billing` }),
      })
      window.location.href = data.url
    } catch (e) {
      setPortalErr(e instanceof Error ? e.message : 'Could not open billing portal.')
      setOpeningPortal(false)
    }
  }

  const ss = summary?.subscription_status
  const live = summary?.live_subscription
  const isPro = ss?.tier === 'PRO'
  const invoices = summary?.invoices ?? []
  const noPrices = plans.every((p) => !p.price)

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
          ✓ Payment confirmed! Your plan will be upgraded shortly. Refresh in a moment if it hasn't updated.
        </div>
      )}
      {checkoutResult === 'cancel' && (
        <div style={banner('amber')}>
          Checkout was cancelled. Your plan has not changed.
        </div>
      )}

      {error && <div style={banner('red')}>{error}</div>}

      {/* ── Current plan (PRO only) ── */}
      {isPro && live && (
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6b7280', marginBottom: 4 }}>
                Current plan
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Pro plan</div>
              {ss?.plan_code && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{ss.plan_code.replace('_', ' ')}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{fmtMYR(live.amount)}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>/ {live.interval?.toLowerCase() ?? 'period'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Period start</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{fmtDate(live.current_period_start)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Next billing</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 2 }}>{fmtDate(live.current_period_end)}</div>
            </div>
            {ss?.billing_status && (
              <div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Status</div>
                <div style={{ marginTop: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: ss.billing_status === 'ACTIVE' ? '#d1fae5' : '#fef3c7', color: ss.billing_status === 'ACTIVE' ? '#065f46' : '#92400e' }}>
                    {ss.billing_status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {ss?.cancel_at_period_end && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef3c7', color: '#92400e', fontSize: 13 }}>
              ⚠️ Your subscription will cancel at the end of the current period ({fmtDate(live.current_period_end)}). You will not be charged again.
            </div>
          )}

          {/* Stripe portal — manage card/cancel */}
          <div style={{ marginTop: 14 }}>
            <button
              onClick={() => void handleOpenPortal()}
              disabled={openingPortal}
              style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, padding: '8px 14px', border: '1px solid #e0e7ff', borderRadius: 8, background: openingPortal ? '#f5f3ff' : '#f5f3ff', cursor: openingPortal ? 'wait' : 'pointer' }}
            >
              {openingPortal ? 'Opening portal…' : 'Manage card & subscription in Stripe →'}
            </button>
            {portalErr && (
              <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626' }}>{portalErr}</div>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
            Opens Stripe's secure portal to update payment method or cancel.
          </div>
        </div>
      )}

      {/* ── Plan comparison + upgrade (FREE users or plan change) ── */}
      {!isPro && (
        <div style={card}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
            Upgrade to Pro
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
            Remove limits and unlock full access.
          </div>

          {/* Feature comparison */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', background: '#f8fafc' }}>
              <div style={th}>Feature</div>
              <div style={{ ...th, textAlign: 'center' }}>Free</div>
              <div style={{ ...th, textAlign: 'center', color: '#4f46e5' }}>Pro</div>
            </div>
            {FEATURES.map((f, i) => (
              <div key={f.label} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9' }}>
                <div style={td_}>{f.label}</div>
                <div style={{ ...td_, textAlign: 'center', color: '#9ca3af' }}>{f.free}</div>
                <div style={{ ...td_, textAlign: 'center', color: '#059669', fontWeight: 600 }}>{f.pro}</div>
              </div>
            ))}
          </div>

          {/* Plan picker */}
          {noPrices ? (
            <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 8, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
              Pricing not yet configured. Please contact support.
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {plans.filter((p) => p.price).map((p) => (
                  <label
                    key={p.plan.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                      border: selected?.plan.id === p.plan.id ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      background: selected?.plan.id === p.plan.id ? '#f5f3ff' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input type="radio" name="plan" checked={selected?.plan.id === p.plan.id}
                        onChange={() => setSelected(p)} style={{ accentColor: '#4f46e5', width: 16, height: 16 }} />
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{p.plan.name}</div>
                        {p.plan.interval === 'YEAR' && (
                          <div style={{ fontSize: 12, color: '#059669', fontWeight: 500, marginTop: 2 }}>Save ~17% vs monthly</div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmtMYR(p.price!.amount)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>/ {p.plan.interval?.toLowerCase()}</div>
                    </div>
                  </label>
                ))}
              </div>

              {checkoutErr && (
                <div style={{ ...banner('red'), marginBottom: 12 }}>{checkoutErr}</div>
              )}

              <button
                onClick={() => void handleUpgrade()}
                disabled={checkingOut || !selected}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, fontSize: 15,
                  fontWeight: 700, border: 'none', cursor: checkingOut ? 'wait' : 'pointer',
                  background: checkingOut ? '#e5e7eb' : '#4f46e5',
                  color: checkingOut ? '#9ca3af' : '#fff',
                }}
              >
                {checkingOut ? 'Redirecting to Stripe…' : `Continue to payment →`}
              </button>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
                Secured by Stripe · Cancel anytime · MYR billing
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Invoice history ── */}
      {invoices.length > 0 && (
        <div style={{ ...card, marginTop: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>
            Invoice history
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                {['Date', 'Invoice', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} style={{ borderTop: '1px solid #f9fafb' }}>
                  <td style={inv_td}>{fmtDate(inv.paid_at ?? inv.created_at)}</td>
                  <td style={{ ...inv_td, fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                    {inv.invoice_number ?? '—'}
                  </td>
                  <td style={{ ...inv_td, fontWeight: 600, color: '#0f172a' }}>{fmtMYR(inv.amount_paid)}</td>
                  <td style={inv_td}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: inv.status === 'PAID' ? '#d1fae5' : '#fef3c7', color: inv.status === 'PAID' ? '#065f46' : '#92400e' }}>
                      {inv.status}
                    </span>
                  </td>
                  <td style={inv_td}>
                    {inv.invoice_url && (
                      <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#4f46e5', textDecoration: 'none', marginRight: 8 }}>
                        View
                      </a>
                    )}
                    {inv.invoice_pdf_url && (
                      <a href={inv.invoice_pdf_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#6b7280', textDecoration: 'none' }}>
                        PDF
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {invoices.length === 0 && isPro && (
        <div style={{ ...card, marginTop: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          No invoices yet.
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

const th: React.CSSProperties = {
  padding: '10px 12px', fontSize: 11, fontWeight: 600,
  color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
}

const td_: React.CSSProperties = {
  padding: '10px 12px', fontSize: 13, color: '#374151',
}

const inv_td: React.CSSProperties = {
  padding: '10px 8px', fontSize: 13, color: '#374151', verticalAlign: 'middle',
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
