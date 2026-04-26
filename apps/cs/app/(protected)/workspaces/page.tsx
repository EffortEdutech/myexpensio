'use client'
// apps/cs/app/(protected)/workspaces/page.tsx
// UPDATED: Edit opens WorkspaceEditDrawer, Members opens WorkspaceMembersDrawer,
//          Referrals opens AgentReferralsDrawer, Manage is now Edit button

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import WorkspaceMembersDrawer from '@/components/WorkspaceMembersDrawer'
import WorkspaceEditDrawer, { type EditableWorkspace } from '@/components/WorkspaceEditDrawer'
import AgentReferralsDrawer from '@/components/AgentReferralsDrawer'

type Subscription = { tier: 'FREE' | 'PRO'; billing_status: string; period_end: string | null }

type Workspace = {
  id: string
  name: string
  status: string
  workspace_type: 'TEAM' | 'AGENT' | 'INTERNAL'
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  created_at: string
  subscription_status: Subscription | null
  active_member_count: number
  total_member_count: number
}

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' },
  { bg: '#dcfce7', text: '#166534' },
  { bg: '#f3e8ff', text: '#6b21a8' },
  { bg: '#fef3c7', text: '#92400e' },
]

function TypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    TEAM: 'bg-blue-50 text-blue-700', AGENT: 'bg-purple-50 text-purple-700', INTERNAL: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls[type] ?? 'bg-gray-100 text-gray-600'}`}>{type}</span>
}

function StatusBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700', INACTIVE: 'bg-gray-100 text-gray-500', SUSPENDED: 'bg-red-50 text-red-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cls[status] ?? 'bg-gray-100 text-gray-500'}`}>{status}</span>
}

function TierBillingCell({ sub }: { sub: Subscription | null }) {
  if (!sub) return <span className="text-xs text-gray-300">—</span>
  return (
    <>
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${sub.tier === 'PRO' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
        {sub.tier}
      </span>
      <div className={`text-xs mt-0.5 ${sub.billing_status === 'PAST_DUE' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
        {sub.billing_status}
      </div>
    </>
  )
}

function MemberAvatars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => {
          const c = AVATAR_COLORS[i % AVATAR_COLORS.length]
          return (
            <div key={i} style={{ backgroundColor: c.bg, color: c.text, marginLeft: i === 0 ? 0 : -4, border: '1.5px solid #fff' }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {String.fromCharCode(65 + i)}
            </div>
          )
        })}
      </div>
      <span className="text-xs text-gray-400">{count} active</span>
    </div>
  )
}

function KPICard({ label, value, sub, variant = 'default' }: {
  label: string; value: string | number; sub?: string; variant?: 'default' | 'up' | 'warn' | 'danger'
}) {
  const vc = variant === 'up' ? 'text-green-700' : variant === 'danger' ? 'text-red-600' : 'text-gray-900'
  const sc = variant === 'up' ? 'text-green-600' : variant === 'danger' ? 'text-red-500' : 'text-gray-400'
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${vc}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${sc}`}>{sub}</p>}
    </div>
  )
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces]           = useState<Workspace[]>([])
  const [total, setTotal]                     = useState(0)
  const [page, setPage]                       = useState(1)
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState('')
  const [typeFilter, setTypeFilter]           = useState('')
  const [statusFilter, setStatusFilter]       = useState('')
  const [membersTarget, setMembersTarget]     = useState<Workspace | null>(null)
  const [editTarget, setEditTarget]           = useState<Workspace | null>(null)
  const [referralsTarget, setReferralsTarget] = useState<Workspace | null>(null)
  const [isSuperAdmin, setIsSuperAdmin]       = useState(false)

  const PAGE_SIZE = 25
  const teamCount      = workspaces.filter((w) => w.workspace_type === 'TEAM').length
  const agentCount     = workspaces.filter((w) => w.workspace_type === 'AGENT').length
  const suspendedCount = workspaces.filter((w) => w.status === 'SUSPENDED').length

  const fetchWorkspaces = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (search)       params.set('search', search)
      if (typeFilter)   params.set('workspace_type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/console/workspaces?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setWorkspaces(json.workspaces ?? [])
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [search, typeFilter, statusFilter])

  useEffect(() => {
    fetch('/api/console/me').then((r) => r.json()).then((j) => {
      if (j?.role === 'SUPER_ADMIN') setIsSuperAdmin(true)
    }).catch(() => setIsSuperAdmin(true))
  }, [])

  useEffect(() => { setPage(1); fetchWorkspaces(1) }, [fetchWorkspaces])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Build EditableWorkspace shape for the drawer
  function buildEditableWorkspace(w: Workspace): EditableWorkspace {
    return {
      id:                  w.id,
      name:                w.name,
      workspace_type:      w.workspace_type,
      status:              w.status,
      contact_email:       w.contact_email,
      contact_phone:       w.contact_phone ?? null,
      address:             w.address ?? null,
      notes:               w.notes ?? null,
      subscription_status: w.subscription_status,
    }
  }

  return (
    <div className="space-y-5">
      {/* Drawers */}
      {membersTarget && (
        <WorkspaceMembersDrawer
          workspace={{ id: membersTarget.id, name: membersTarget.name, workspace_type: membersTarget.workspace_type as 'TEAM' | 'AGENT' }}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setMembersTarget(null)}
        />
      )}
      {editTarget && (
        <WorkspaceEditDrawer
          workspace={buildEditableWorkspace(editTarget)}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchWorkspaces(page)}
        />
      )}
      {referralsTarget && (
        <AgentReferralsDrawer
          orgId={referralsTarget.id}
          orgName={referralsTarget.name}
          onClose={() => setReferralsTarget(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Workspaces</h1>
          <p className="text-sm text-gray-500 mt-0.5">All Team and Agent workspaces on the platform</p>
        </div>
        <Link href="/workspaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Workspace
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total"     value={total}          sub="all workspace types" />
        <KPICard label="Team"      value={teamCount}      sub="company workspaces"  variant="up" />
        <KPICard label="Agent"     value={agentCount}     sub="partner workspaces" />
        <KPICard label="Suspended" value={suspendedCount} sub={suspendedCount > 0 ? 'needs attention' : 'all clear'} variant={suspendedCount > 0 ? 'danger' : 'default'} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workspace name…"
          className="w-52 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All types</option><option value="TEAM">Team</option>
          <option value="AGENT">Agent</option><option value="INTERNAL">Internal</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All statuses</option><option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option>
        </select>
        {(search || typeFilter || statusFilter) && (
          <button onClick={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }}
            className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} workspaces</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : workspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3">
            <p className="text-sm text-gray-400">No workspaces found</p>
            <Link href="/workspaces/new" className="text-sm text-blue-600 hover:text-blue-800 font-medium">Create first workspace →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Workspace', 'Type', 'Status', 'Plan', 'Members', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workspaces.map((w) => {
                  const isSuspended = w.status === 'SUSPENDED'
                  const isAgent     = w.workspace_type === 'AGENT'
                  const isInternal  = w.workspace_type === 'INTERNAL'

                  return (
                    <tr key={w.id} className={`border-b border-gray-50 transition-colors ${isSuspended ? 'bg-red-50/30' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{w.name}</div>
                        {w.contact_email && <div className="text-xs text-gray-400 mt-0.5">{w.contact_email}</div>}
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={w.workspace_type} /></td>
                      <td className="px-4 py-3"><StatusBadge status={w.status} /></td>
                      <td className="px-4 py-3"><TierBillingCell sub={w.subscription_status} /></td>
                      <td className="px-4 py-3"><MemberAvatars count={w.active_member_count} /></td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmt(w.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Type-specific primary action */}
                          {!isInternal && (
                            <>
                              {isAgent ? (
                                <button onClick={() => setReferralsTarget(w)}
                                  className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                                  Referrals
                                </button>
                              ) : (
                                <button onClick={() => setMembersTarget(w)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                  Members
                                </button>
                              )}
                              <div className="w-px h-3 bg-gray-200" />
                            </>
                          )}

                          {/* Edit button — opens full edit drawer */}
                          <button onClick={() => setEditTarget(w)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Edit
                          </button>

                          {/* Quick reactivate for suspended */}
                          {isSuspended && (
                            <>
                              <div className="w-px h-3 bg-gray-200" />
                              <button onClick={() => setEditTarget(w)}
                                className="text-xs text-green-600 hover:text-green-800 font-medium">
                                Reactivate
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
            {[{ label: 'Previous', p: page - 1, disabled: page === 1 }, { label: 'Next', p: page + 1, disabled: page >= totalPages }].map(({ label, p, disabled }) => (
              <button key={label} onClick={() => { setPage(p); fetchWorkspaces(p) }} disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
