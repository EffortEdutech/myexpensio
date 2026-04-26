'use client'
// apps/cs/components/WorkspaceMembersDrawer.tsx
// FIXED: AGENT workspaces now show ALL members in two groups:
//   - Agency Staff (OWNER, SALES, FINANCE)
//   - Individual Subscribers (EMPLOYEE)
// Role change allows moving between ANY role including EMPLOYEE↔STAFF.

import { useEffect, useState, useCallback } from 'react'

type Profile = {
  id: string; email: string | null; display_name: string | null
  role: string; department: string | null
}

type Member = {
  org_id: string; user_id: string; org_role: string
  status: 'ACTIVE' | 'REMOVED'; created_at: string
  profiles: Profile | null
}

export type DrawerWorkspace = {
  id: string; name: string; workspace_type: 'TEAM' | 'AGENT' | 'INTERNAL'
}

// ── Role options per workspace type ───────────────────────────────────────────

const TEAM_ROLES  = ['OWNER', 'ADMIN', 'MANAGER', 'EMPLOYEE']
const AGENT_ROLES = ['OWNER', 'SALES', 'FINANCE', 'EMPLOYEE']  // EMPLOYEE = subscriber

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

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_CLS[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  )
}

function initials(profile: Profile | null) {
  return (profile?.display_name ?? profile?.email ?? '?').slice(0, 2).toUpperCase()
}

function fmt(val: string) {
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' }, { bg: '#dcfce7', text: '#166534' },
  { bg: '#f3e8ff', text: '#6b21a8' }, { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fee2e2', text: '#991b1b' },
]

// ── Member row ─────────────────────────────────────────────────────────────────

function MemberRow({
  member, orgId, workspaceType, isSuperAdmin, onChanged,
}: {
  member: Member; orgId: string; workspaceType: 'TEAM' | 'AGENT' | 'INTERNAL'
  isSuperAdmin: boolean; onChanged: () => void
}) {
  const [changingRole, setChangingRole] = useState(false)
  const [newRole, setNewRole]           = useState(member.org_role)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // All roles available for role change — includes EMPLOYEE for both TEAM and AGENT
  const availableRoles = workspaceType === 'AGENT' ? AGENT_ROLES : TEAM_ROLES
  const isRemoved = member.status === 'REMOVED'

  async function handleRoleChange() {
    if (newRole === member.org_role) { setChangingRole(false); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/console/workspaces/${orgId}/members`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: member.user_id, org_role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setChangingRole(false); onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  async function handleRemove() {
    if (!confirm(`Remove ${member.profiles?.display_name ?? member.profiles?.email} from this workspace?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/console/workspaces/${orgId}/members`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: member.user_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      onChanged()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  const ci    = member.user_id.charCodeAt(0) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[ci]

  return (
    <div className={`py-3 border-b border-gray-50 last:border-0 ${isRemoved ? 'opacity-40' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div style={{ background: color.bg, color: color.text }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
          {initials(member.profiles)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {member.profiles?.display_name ?? member.profiles?.email ?? 'Unknown'}
            {isRemoved && <span className="ml-1.5 text-xs text-gray-400 font-normal italic">removed</span>}
          </div>
          {member.profiles?.display_name && (
            <div className="text-xs text-gray-400 truncate">{member.profiles.email}</div>
          )}
          <div className="text-xs text-gray-400 mt-0.5">Joined {fmt(member.created_at)}</div>
        </div>

        {/* Role + actions */}
        <div className="flex-shrink-0 text-right">
          {!changingRole ? (
            <div className="flex items-center gap-2">
              <RoleBadge role={member.org_role} />
              {!isRemoved && (
                <div className="flex items-center gap-1">
                  <button onClick={() => { setChangingRole(true); setNewRole(member.org_role) }}
                    className="text-gray-400 hover:text-blue-600" title="Change role">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  {isSuperAdmin && (
                    <button onClick={handleRemove} disabled={loading}
                      className="text-gray-400 hover:text-red-500 ml-0.5" title="Remove member">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 min-w-36">
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500">
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}{workspaceType === 'AGENT' && r === 'EMPLOYEE' ? ' (Subscriber)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex gap-1.5 justify-end">
                <button onClick={() => setChangingRole(false)}
                  className="text-xs text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded border border-gray-200">Cancel</button>
                <button onClick={handleRoleChange} disabled={loading}
                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-2 py-0.5 rounded disabled:opacity-50">
                  {loading ? '…' : 'Save'}
                </button>
              </div>
              {newRole === 'EMPLOYEE' && member.org_role !== 'EMPLOYEE' && workspaceType === 'AGENT' && (
                <p className="text-xs text-purple-600">Will become an individual subscriber</p>
              )}
              {newRole !== 'EMPLOYEE' && member.org_role === 'EMPLOYEE' && workspaceType === 'AGENT' && (
                <p className="text-xs text-blue-600">Will become agency staff</p>
              )}
            </div>
          )}
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Add member form ────────────────────────────────────────────────────────────

function AddMemberForm({ orgId, workspaceType, onAdded }: {
  orgId: string; workspaceType: 'TEAM' | 'AGENT' | 'INTERNAL'; onAdded: () => void
}) {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [role, setRole]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const roleOptions = workspaceType === 'TEAM'
    ? [
        { value: 'OWNER',    label: 'Owner — full control' },
        { value: 'ADMIN',    label: 'Admin — finance/HR' },
        { value: 'MANAGER',  label: 'Manager — views all claims' },
        { value: 'EMPLOYEE', label: 'Employee — submits own claims' },
      ]
    : workspaceType === 'AGENT'
      ? [
          { value: 'OWNER',    label: 'Owner — full agency control' },
          { value: 'SALES',    label: 'Sales — invites customers' },
          { value: 'FINANCE',  label: 'Finance — views commission' },
          { value: 'EMPLOYEE', label: 'Subscriber — individual paying user' },
        ]
      : [
          { value: 'OWNER',  label: 'Owner' },
          { value: 'MEMBER', label: 'Member' },
        ]

  async function handleAdd() {
    if (!email.trim() || !role) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/console/workspaces/${orgId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), org_role: role, display_name: name.trim() || undefined }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to add member')
      setSuccess(json.message); setEmail(''); setName(''); setRole('')
      onAdded()
      setTimeout(() => setSuccess(null), 5000)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error adding member') }
    finally { setLoading(false) }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Add Member</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Display name (optional)</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ahmad bin Ali"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select a role…</option>
            {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        {error   && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        {success && <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ {success}</div>}
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
          New email → invite sent automatically. Existing email → added immediately.
        </div>
        <button onClick={handleAdd} disabled={loading || !email.trim() || !role}
          className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? 'Adding…' : 'Add Member'}
        </button>
      </div>
    </div>
  )
}

// ── Main drawer ────────────────────────────────────────────────────────────────

export default function WorkspaceMembersDrawer({
  workspace, isSuperAdmin, onClose,
}: {
  workspace: DrawerWorkspace; isSuperAdmin: boolean; onClose: () => void
}) {
  const [members, setMembers]         = useState<Member[]>([])
  const [loading, setLoading]         = useState(true)
  const [showInactive, setShowInactive] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/console/workspaces/${workspace.id}/members`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setMembers(json.members ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [workspace.id])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const activeMembers  = members.filter((m) => m.status === 'ACTIVE')
  const removedMembers = members.filter((m) => m.status === 'REMOVED')
  const displayed      = showInactive ? members : activeMembers

  // For AGENT: split into staff + subscribers
  const isAgent      = workspace.workspace_type === 'AGENT'
  const agentStaff   = isAgent ? displayed.filter((m) => m.org_role !== 'EMPLOYEE') : displayed
  const subscribers  = isAgent ? displayed.filter((m) => m.org_role === 'EMPLOYEE') : []

  const typeBadgeCls = workspace.workspace_type === 'TEAM'
    ? 'bg-blue-50 text-blue-700'
    : workspace.workspace_type === 'AGENT'
      ? 'bg-purple-50 text-purple-700'
      : 'bg-amber-50 text-amber-700'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">{workspace.name}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeBadgeCls}`}>{workspace.workspace_type}</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
              {removedMembers.length > 0 && ` · ${removedMembers.length} removed`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Member list */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading…</div>
          ) : (
            <>
              {/* Show removed toggle */}
              {removedMembers.length > 0 && (
                <div className="flex justify-end mb-2">
                  <button onClick={() => setShowInactive((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
                    {showInactive ? 'Hide removed' : `Show ${removedMembers.length} removed`}
                  </button>
                </div>
              )}

              {/* AGENT: two groups */}
              {isAgent ? (
                <>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Agency Staff ({agentStaff.length})
                    <span className="ml-1 text-gray-300 font-normal normal-case">Owner · Sales · Finance</span>
                  </p>
                  {agentStaff.length === 0 ? (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-center mb-4">No agency staff</div>
                  ) : (
                    <div className="mb-4">
                      {agentStaff.map((m) => (
                        <MemberRow key={m.user_id} member={m} orgId={workspace.id}
                          workspaceType={workspace.workspace_type} isSuperAdmin={isSuperAdmin} onChanged={fetchMembers} />
                      ))}
                    </div>
                  )}

                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    Individual Subscribers ({subscribers.length})
                    <span className="ml-1 text-gray-300 font-normal normal-case">EMPLOYEE role</span>
                  </p>
                  {subscribers.length === 0 ? (
                    <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 text-center">
                      No subscribers yet — add via Members & Onboarding or invite via Agent Workspace referrals
                    </div>
                  ) : (
                    <div>
                      {subscribers.map((m) => (
                        <MemberRow key={m.user_id} member={m} orgId={workspace.id}
                          workspaceType={workspace.workspace_type} isSuperAdmin={isSuperAdmin} onChanged={fetchMembers} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // TEAM / INTERNAL: flat list
                <>
                  {displayed.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-sm text-gray-400">No members yet</div>
                  ) : displayed.map((m) => (
                    <MemberRow key={m.user_id} member={m} orgId={workspace.id}
                      workspaceType={workspace.workspace_type} isSuperAdmin={isSuperAdmin} onChanged={fetchMembers} />
                  ))}
                </>
              )}

              {/* Add member form */}
              <AddMemberForm orgId={workspace.id} workspaceType={workspace.workspace_type} onAdded={fetchMembers} />
            </>
          )}
        </div>
      </div>
    </>
  )
}
