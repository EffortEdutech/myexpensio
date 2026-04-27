'use client'
// apps/admin/app/(protected)/billing/page.tsx
//
// Billing & Subscription page — workspace-scoped.
// Internal staff see a workspace picker first, then the billing data.

import { useEffect, useState } from 'react'
import InternalOrgPicker from '@/components/InternalOrgPicker'

// ── Types ──────────────────────────────────────────────────────────────────────

type Subscription = {
  org_id:              string
  tier:                'FREE' | 'PRO'
  billing_status:      string
  provider:            string
  period_start:        string | null
  period_end:          string | null
  cancel_at_period_end: boolean
  grace_until:         string | null
  last_invoice_at:     string | null
}

type Usage = {
  period_start:    string
  routes_calls:    number
  trips_created:   number
  exports_created: number
}

type Limits = {
  routes_per_month:  number | null
  trips_per_month:   number | null
  exports_per_month: number | null
}

type BillingResponse = {
  subscription: Subscription
  usage:        Usage
  limits:       Limits
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const BILLING_STATUS_CONFIG: Record<string, { label: string; cls: string; desc: string }> = {
  INACTIVE: { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500',   desc: 'No active subscription' },
  TRIALING: { label: 'Trialing',  cls: 'bg-purple-50 text-purple-700', desc: 'Trial period active' },
  ACTIVE:   { label: 'Active',    cls: 'bg-green-50 text-green-700',   desc: 'Subscription active' },
  PAST_DUE: { label: 'Past due',  cls: 'bg-red-50 text-red-700',      desc: 'Payment overdue' },
  UNPAID:   { label: 'Unpaid',    cls: 'bg-red-50 text-red-700',      desc: 'Invoice unpaid' },
  CANCELED: { label: 'Canceled',  cls: 'bg-gray-100 text-gray-500',   desc: 'Subscription canceled' },
  EXPIRED:  { label: 'Expired',   cls: 'bg-gray-100 text-gray-500',   desc: 'Plan period ended' },
}

// ── Usage bar ──────────────────────────────────────────────────────────────────

function UsageBar({ label, used, limit }: {
  label: string; used: number; limit: number | null
}) {
  const isUnlimited = limit === null
  const pct         = isUnlimited ? 0 : Math.min(100, (used / Math.max(1, limit!)) * 100)
  const isNearLimit = !isUnlimited && pct >= 80
  const isAtLimit   = !isUnlimited && pct >= 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className={`font-medium tabular-nums ${isAtLimit ? 'text-red-600' : 'text-gray-900'}`}>
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
      {isAtLimit && (
        <p className="text-xs text-red-600">Limit reached — upgrade to Pro for unlimited access</p>
      )}
    </div>
  )
}

// ── Billing data view ──────────────────────────────────────────────────────────

function BillingView({
  data,
  orgName,
  onChangeWorkspace,
}: {
  data: BillingResponse
  orgName: string | null
  onChangeWorkspace?: () => void
}) {
  const { subscription, usage, limits } = data
  const billingStatus = subscription.billing_status ?? 'INACTIVE'
  const statusCfg = BILLING_STATUS_CONFIG[billingStatus] ?? BILLING_STATUS_CONFIG.INACTIVE

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
          {orgName && (
            <p className="text-sm text-gray-500 mt-0.5">
              {orgName}
              {onChangeWorkspace && (
                <button
                  onClick={onChangeWorkspace}
                  className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline"
                >
                  Change workspace
                </button>
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.cls}`}>
            {statusCfg.label}
          </span>
          {subscription.tier === 'PRO' ? (
            <span className="inline-flex px-2.5 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700">Pro</span>
          ) : (
            <span className="inline-flex px-2.5 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-500">Free</span>
          )}
        </div>
      </div>

      {/* Subscription details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Subscription</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          {[
            { label: 'Plan tier',       value: subscription.tier },
            { label: 'Status',          value: statusCfg.desc },
            { label: 'Provider',        value: subscription.provider || '—' },
            { label: 'Period start',    value: fmtDate(subscription.period_start) },
            { label: 'Period end',      value: fmtDate(subscription.period_end) },
            { label: 'Last invoice',    value: fmtDate(subscription.last_invoice_at) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="font-medium text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        {subscription.cancel_at_period_end && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
            ⚠️ Subscription will cancel at end of current period ({fmtDate(subscription.period_end)})
          </div>
        )}

        {subscription.grace_until && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            ⏳ Grace period until {fmtDate(subscription.grace_until)} — access continues temporarily
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Usage this month
          </p>
          <p className="text-xs text-gray-400">Period: {usage.period_start}</p>
        </div>
        <div className="space-y-4">
          <UsageBar label="Route calculations"  used={usage.routes_calls}    limit={limits.routes_per_month} />
          <UsageBar label="Trips created"       used={usage.trips_created}   limit={limits.trips_per_month} />
          <UsageBar label="Exports generated"   used={usage.exports_created} limit={limits.exports_per_month} />
        </div>
      </div>

      {/* Upgrade CTA for free plans */}
      {subscription.tier === 'FREE' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-blue-900 mb-1">Upgrade to Pro</p>
          <p className="text-xs text-blue-700 mb-3">
            Unlimited route calculations, trips, and exports. No more hitting limits.
          </p>
          <p className="text-xs text-blue-600">
            Contact EffortEdutech to upgrade your workspace to Pro.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [data, setData]         = useState<BillingResponse | null>(null)
  const [loading, setLoading]   = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isInternal, setIsInternal] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  // Check if internal staff
  useEffect(() => {
    fetch('/api/console/me')
      .then(r => r.json())
      .then(j => {
        if (j?.role === 'SUPER_ADMIN' || j?.role === 'SUPPORT') {
          setIsInternal(true)
          setShowPicker(true)
          setLoading(false)
        }
      })
      .catch(() => {
        // Not internal staff — load normally
        loadBilling(null)
      })

    // Also try loading normally (will work for workspace users)
    loadBilling(null)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function loadBilling(orgId: string | null) {
    setLoading(true)
    setErrorMsg(null)
    const url = orgId ? `/api/workspace/billing?org_id=${orgId}` : '/api/workspace/billing'

    fetch(url)
      .then(async res => {
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error?.message ?? 'Failed to load billing')
        if (!json?.subscription || !json?.usage || !json?.limits) {
          throw new Error('Unexpected response from billing API')
        }
        setData(json)
        setShowPicker(false)
      })
      .catch(e => {
        const msg = e instanceof Error ? e.message : 'Failed to load billing'
        // org_id required = internal staff not yet selected a workspace
        if (msg.includes('org_id required')) {
          setIsInternal(true)
          setShowPicker(true)
        } else {
          setErrorMsg(msg)
        }
      })
      .finally(() => setLoading(false))
  }

  function handleOrgSelect(orgId: string, orgName: string) {
    setSelectedOrg({ id: orgId, name: orgName })
    loadBilling(orgId)
  }

  // Internal staff needs to pick workspace first
  if (showPicker || (isInternal && !data)) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view its billing information</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <InternalOrgPicker label="billing information" onSelect={handleOrgSelect} />
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading billing…</div>
  )

  if (errorMsg || !data) return (
    <div className="space-y-5 max-w-2xl">
      <h1 className="text-lg font-semibold text-gray-900">Billing</h1>
      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-sm text-red-700">
        {errorMsg ?? 'Failed to load billing information'}
      </div>
    </div>
  )

  return (
    <BillingView
      data={data}
      orgName={selectedOrg?.name ?? null}
      onChangeWorkspace={isInternal ? () => { setData(null); setShowPicker(true) } : undefined}
    />
  )
}
