'use client'
// apps/admin/app/(protected)/workspace-members/page.tsx
// Workspace members management — for customer workspace admins.
// Simple view: list members, change role (OWNER only), remove (OWNER only).
// Invite new members → via /invitations (2-step Console-executed flow).

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  email: string | null
  display_name: string | null
  department: string | null
}

type Member = {
  org_id: string
  user_id: string
  org_role: string
  status: 'ACTIVE' | 'REMOVED'
  created_at: string
  profiles: Profile | null
}

// ── Role label helpers ─────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  OWNER:    'Owner',
  ADMIN:    'Admin',
  MANAGER:  'Manager',
  EMPLOYEE: 'Employee',
  SALES:    'Sales',
  FINANCE:  'Finance',
  MEMBER:   'Member',
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:    'bg-purple-50 text-purple-700',
  ADMIN:    'bg-blue-50 text-blue-700',
  MANAGER:  'bg-blue-50 text-blue-600',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
  SALES:    'bg-green-50 text-green-700',
  FINANCE:  'bg-amber-50 text-amber-700',
  MEMBER:   'bg-gray-100 text-gray-500',
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function formatDate(val: string) {
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Role change modal ──────────────────────────────────────────────────────────

function RoleModal({
  member,
  availableRoles,
  onClose,
  onSaved,
}: {
  member: Member
  availableRoles: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [role, setRole] = useState(member.org_role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (role === member.org_role) { onClose(); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: member.user_id, org_role: role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to update role')
      onSaved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error updating role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Change Role</h2>
        <p className="text-sm text-gray-500 mb-5">
          {member.profiles?.display_name ?? member.profiles?.email ?? 'User'}
        </p>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableRoles.map((r) => (
            <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
          ))}
        </select>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Confirm remove modal ───────────────────────────────────────────────────────

function ConfirmRemoveModal({
  member,
  onClose,
  onRemoved,
}: {
  member: Member
  onClose: () => void
  onRemoved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRemove() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace/members', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: member.user_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to remove member')
      onRemoved()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error removing member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Remove Member</h2>
        <p className="text-sm text-gray-500 mb-4">
          Remove <strong>{member.profiles?.display_name ?? member.profiles?.email}</strong> from this workspace?
          They will lose access immediately.
        </p>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function WorkspaceMembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [roleModal, setRoleModal] = useState<Member | null>(null)
  const [removeModal, setRemoveModal] = useState<Member | null>(null)

  // Detect workspace type from first member's org (simplistic — could be improved with /api/workspace/me)
  const [isOwner, setIsOwner] = useState(false)
  const [workspaceType, setWorkspaceType] = useState<'TEAM' | 'AGENT'>('TEAM')

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workspace/members')
      if (!res.ok) throw new Error()
      const json = await res.json()
      const list: Member[] = json.members ?? []
      setMembers(list)

      // Check if current user is owner by comparing with auth context
      // (We infer from the fact that the page is accessible — further role-gating done server-side)
      const myRes = await fetch('/api/workspace/stats')
      if (myRes.ok) {
        const statsJson = await myRes.json()
        if (statsJson.workspace_type === 'AGENT') setWorkspaceType('AGENT')
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  // Detect if current user is OWNER (PATCH/DELETE gated server-side anyway)
  useEffect(() => {
    // We show actions — server enforces the actual permission
    setIsOwner(true)
  }, [])

  const AVAILABLE_ROLES = workspaceType === 'AGENT'
    ? ['OWNER', 'SALES', 'FINANCE']
    : ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']

  const displayed = members.filter((m) => {
    if (!showInactive && m.status !== 'ACTIVE') return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      m.profiles?.display_name?.toLowerCase().includes(q) ||
      m.profiles?.email?.toLowerCase().includes(q) ||
      m.profiles?.department?.toLowerCase().includes(q)
    )
  })

  const activeCount = members.filter(m => m.status === 'ACTIVE').length

  return (
    <div className="space-y-5">
      {roleModal && (
        <RoleModal
          member={roleModal}
          availableRoles={AVAILABLE_ROLES}
          onClose={() => setRoleModal(null)}
          onSaved={fetchMembers}
        />
      )}
      {removeModal && (
        <ConfirmRemoveModal
          member={removeModal}
          onClose={() => setRemoveModal(null)}
          onRemoved={fetchMembers}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} active member{activeCount !== 1 ? 's' : ''} in this workspace
          </p>
        </div>
        <a
          href="/invitations"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite User
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, department…"
          className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show removed
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-sm text-gray-400">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            {members.length === 0 ? 'No members yet. Use Invite User to add members.' : 'No members match filters.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Department</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide hidden sm:table-cell">Joined</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayed.map((m) => (
                <tr
                  key={m.user_id}
                  className={`hover:bg-gray-50 transition-colors ${m.status === 'REMOVED' ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">
                      {m.profiles?.display_name ?? '—'}
                    </div>
                    <div className="text-xs text-gray-400">{m.profiles?.email ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={m.org_role} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                    {m.profiles?.department ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.status === 'ACTIVE' && (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setRoleModal(m)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Change role
                        </button>
                        <button
                          onClick={() => setRemoveModal(m)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                    {m.status === 'REMOVED' && (
                      <span className="text-xs text-gray-400 italic">Removed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">
        To add new members, submit an invitation request via the <a href="/invitations" className="text-blue-500 hover:underline">Invitations</a> page.
        The platform team reviews and creates user accounts.
      </p>
    </div>
  )
}
