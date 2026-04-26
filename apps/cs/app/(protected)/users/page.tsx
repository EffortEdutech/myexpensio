'use client'
// apps/cs/app/(protected)/users/page.tsx
// UPDATED: Edit button opens UserEditDrawer for full profile + role editing

import React, { useEffect, useState, useCallback } from 'react'
import UserEditDrawer, { type EditableUser } from '@/components/UserEditDrawer'

type Membership = {
  org_id: string; org_role: string; status: string
  organization: { name: string; workspace_type: string } | null
}

type User = {
  id: string; email: string | null; display_name: string | null
  role: string; department: string | null; created_at: string
  memberships: Membership[]
}

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string | null, email: string | null) {
  return (name ?? email ?? '?').slice(0, 2).toUpperCase()
}

function PlatformRoleBadge({ role }: { role: string }) {
  const cls: Record<string, string> = {
    SUPER_ADMIN: 'bg-amber-50 text-amber-700',
    SUPPORT:     'bg-blue-50 text-blue-700',
    USER:        'bg-gray-100 text-gray-500',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {role === 'SUPER_ADMIN' && <span>⚡</span>}
      {role === 'SUPER_ADMIN' ? 'Super Admin' : role === 'SUPPORT' ? 'Support' : 'User'}
    </span>
  )
}

function OrgRoleBadge({ role }: { role: string }) {
  const cls: Record<string, string> = {
    OWNER: 'bg-purple-50 text-purple-700', ADMIN: 'bg-blue-50 text-blue-700',
    MANAGER: 'bg-blue-50 text-blue-600', EMPLOYEE: 'bg-gray-100 text-gray-600',
    SALES: 'bg-green-50 text-green-700', FINANCE: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls[role] ?? 'bg-gray-100 text-gray-500'}`}>{role}</span>
}

function TypePill({ type }: { type: string }) {
  const cls: Record<string, string> = {
    TEAM: 'bg-blue-50 text-blue-600', AGENT: 'bg-purple-50 text-purple-600', INTERNAL: 'bg-amber-50 text-amber-600',
  }
  return <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${cls[type] ?? 'bg-gray-100 text-gray-500'}`}>{type}</span>
}

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

export default function UsersPage() {
  const [users, setUsers]           = useState<User[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [editTarget, setEditTarget] = useState<EditableUser | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)

  const PAGE_SIZE = 25
  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length
  const supportCount    = users.filter((u) => u.role === 'SUPPORT').length

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (search)     params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      const res = await fetch(`/api/console/users?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setUsers(json.users ?? [])
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [search, roleFilter])

  useEffect(() => {
    fetch('/api/console/me').then((r) => r.json()).then((j) => {
      if (j?.role === 'SUPER_ADMIN') setIsSuperAdmin(true)
    }).catch(() => setIsSuperAdmin(true))
  }, [])

  useEffect(() => { setPage(1); fetchUsers(1) }, [fetchUsers])

  const filtered = typeFilter
    ? users.filter((u) => u.memberships.some((m) => m.organization?.workspace_type === typeFilter && m.status === 'ACTIVE'))
    : users

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {editTarget && (
        <UserEditDrawer
          user={editTarget}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditTarget(null)}
          onSaved={() => fetchUsers(page)}
        />
      )}

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500 mt-0.5">All registered users across the platform</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total users"    value={total}          sub="across all workspaces" />
        <KPICard label="Super Admins"   value={superAdminCount} sub="EffortEdutech staff"  variant="warn" />
        <KPICard label="Support staff"  value={supportCount}    sub="Console access" />
        <KPICard label="Standard users" value={Math.max(0, total - superAdminCount - supportCount)} sub="profiles.role = USER" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="w-52 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All platform roles</option>
          <option value="USER">USER</option><option value="SUPPORT">SUPPORT</option><option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All workspace types</option>
          <option value="TEAM">Team</option><option value="AGENT">Agent</option><option value="INTERNAL">Internal</option>
        </select>
        {(search || roleFilter || typeFilter) && (
          <button onClick={() => { setSearch(''); setRoleFilter(''); setTypeFilter('') }}
            className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} users</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['User','Platform role','Workspace','Workspace role','Joined','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const activeMemberships = u.memberships.filter((m) => m.status === 'ACTIVE')
                  const primaryMembership = activeMemberships[0] ?? null
                  const isInternal = u.role === 'SUPER_ADMIN' || u.role === 'SUPPORT'

                  return (
                    <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                            style={{ background: isInternal ? '#fef3c7' : '#dbeafe', color: isInternal ? '#92400e' : '#1e40af' }}>
                            {initials(u.display_name, u.email)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{u.display_name ?? '—'}</div>
                            <div className="text-xs text-gray-400">{u.email ?? '—'}</div>
                            {u.department && <div className="text-xs text-gray-400">{u.department}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><PlatformRoleBadge role={u.role} /></td>
                      <td className="px-4 py-3">
                        {activeMemberships.length === 0 ? (
                          <span className="text-xs text-gray-300">No workspace</span>
                        ) : (
                          <div className="space-y-1">
                            {activeMemberships.slice(0, 2).map((m, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <TypePill type={m.organization?.workspace_type ?? 'TEAM'} />
                                <span className="text-xs text-gray-700 truncate max-w-28">
                                  {m.organization?.name ?? m.org_id.slice(0, 8)}
                                </span>
                              </div>
                            ))}
                            {activeMemberships.length > 2 && (
                              <div className="text-xs text-gray-400">+{activeMemberships.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {primaryMembership ? <OrgRoleBadge role={primaryMembership.org_role} /> :
                         isInternal ? <span className="text-xs text-gray-400 italic">Platform staff</span> :
                         <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmt(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditTarget({
                            id:           u.id,
                            email:        u.email,
                            display_name: u.display_name,
                            role:         u.role,
                            department:   u.department,
                            memberships:  u.memberships,
                          })}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit
                        </button>
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
              <button key={label} onClick={() => { setPage(p); fetchUsers(p) }} disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
