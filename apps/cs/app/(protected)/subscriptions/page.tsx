'use client'
// apps/cs/app/(protected)/subscriptions/page.tsx

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Org = { id: string; name: string; workspace_type: string; status: string }

type Sub = {
  org_id: string
  tier: 'FREE' | 'PRO'
  billing_status: string
  provider: string
  plan_code: string | null
  period_start: string | null
  period_end: string | null
  cancel_at_period_end: boolean
  grace_until: string | null
  last_invoice_at: string | null
  organizations: Org | null
  routes_used?: number
  routes_limit?: number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtPeriodEnd(val: string | null, billingStatus: string): React.ReactNode {
  if (!val) return <span className="text-gray-300">—</span>
  const date = new Date(val)
  const now = new Date()
  const overdue = date < now && billingStatus === 'PAST_DUE'
  const formatted = date.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
  if (overdue) return <span className="text-red-600 font-medium">{formatted} (overdue)</span>
  return <span className="text-gray-400">{formatted}</span>
}

// ── Badge components ──────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  return tier === 'PRO' ? (
    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">Pro</span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">Free</span>
  )
}

function BillingBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    ACTIVE:   { label: 'Active',    cls: 'bg-green-50 text-green-700' },
    TRIALING: { label: 'Trialing',  cls: 'bg-purple-50 text-purple-700' },
    INACTIVE: { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500' },
    PAST_DUE: { label: 'Past due',  cls: 'bg-red-50 text-red-700' },
    UNPAID:   { label: 'Unpaid',    cls: 'bg-red-50 text-red-700' },
    CANCELED: { label: 'Canceled',  cls: 'bg-gray-100 text-gray-400' },
    EXPIRED:  { label: 'Expired',   cls: 'bg-gray-100 text-gray-400' },
  }
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-500' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>
}

function TypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    TEAM:  'bg-blue-50 text-blue-700',
    AGENT: 'bg-purple-50 text-purple-700',
  }
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${cls[type] ?? 'bg-gray-100 text-gray-500'}`}>
      {type}
    </span>
  )
}

// ── Usage bar ─────────────────────────────────────────────────────────────────

function UsageBar({ used, limit }: { used?: number; limit?: number | null }) {
  if (limit === null || limit === undefined) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 rounded-full bg-green-100" />
        <span className="text-xs text-gray-400">∞ unlimited</span>
      </div>
    )
  }
  const safeUsed = used ?? 0
  const pct = Math.min(100, (safeUsed / Math.max(1, limit)) * 100)
  const barColor = pct >= 100 ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#3b82f6'
  const textColor = pct >= 100 ? 'text-red-600 font-medium' : 'text-gray-500'

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <span className={`text-xs tabular-nums ${textColor}`}>{safeUsed} / {limit}</span>
    </div>
  )
}

// ── Override modal ────────────────────────────────────────────────────────────

function OverrideModal({ sub, onClose, onSaved }: { sub: Sub; onClose: () => void; onSaved: () => void }) {
  const [tier,      setTier]      = useState(sub.tier)
  const [status,    setStatus]    = useState(sub.billing_status)
  const [periodEnd, setPeriodEnd] = useState(sub.period_end?.slice(0, 10) ?? '')
  const [note,      setNote]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function handleSave() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/console/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: sub.org_id, tier, billing_status: status,
          period_end: periodEnd || undefined,
          note: note || 'Manual override via Console',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      onSaved(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">Override Subscription</h2>
          {sub.organizations && <TypeBadge type={sub.organizations.workspace_type} />}
        </div>
        <p className="text-sm text-gray-500 mb-5">{sub.organizations?.name ?? sub.org_id}</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tier</label>
            <select value={tier} onChange={(e) => setTier(e.target.value as 'FREE' | 'PRO')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="FREE">Free — 2 routes/month</option>
              <option value="PRO">Pro — unlimited</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Billing status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {['INACTIVE','TRIALING','ACTIVE','PAST_DUE','UNPAID','CANCELED','EXPIRED'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Period end</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Note (for audit trail)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for override…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
          This override takes effect immediately and is recorded in the audit log.
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Override'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, variant = 'default' }: {
  label: string; value: string | number; sub?: string; variant?: 'default' | 'up' | 'warn' | 'danger'
}) {
  const vc = variant === 'up' ? 'text-green-700' : variant === 'warn' ? 'text-yellow-600' : variant === 'danger' ? 'text-red-600' : 'text-gray-900'
  const sc = variant === 'up' ? 'text-green-600' : variant === 'warn' ? 'text-yellow-600' : variant === 'danger' ? 'text-red-500' : 'text-gray-400'
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${vc}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${sc}`}>{sub}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PRO_PRICE_MYR = 160 // per workspace per month — adjust when billing is live

export default function SubscriptionsPage() {
  const [subs, setSubs]         = useState<Sub[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [tierFilter, setTierFilter]         = useState('')
  const [statusFilter, setStatusFilter]     = useState('')
  const [overrideTarget, setOverrideTarget] = useState<Sub | null>(null)

  const PAGE_SIZE = 25

  // Derived KPIs
  const proCount     = subs.filter((s) => s.tier === 'PRO').length
  const freeCount    = subs.filter((s) => s.tier === 'FREE').length
  const pastDueCount = subs.filter((s) => s.billing_status === 'PAST_DUE' || s.billing_status === 'UNPAID').length
  const mrr          = proCount * PRO_PRICE_MYR

  const fetchSubs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (tierFilter)   params.set('tier', tierFilter)
      if (statusFilter) params.set('billing_status', statusFilter)
      const res = await fetch(`/api/console/subscriptions?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSubs(json.subscriptions ?? [])
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [tierFilter, statusFilter])

  useEffect(() => { setPage(1); fetchSubs(1) }, [fetchSubs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {overrideTarget && (
        <OverrideModal
          sub={overrideTarget}
          onClose={() => setOverrideTarget(null)}
          onSaved={() => fetchSubs(page)}
        />
      )}

      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Subscriptions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Billing and plan management across all workspaces</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          label="Est. MRR"
          value={`RM ${mrr.toLocaleString()}`}
          sub={`${proCount} Pro × RM ${PRO_PRICE_MYR}`}
          variant="up"
        />
        <KPICard label="Pro plans"  value={proCount}     sub="unlimited access" />
        <KPICard label="Free plans" value={freeCount}    sub="conversion targets" />
        <KPICard label="Past due"   value={pastDueCount} sub={pastDueCount > 0 ? 'needs attention' : 'all clear'} variant={pastDueCount > 0 ? 'danger' : 'default'} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All tiers</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option>
          {['INACTIVE','TRIALING','ACTIVE','PAST_DUE','UNPAID','CANCELED','EXPIRED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {(tierFilter || statusFilter) && (
          <button onClick={() => { setTierFilter(''); setStatusFilter('') }}
            className="text-xs text-gray-400 hover:text-gray-600">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} subscriptions</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : subs.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">No subscriptions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Workspace</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Billing</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Routes this month</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Period end</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Provider</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => {
                  const isPastDue = s.billing_status === 'PAST_DUE' || s.billing_status === 'UNPAID'

                  return (
                    <tr key={s.org_id} className={`border-b border-gray-50 transition-colors ${isPastDue ? 'bg-red-50/20' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {s.organizations?.name ?? s.org_id.slice(0, 8)}
                        </div>
                        {s.grace_until && (
                          <div className="text-xs text-red-500 mt-0.5">
                            Grace until {fmt(s.grace_until)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.organizations && <TypeBadge type={s.organizations.workspace_type} />}
                      </td>
                      <td className="px-4 py-3">
                        <TierBadge tier={s.tier} />
                      </td>
                      <td className="px-4 py-3">
                        <BillingBadge status={s.billing_status} />
                        {s.cancel_at_period_end && (
                          <div className="text-xs text-yellow-600 mt-0.5">Cancels at period end</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <UsageBar
                          used={s.routes_used}
                          limit={s.tier === 'PRO' ? null : s.routes_limit ?? 2}
                        />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {fmtPeriodEnd(s.period_end, s.billing_status)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 capitalize">
                        {s.provider?.toLowerCase() ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => setOverrideTarget(s)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Override
                          </button>
                          {s.tier === 'FREE' && (
                            <>
                              <div className="w-px h-3 bg-gray-200" />
                              <button
                                onClick={() => setOverrideTarget({ ...s, tier: 'PRO' as const })}
                                className="text-xs text-green-600 hover:text-green-800 font-medium"
                              >
                                Upgrade
                              </button>
                            </>
                          )}
                          {isPastDue && (
                            <>
                              <div className="w-px h-3 bg-gray-200" />
                              <button className="text-xs text-red-500 hover:text-red-700 font-medium">
                                Suspend
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {[
              { label: 'Previous', p: page - 1, disabled: page === 1 },
              { label: 'Next',     p: page + 1, disabled: page >= totalPages },
            ].map(({ label, p, disabled }) => (
              <button key={label} onClick={() => { setPage(p); fetchSubs(p) }} disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
