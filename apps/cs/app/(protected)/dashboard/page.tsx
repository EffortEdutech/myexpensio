// apps/cs/app/(protected)/dashboard/page.tsx
// Server Component — light theme matching apps/admin.

import { createServiceRoleClient } from '@/lib/supabase/server'
import { requireConsoleAuth } from '@/lib/auth'
import Link from 'next/link'

function Card({ label, value, sub, accent = false }: {
  label: string; value: string | number; sub?: string; accent?: boolean
}) {
  return (
    <div className={`bg-white rounded-xl border px-5 py-4 ${accent ? 'border-blue-200' : 'border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${accent ? 'text-blue-700' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  )
}

export default async function ConsoleDashboardPage() {
  await requireConsoleAuth('page')

  const db = createServiceRoleClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    orgsRes, usersRes, newUsersRes,
    claimsRes, exportsRes,
    pendingInvitesRes, failedExportsRes,
    pastDueRes,
  ] = await Promise.all([
    db.from('organizations').select('id, status, workspace_type'),
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
    db.from('claims').select('status').gte('created_at', monthStart),
    db.from('export_jobs').select('status').gte('created_at', monthStart),
    db.from('invitation_requests').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    db.from('export_jobs').select('id', { count: 'exact', head: true }).eq('status', 'FAILED').gte('created_at', monthStart),
    db.from('subscription_status').select('org_id', { count: 'exact', head: true }).eq('billing_status', 'PAST_DUE'),
  ])

  const orgs   = orgsRes.data ?? []
  const claims = claimsRes.data ?? []
  const exports = exportsRes.data ?? []
  const pendingInvites = pendingInvitesRes.count ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Action needed */}
      {pendingInvites > 0 && (
        <Link
          href="/invitation-queue"
          className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 hover:bg-blue-100 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold text-blue-800">
              {pendingInvites} invitation request{pendingInvites !== 1 ? 's' : ''} pending review
            </p>
            <p className="text-xs text-blue-500 mt-0.5">Click to review and execute →</p>
          </div>
          <span className="text-2xl font-bold text-blue-700 tabular-nums">{pendingInvites}</span>
        </Link>
      )}

      <Section title="Workspaces">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card label="Total Orgs"   value={orgs.length} />
          <Card label="Active"       value={orgs.filter(o => o.status === 'ACTIVE').length} accent />
          <Card label="Team"         value={orgs.filter(o => o.workspace_type === 'TEAM').length}  sub="company workspaces" />
          <Card label="Agent"        value={orgs.filter(o => o.workspace_type === 'AGENT').length} sub="partner workspaces" />
        </div>
      </Section>

      <Section title="Users">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card label="Total Users"  value={usersRes.count ?? 0} />
          <Card label="New (month)"  value={newUsersRes.count ?? 0} accent sub="registered this month" />
        </div>
      </Section>

      <Section title="Activity (this month)">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card label="Claims submitted" value={claims.filter(c => c.status === 'SUBMITTED').length} />
          <Card label="Claims draft"     value={claims.filter(c => c.status === 'DRAFT').length} />
          <Card label="Exports done"     value={exports.filter(e => e.status === 'DONE').length} />
          <Card label="Exports failed"   value={failedExportsRes.count ?? 0} sub="needs attention" />
        </div>
      </Section>

      <Section title="Health">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card label="Invites pending" value={pendingInvites}        sub="awaiting Console action" />
          <Card label="Past due subs"   value={pastDueRes.count ?? 0} sub="payment issues" />
        </div>
      </Section>
    </div>
  )
}
