'use client'
// apps/admin/app/(protected)/dashboard/page.tsx
// Workspace-aware dashboard.
//
// TEAM workspace  → member + claim + usage KPIs
// AGENT workspace → referral + commission KPIs
// INTERNAL staff  → platform-wide KPIs

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type StatsResponse = {
  workspace_type: 'TEAM' | 'AGENT' | null
  is_internal_staff: boolean
  stats: Record<string, number | string | null>
}

// ── Shared StatCard ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = false,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border px-5 py-4 ${accent ? 'border-blue-200' : 'border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function formatMYR(n: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR', maximumFractionDigits: 0 }).format(n)
}

// ── TEAM Dashboard ─────────────────────────────────────────────────────────────

function TeamDashboard({ stats }: { stats: Record<string, number | string | null> }) {
  const routesUsed  = Number(stats.routes_used ?? 0)
  const routesLimit = stats.routes_limit as number | null
  const tier        = (stats.subscription_tier as string) ?? 'FREE'
  const isPro       = tier === 'PRO'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Team workspace overview for this month.</p>
      </div>

      {/* Members */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Team</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Members" value={stats.active_members as number ?? 0} />
          <StatCard label="Total Members"  value={stats.total_members as number ?? 0} sub="including inactive" />
        </div>
      </div>

      {/* Claims */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Claims</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Submitted (month)" value={stats.claims_submitted_month as number ?? 0} accent />
          <StatCard label="Total Submitted"   value={stats.claims_submitted_total as number ?? 0} />
          <StatCard label="Drafts Pending"    value={stats.claims_draft as number ?? 0} sub="not yet submitted" />
          <StatCard label="Exports (month)"   value={stats.exports_month as number ?? 0} />
        </div>
      </div>

      {/* Usage */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Plan & Usage</h2>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Route calculations this month</span>
            <span className={`text-sm font-bold tabular-nums ${
              routesLimit !== null && routesUsed >= routesLimit ? 'text-red-600' : 'text-gray-900'
            }`}>
              {routesUsed} / {isPro ? '∞' : routesLimit ?? 2}
            </span>
          </div>
          {!isPro && routesLimit !== null && (
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  routesUsed >= routesLimit ? 'bg-red-500' : routesUsed >= routesLimit * 0.8 ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, (routesUsed / Math.max(1, routesLimit)) * 100)}%` }}
              />
            </div>
          )}
          {isPro && <div className="h-2 bg-green-100 rounded-full" />}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              {isPro ? 'Pro Plan — unlimited' : 'Free Plan — 2 routes/month'}
            </span>
            {!isPro && routesLimit !== null && routesUsed >= routesLimit && (
              <span className="text-xs text-red-600 font-medium">Limit reached — contact support to upgrade</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/claims',      label: 'View Claims',     icon: '📋' },
            { href: '/workspace-members', label: 'Manage Team',   icon: '👥' },
            { href: '/invitations', label: 'Invite Member',   icon: '✉️' },
            { href: '/billing',     label: 'Billing',         icon: '💳' },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2"
            >
              <span>{a.icon}</span>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AGENT Dashboard ────────────────────────────────────────────────────────────

function AgentDashboard({ stats }: { stats: Record<string, number | string | null> }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Partner workspace overview.</p>
      </div>

      {/* Referral funnel */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Referrals</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Referrals" value={stats.total_referrals as number ?? 0} />
          <StatCard label="Invited"         value={stats.invited as number ?? 0} sub="pending signup" />
          <StatCard label="Signed Up"       value={stats.signed_up as number ?? 0} sub="registered" />
          <StatCard label="Subscribed"      value={stats.subscribed as number ?? 0} accent sub="earning commission" />
        </div>
      </div>

      {/* Commission */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Commission (MYR)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard
            label="This month"
            value={formatMYR(Number(stats.commission_month ?? 0))}
            accent
          />
          <StatCard
            label="Pending payout"
            value={formatMYR(Number(stats.pending_payout ?? 0))}
            sub="approved, awaiting payment"
          />
          <StatCard
            label="Lifetime"
            value={formatMYR(Number(stats.commission_lifetime ?? 0))}
          />
        </div>
      </div>

      {/* Conversion note */}
      {Number(stats.total_referrals) > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          Conversion rate:{' '}
          <strong>
            {Math.round((Number(stats.subscribed) / Number(stats.total_referrals)) * 100)}%
          </strong>{' '}
          of invited customers are actively subscribed.
        </div>
      )}

      {/* Quick links */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/referrals',   label: 'Referrals',   icon: '🔗' },
            { href: '/commission',  label: 'Commission',  icon: '💰' },
            { href: '/invitations', label: 'Team Access', icon: '✉️' },
            { href: '/billing',     label: 'Billing',     icon: '💳' },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-2"
            >
              <span>{a.icon}</span>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── INTERNAL Dashboard ─────────────────────────────────────────────────────────

function InternalDashboard({ stats }: { stats: Record<string, number | string | null> }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Internal staff view — all workspaces.</p>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Workspaces</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Orgs"   value={stats.total_orgs as number ?? 0} />
          <StatCard label="Active Orgs"  value={stats.active_orgs as number ?? 0} accent />
          <StatCard label="Team"         value={stats.team_workspaces as number ?? 0} sub="company workspaces" />
          <StatCard label="Agent"        value={stats.agent_workspaces as number ?? 0} sub="partner workspaces" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Users</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Users"    value={stats.total_users as number ?? 0} />
          <StatCard label="New (month)"    value={stats.new_users_month as number ?? 0} accent sub="registered this month" />
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Claims (month)"    value={stats.claims_submitted_month as number ?? 0} />
          <StatCard label="Drafts"            value={stats.claims_draft as number ?? 0} sub="not submitted" />
          <StatCard label="Exports (month)"   value={stats.exports_month as number ?? 0} />
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [response, setResponse] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/workspace/stats')
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.error?.message ?? 'Failed to load stats')
        }
        return res.json() as Promise<StatsResponse>
      })
      .then(setResponse)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !response) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 text-sm text-red-700">
          {error ?? 'Failed to load dashboard stats'}
        </div>
      </div>
    )
  }

  const { workspace_type, is_internal_staff, stats } = response

  if (is_internal_staff && !workspace_type) {
    return <InternalDashboard stats={stats} />
  }
  if (workspace_type === 'AGENT') {
    return <AgentDashboard stats={stats} />
  }
  return <TeamDashboard stats={stats} />
}
