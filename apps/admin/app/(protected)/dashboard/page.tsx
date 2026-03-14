// apps/admin/app/(protected)/dashboard/page.tsx
// Platform-wide dashboard — all orgs, all users, all claims.

import { createServiceRoleClient } from '@/lib/supabase/server'

function Card({ label, value, sub, color = 'gray' }: {
  label: string; value: string | number; sub?: string
  color?: 'gray' | 'green' | 'blue' | 'amber' | 'red' | 'purple'
}) {
  const border = { gray: 'border-gray-200', green: 'border-green-200', blue: 'border-blue-200', amber: 'border-amber-200', red: 'border-red-200', purple: 'border-purple-200' }[color]
  const text   = { gray: 'text-gray-900',   green: 'text-green-800',   blue: 'text-blue-800',   amber: 'text-amber-800',   red: 'text-red-800',   purple: 'text-purple-800'  }[color]
  return (
    <div className={`bg-white rounded-xl border-2 ${border} px-5 py-4`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function DashboardPage() {
  const db  = createServiceRoleClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [orgsRes, usersRes, claimsRes, exportsRes, subRes] = await Promise.all([
    db.from('organizations').select('id, status'),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('claims').select('status'),
    db.from('export_jobs').select('created_at'),
    db.from('subscription_status').select('tier'),
  ])

  const orgs    = orgsRes.data   ?? []
  const claims  = claimsRes.data ?? []
  const exports = exportsRes.data ?? []
  const subs    = subRes.data    ?? []

  const stats = {
    totalOrgs:        orgs.length,
    activeOrgs:       orgs.filter(o => o.status === 'ACTIVE').length,
    totalUsers:       usersRes.count ?? 0,
    submittedClaims:  claims.filter(c => c.status === 'SUBMITTED').length,
    draftClaims:      claims.filter(c => c.status === 'DRAFT').length,
    exportsThisMonth: exports.filter(e => e.created_at >= monthStart).length,
    proOrgs:          subs.filter(s => s.tier === 'PRO').length,
    freeOrgs:         subs.filter(s => s.tier === 'FREE').length,
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">myexpensio platform — all organisations</p>
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Organisations</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Total Orgs"  value={stats.totalOrgs}  color="blue" />
        <Card label="Active Orgs" value={stats.activeOrgs} color="green" />
        <Card label="Pro"         value={stats.proOrgs}    color="purple" sub="paying" />
        <Card label="Free"        value={stats.freeOrgs}   sub="trial/free" />
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Users & Claims</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card label="Total Users"      value={stats.totalUsers}      color="blue" />
        <Card label="Submitted Claims" value={stats.submittedClaims} color="green" />
        <Card label="Draft Claims"     value={stats.draftClaims}     color="amber" />
        <Card label="Exports / Month"  value={stats.exportsThisMonth} color="blue" />
      </div>

      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick actions</p>
      <div className="flex flex-wrap gap-3">
        {[
          ['/members', 'Manage Members'],
          ['/claims',  'View All Claims'],
          ['/rates',   'Manage Rates'],
          ['/audit',   'Audit Log'],
        ].map(([href, label]) => (
          <a key={href} href={href}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
