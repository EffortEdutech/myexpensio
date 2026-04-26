'use client'
// apps/admin/app/(protected)/billing/page.tsx
// Subscription status + usage overview. Read-only.
// Upgrades and changes are handled by the Console App (internal staff).

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type SubscriptionData = {
  org_id: string
  tier: 'FREE' | 'PRO'
  billing_status: string
  provider: string
  period_start: string | null
  period_end: string | null
  cancel_at_period_end: boolean
  grace_until: string | null
  last_invoice_at: string | null
}

type UsageData = {
  period_start: string
  routes_calls: number
  trips_created: number
  exports_created: number
}

type LimitsData = {
  routes_per_month: number | null
  trips_per_month: number | null
  exports_per_month: number | null
}

type BillingResponse = {
  subscription: SubscriptionData
  usage: UsageData
  limits: LimitsData
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const BILLING_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  INACTIVE:  { label: 'Free Plan', className: 'bg-gray-100 text-gray-600' },
  TRIALING:  { label: 'Trialing',  className: 'bg-purple-50 text-purple-700' },
  ACTIVE:    { label: 'Active',    className: 'bg-green-50 text-green-700' },
  PAST_DUE:  { label: 'Past Due',  className: 'bg-yellow-50 text-yellow-700' },
  UNPAID:    { label: 'Unpaid',    className: 'bg-red-50 text-red-700' },
  CANCELED:  { label: 'Canceled',  className: 'bg-red-50 text-red-600' },
  EXPIRED:   { label: 'Expired',   className: 'bg-gray-100 text-gray-500' },
}

// ── Usage bar ──────────────────────────────────────────────────────────────────

function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  const isUnlimited = limit === null
  const pct = isUnlimited ? 0 : Math.min(100, (used / Math.max(1, limit)) * 100)
  const isNearLimit = !isUnlimited && pct >= 80
  const isAtLimit   = !isUnlimited && used >= limit

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-gray-600">{label}</span>
        <span className={`text-sm font-medium tabular-nums ${isAtLimit ? 'text-red-600' : 'text-gray-900'}`}>
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className="h-full w-full bg-green-100 rounded-full" />
        ) : (
          <div
            className={`h-full rounded-full transition-all ${
              isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [data, setData] = useState<BillingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workspace/billing')
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(
            json?.error?.message ??
            (res.status === 400
              ? 'No workspace selected. Internal staff: append ?org_id=<uuid> to view a specific org.'
              : 'Failed to load billing information'),
          )
        }
        return res.json() as Promise<BillingResponse>
      })
      .then((json) => {
        // Defensive: ensure expected shape before setting
        if (!json?.subscription || !json?.usage || !json?.limits) {
          throw new Error('Unexpected response shape from billing API')
        }
        setData(json)
      })
      .catch((e: unknown) => {
        setErrorMsg(e instanceof Error ? e.message : 'Failed to load billing information')
      })
      .finally(() => setLoading(false))
  }, [])

  // ── Loading ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading billing…
      </div>
    )
  }

  // ── Error (including internal-staff no-org case) ──

  if (errorMsg || !data) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-sm text-red-700">
          {errorMsg ?? 'Failed to load billing information'}
        </div>
      </div>
    )
  }

  // ── Render ── (data is guaranteed non-null with correct shape here)

  const { subscription, usage, limits } = data
  const billingStatus = subscription.billing_status ?? 'INACTIVE'
  const statusCfg = BILLING_STATUS_CONFIG[billingStatus] ?? BILLING_STATUS_CONFIG.INACTIVE
  const isPro = subscription.tier === 'PRO'

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your subscription plan and usage this month.</p>
      </div>

      {/* Subscription card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                {isPro ? 'Pro Plan' : 'Free Plan'}
              </h2>
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.className}`}>
                {statusCfg.label}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isPro
                ? 'Unlimited route calculations, trips, and exports.'
                : 'Up to 2 route calculations per month. Contact support to upgrade.'}
            </p>
          </div>
          {!isPro && (
            <span className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg whitespace-nowrap">
              Contact us to upgrade →
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
          <div>
            <p className="text-xs text-gray-400">Plan period</p>
            <p className="text-sm text-gray-700 mt-0.5">
              {subscription.period_start
                ? `${formatDate(subscription.period_start)} – ${formatDate(subscription.period_end)}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Provider</p>
            <p className="text-sm text-gray-700 mt-0.5 capitalize">
              {subscription.provider?.toLowerCase() ?? '—'}
            </p>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="col-span-2">
              <p className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
                ⚠️ Subscription set to cancel at end of current period ({formatDate(subscription.period_end)})
              </p>
            </div>
          )}

          {subscription.grace_until && (
            <div className="col-span-2">
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                ⚠️ Payment issue — grace period until {formatDate(subscription.grace_until)}. Please contact support.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Usage this month</h2>
          <span className="text-xs text-gray-400">
            {new Date(usage.period_start + 'T00:00:00').toLocaleDateString('en-MY', {
              month: 'long', year: 'numeric',
            })}
          </span>
        </div>
        <div className="space-y-4">
          <UsageBar
            used={usage.routes_calls}
            limit={limits.routes_per_month}
            label="Route calculations"
          />
          <UsageBar
            used={usage.trips_created}
            limit={limits.trips_per_month}
            label="Trips created"
          />
          <UsageBar
            used={usage.exports_created}
            limit={limits.exports_per_month}
            label="Exports generated"
          />
        </div>

        {!isPro &&
          limits.routes_per_month !== null &&
          usage.routes_calls >= limits.routes_per_month && (
            <div className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Route calculation limit reached for this month. Users cannot calculate new routes. Contact support to upgrade.
            </div>
          )}
      </div>

      <p className="text-xs text-gray-400">
        Billing changes are managed by the platform team. Contact support if you need to upgrade or have billing questions.
      </p>
    </div>
  )
}
