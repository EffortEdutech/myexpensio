'use client'
// apps/cs/components/UserEditDrawer.tsx
// FIXED: Workspace memberships now show inline org_role editor.
// Console staff can change org_role directly without going to the workspace.

import { useState } from 'react'

export type EditableUser = {
  id: string
  email: string | null
  display_name: string | null
  role: string
  department: string | null
  memberships: Array<{
    org_id: string
    org_role: string
    status: string
    organization: { name: string; workspace_type: string } | null
  }>
}

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-xs font-medium text-gray-500 mb-1'

// ── Role sets per workspace type ──────────────────────────────────────────────

const TEAM_ROLES  = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']
const AGENT_ROLES = ['OWNER', 'SALES', 'FINANCE', 'EMPLOYEE']

const ROLE_LABELS: Record<string, string> = {
  OWNER:    'Owner',
  ADMIN:    'Admin',
  MANAGER:  'Manager',
  EMPLOYEE: 'Employee',
  SALES:    'Sales',
  FINANCE:  'Finance',
  MEMBER:   'Member',
}

const ROLE_CLS: Record<string, string> = {
  OWNER:    'bg-purple-50 text-purple-700',
  ADMIN:    'bg-blue-50 text-blue-700',
  MANAGER:  'bg-blue-50 text-blue-600',
  EMPLOYEE: 'bg-gray-100 text-gray-600',
  SALES:    'bg-green-50 text-green-700',
  FINANCE:  'bg-amber-50 text-amber-700',
  MEMBER:   'bg-gray-100 text-gray-500',
}

const WORKSPACE_TYPE_CLS: Record<string, string> = {
  TEAM:     'bg-blue-50 text-blue-700',
  AGENT:    'bg-purple-50 text-purple-700',
  INTERNAL: 'bg-amber-50 text-amber-700',
}

const PLATFORM_ROLE_DESCRIPTIONS: Record<string, string> = {
  USER:        'Standard user — access MyExpensio only',
  SUPPORT:     'Support staff — Console access (read)',
  SUPER_ADMIN: 'Super Admin — full platform control',
}

// ── Membership role row ────────────────────────────────────────────────────────

function MembershipRoleRow({
  userId,
  membership,
  onChanged,
}: {
  userId: string
  membership: EditableUser['memberships'][0]
  onChanged: (orgId: string, newRole: string) => void
}) {
  const [editing, setEditing]   = useState(false)
  const [newRole, setNewRole]   = useState(membership.org_role)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const wsType     = membership.organization?.workspace_type ?? 'TEAM'
  const availRoles = wsType === 'AGENT' ? AGENT_ROLES : TEAM_ROLES

  async function handleSave() {
    if (newRole === membership.org_role) { setEditing(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/console/workspaces/${membership.org_id}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, org_role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to change role')
      onChanged(membership.org_id, newRole)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const isAgentEmployee = wsType === 'AGENT' && membership.org_role === 'EMPLOYEE'
  const willBeEmployee  = wsType === 'AGENT' && newRole === 'EMPLOYEE'
  const wasEmployee     = wsType === 'AGENT' && membership.org_role === 'EMPLOYEE'

  return (
    <div className={`px-3 py-3 border border-gray-100 rounded-lg ${membership.status === 'REMOVED' ? 'opacity-40' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        {/* Workspace info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${WORKSPACE_TYPE_CLS[wsType] ?? 'bg-gray-100 text-gray-500'}`}>
              {wsType}
            </span>
            <span className="text-sm font-medium text-gray-900 truncate">
              {membership.organization?.name ?? membership.org_id.slice(0, 8)}
            </span>
          </div>

          {/* Agent subscriber hint */}
          {isAgentEmployee && (
            <p className="text-xs text-purple-600 mt-0.5">Individual subscriber (EMPLOYEE)</p>
          )}
          {membership.status === 'REMOVED' && (
            <p className="text-xs text-gray-400 mt-0.5 italic">Removed from workspace</p>
          )}
        </div>

        {/* Role — editable */}
        <div className="flex-shrink-0">
          {!editing ? (
            <div className="flex items-center gap-2">
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_CLS[membership.org_role] ?? 'bg-gray-100 text-gray-500'}`}>
                {ROLE_LABELS[membership.org_role] ?? membership.org_role}
              </span>
              {membership.status === 'ACTIVE' && (
                <button
                  onClick={() => { setEditing(true); setNewRole(membership.org_role) }}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Change workspace role"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 min-w-40">
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}{wsType === 'AGENT' && r === 'EMPLOYEE' ? ' — Subscriber' : ''}
                  </option>
                ))}
              </select>

              {/* Contextual hint for Agent role switches */}
              {wsType === 'AGENT' && wasEmployee && !willBeEmployee && (
                <p className="text-xs text-blue-600">Will become agency staff</p>
              )}
              {wsType === 'AGENT' && !wasEmployee && willBeEmployee && (
                <p className="text-xs text-purple-600">Will become individual subscriber</p>
              )}

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-1.5">
                <button
                  onClick={() => { setEditing(false); setError(null) }}
                  className="flex-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || newRole === membership.org_role}
                  className="flex-1 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded px-2 py-1 disabled:opacity-50"
                >
                  {loading ? '…' : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main drawer ────────────────────────────────────────────────────────────────

export default function UserEditDrawer({
  user,
  isSuperAdmin,
  onClose,
  onSaved,
}: {
  user: EditableUser
  isSuperAdmin: boolean
  onClose: () => void
  onSaved: () => void
}) {
  const [displayName, setDisplayName] = useState(user.display_name ?? '')
  const [department, setDepartment]   = useState(user.department ?? '')
  const [platformRole, setPlatformRole] = useState(user.role)

  // Local memberships state — updated when org_role changes succeed
  const [memberships, setMemberships] = useState(user.memberships)

  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [success, setSuccess]           = useState(false)
  const [resetSent, setResetSent]       = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  function handleOrgRoleChanged(orgId: string, newRole: string) {
    setMemberships((prev) =>
      prev.map((m) => m.org_id === orgId ? { ...m, org_role: newRole } : m),
    )
  }

  async function handleSave() {
    setLoading(true); setError(null)
    try {
      // 1. Update profile (name + department)
      const profileRes = await fetch(`/api/console/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          department:   department.trim() || null,
        }),
      })
      if (!profileRes.ok) {
        const j = await profileRes.json()
        throw new Error(j.error?.message ?? 'Failed to save profile')
      }

      // 2. Update platform role if changed (SUPER_ADMIN only)
      if (platformRole !== user.role && isSuperAdmin) {
        const roleRes = await fetch('/api/console/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, role: platformRole }),
        })
        if (!roleRes.ok) {
          const j = await roleRes.json()
          throw new Error(j.error?.message ?? 'Failed to update platform role')
        }
      }

      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving changes')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordReset() {
    setResetLoading(true)
    try {
      const res = await fetch(`/api/console/users/${user.id}/reset-password`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed')
      setResetSent(true)
    } catch {
      setError('Failed to send password reset email')
    } finally {
      setResetLoading(false)
    }
  }

  const platformRoleCls: Record<string, string> = {
    SUPER_ADMIN: 'bg-amber-50 text-amber-700',
    SUPPORT:     'bg-blue-50 text-blue-700',
    USER:        'bg-gray-100 text-gray-500',
  }

  const activeMemberships  = memberships.filter((m) => m.status === 'ACTIVE')
  const removedMemberships = memberships.filter((m) => m.status === 'REMOVED')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900">
                {user.display_name ?? user.email ?? 'User'}
              </h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformRoleCls[user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

          {/* ── Profile ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Email address</label>
                <div className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 bg-gray-50 flex items-center justify-between">
                  <span>{user.email ?? '—'}</span>
                  <span className="text-xs text-gray-400">managed by Supabase Auth</span>
                </div>
              </div>
              <div>
                <label className={LABEL}>Display name</label>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Full name" className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Department</label>
                <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Finance, Engineering" className={INPUT} />
              </div>
            </div>
          </div>

          {/* ── Platform Role ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Platform Role</p>
            <p className="text-xs text-gray-400 mb-3">
              Controls which apps this user can access. Only relevant for EffortEdutech internal staff.
            </p>
            {isSuperAdmin ? (
              <div className="space-y-2">
                {['USER', 'SUPPORT', 'SUPER_ADMIN'].map((r) => (
                  <label key={r}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      platformRole === r ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="platformRole" value={r} checked={platformRole === r}
                      onChange={() => setPlatformRole(r)} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={`text-sm font-medium ${platformRole === r ? 'text-blue-700' : 'text-gray-900'}`}>{r}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{PLATFORM_ROLE_DESCRIPTIONS[r]}</div>
                    </div>
                  </label>
                ))}
                {platformRole === 'SUPER_ADMIN' && user.role !== 'SUPER_ADMIN' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
                    ⚠️ This gives full platform control including Console. Use with care.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-3 border border-gray-200 rounded-lg bg-gray-50">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${platformRoleCls[user.role] ?? 'bg-gray-100 text-gray-500'}`}>
                  {user.role}
                </span>
                <span className="text-xs text-gray-500">Platform role changes require SUPER_ADMIN</span>
              </div>
            )}
          </div>

          {/* ── Workspace Memberships — EDITABLE org_role ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Workspace Memberships
              </p>
              <p className="text-xs text-blue-600">Click ✏️ to change role</p>
            </div>

            {activeMemberships.length === 0 ? (
              <div className="text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-100 px-3 py-3 text-center">
                Not a member of any workspace
              </div>
            ) : (
              <div className="space-y-2">
                {activeMemberships.map((m) => (
                  <MembershipRoleRow
                    key={m.org_id}
                    userId={user.id}
                    membership={m}
                    onChanged={handleOrgRoleChanged}
                  />
                ))}
              </div>
            )}

            {removedMemberships.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-xs text-gray-400 mt-3 mb-1">Removed memberships</p>
                {removedMemberships.map((m) => (
                  <MembershipRoleRow
                    key={m.org_id}
                    userId={user.id}
                    membership={m}
                    onChanged={handleOrgRoleChanged}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Security ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Security</p>
            <div className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Password reset</p>
                  <p className="text-xs text-gray-500 mt-0.5">Send a reset email to {user.email}</p>
                </div>
                <button onClick={handlePasswordReset} disabled={resetLoading || resetSent}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                  {resetLoading ? 'Sending…' : resetSent ? '✓ Sent' : 'Send reset'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
          {error && (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}
          {success && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✓ User profile updated successfully
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
