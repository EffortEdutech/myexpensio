// apps/admin/app/(protected)/dashboard/page.tsx
//
// Admin dashboard — overview stat cards.
// Server component: fetches data directly via service role client.

import { requireAdminAuth } from '@/lib/auth'
import { createServiceRoleClient } from '@/lib/supabase/server'
import StatCard from '@/components/StatCard'
import type { DashboardStats } from '@/lib/types'

async function fetchStats(orgId: string): Promise<DashboardStats> {
  const db = createServiceRoleClient()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString().slice(0, 10)

  const [membersRes, claimsRes, exportsRes, subRes, usageRes] = await Promise.all([
    db.from('org_members').select('status', { count: 'exact', head: true })
      .eq('org_id', orgId).eq('status', 'ACTIVE'),

    db.from('claims').select('status').eq('org_id', orgId),

    db.from('export_jobs').select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),

    db.from('subscription_status').select('tier').eq('org_id', orgId).single(),

    db.from('usage_counters').select('routes_calls')
      .eq('org_id', orgId).eq('period_start', monthStart).single(),
  ])

  const claims = claimsRes.data ?? []
  const tier = subRes.data?.tier ?? 'FREE'

  return {
    totalMembers:      membersRes.count ?? 0,
    activeMembers:     membersRes.count ?? 0,
    draftClaims:       claims.filter((c) => c.status === 'DRAFT').length,
    submittedClaims:   claims.filter((c) => c.status === 'SUBMITTED').length,
    exportsThisMonth:  exportsRes.count ?? 0,
    routeCallsUsed:    usageRes.data?.routes_calls ?? 0,
    routeCallsLimit:   tier === 'FREE' ? 2 : null,
    subscriptionTier:  tier as 'FREE' | 'PRO',
  }
}

export default async function DashboardPage() {
  const ctx = await requireAdminAuth('page')

  // Platform admins without a selected org see a placeholder
  if (!ctx!.orgId) {
    return (
      <div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">
          You are a platform superadmin. Select an organisation to view its stats.
        </p>
      </div>
    )
  }

  const stats = await fetchStats(ctx!.orgId)

  const routeLabel = stats.routeCallsLimit === null
    ? `${stats.routeCallsUsed} used (unlimited)`
    : `${stats.routeCallsUsed} / ${stats.routeCallsLimit} this month`

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Overview for your organisation
        </p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Active Members"
          value={stats.activeMembers}
          variant="default"
        />
        <StatCard
          label="Submitted Claims"
          value={stats.submittedClaims}
          variant="green"
        />
        <StatCard
          label="Draft Claims"
          value={stats.draftClaims}
          sublabel="Not yet submitted"
          variant="amber"
        />
        <StatCard
          label="Exports This Month"
          value={stats.exportsThisMonth}
          variant="blue"
        />
        <StatCard
          label="Route API Usage"
          value={routeLabel}
          sublabel={stats.subscriptionTier === 'FREE' ? 'Free tier — 2/month limit' : 'Pro — unlimited'}
          variant={
            stats.routeCallsLimit !== null && stats.routeCallsUsed >= stats.routeCallsLimit
              ? 'red'
              : 'default'
          }
        />
        <StatCard
          label="Subscription"
          value={stats.subscriptionTier}
          variant={stats.subscriptionTier === 'PRO' ? 'green' : 'default'}
        />
      </div>

      {/* Quick links */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/members"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Manage Members
          </a>
          <a
            href="/claims"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200
                       bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            View Claims
          </a>
          <a
            href="/rates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200
                       bg-blue-50 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            + New Rate Version
          </a>
        </div>
      </div>
    </div>
  )
}
