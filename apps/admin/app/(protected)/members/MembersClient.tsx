// apps/admin/app/(protected)/members/MembersClient.tsx
'use client'

import { useState } from 'react'
import type { OrgRole } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────
type MemberRow = {
  org_id: string
  user_id: string
  org_role: OrgRole
  status: string
  created_at: string
  profiles: { id: string; email: string | null; display_name: string | null } | null
}

type InvitationRow = {
  id: string
  email: string
  org_role: OrgRole
  status: string
  expires_at: string
  created_at: string
}

type Props = {
  initialMembers:     MemberRow[]
  initialInvitations: InvitationRow[]
  currentUserId:      string
  currentOrgRole:     OrgRole | null
  isPlatformAdmin:    boolean
}

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const colours: Record<string, string> = {
    OWNER:   'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    MEMBER:  'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours[role] ?? colours.MEMBER}`}>
      {role}
    </span>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === 'ACTIVE'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
      {status}
    </span>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MembersClient({
  initialMembers,
  initialInvitations,
  currentUserId,
  currentOrgRole,
  isPlatformAdmin,
}: Props) {
  const [members, setMembers]         = useState(initialMembers)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [loading, setLoading]         = useState(false)
  const [toast, setToast]             = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // Invite modal state
  const [showInvite, setShowInvite]   = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<OrgRole>('MEMBER')
  const [inviteLoading, setInviteLoading] = useState(false)

  const canManage = isPlatformAdmin || currentOrgRole === 'OWNER'
  const isOwner   = isPlatformAdmin || currentOrgRole === 'OWNER'

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Send invite ─────────────────────────────────────────────────────────────
  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    try {
      const res = await fetch('/api/admin/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, org_role: inviteRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setInvitations((prev) => [json.invitation, ...prev])
      setShowInvite(false)
      setInviteEmail('')
      showToast('ok', `Invitation sent to ${inviteEmail}`)
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to send invite')
    } finally {
      setInviteLoading(false)
    }
  }

  // ── Change role ─────────────────────────────────────────────────────────────
  async function handleRoleChange(userId: string, newRole: OrgRole) {
    if (!confirm(`Change this member's role to ${newRole}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_role: newRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setMembers((prev) =>
        prev.map((m) => m.user_id === userId ? { ...m, org_role: newRole } : m)
      )
      showToast('ok', 'Role updated')
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to update role')
    } finally {
      setLoading(false)
    }
  }

  // ── Remove member ───────────────────────────────────────────────────────────
  async function handleRemove(userId: string, email: string | null) {
    if (!confirm(`Remove ${email ?? userId} from this organisation?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/members/${userId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
      showToast('ok', 'Member removed')
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const activeMembers  = members.filter((m) => m.status === 'ACTIVE')
  const removedMembers = members.filter((m) => m.status === 'REMOVED')

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                       hover:bg-blue-700 transition-colors"
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium
          ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Active members table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Active Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Name / Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                {isOwner && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    No members yet.
                  </td>
                </tr>
              )}
              {activeMembers.map((m) => {
                const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
                const isSelf = m.user_id === currentUserId
                return (
                  <tr key={m.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {profile?.display_name ?? '—'}
                        {isSelf && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                      </div>
                      <div className="text-xs text-gray-500">{profile?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={m.org_role} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(m.created_at).toLocaleDateString('en-MY')}
                    </td>
                    {isOwner && (
                      <td className="px-4 py-3">
                        {!isSelf && (
                          <div className="flex items-center gap-2 justify-end">
                            <select
                              value={m.org_role}
                              disabled={loading}
                              onChange={(e) => handleRoleChange(m.user_id, e.target.value as OrgRole)}
                              className="text-xs border border-gray-200 rounded px-2 py-1
                                         text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              <option value="OWNER">Owner</option>
                              <option value="MANAGER">Manager</option>
                              <option value="MEMBER">Member</option>
                            </select>
                            <button
                              onClick={() => handleRemove(m.user_id, profile?.email ?? null)}
                              disabled={loading}
                              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Pending Invitations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-700">{inv.email}</td>
                    <td className="px-4 py-3"><RoleBadge role={inv.org_role} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(inv.expires_at).toLocaleDateString('en-MY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Removed members (collapsed) */}
      {removedMembers.length > 0 && (
        <details className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <summary className="px-5 py-4 text-sm font-semibold text-gray-500 cursor-pointer hover:text-gray-700">
            Removed Members ({removedMembers.length})
          </summary>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-50">
                {removedMembers.map((m) => {
                  const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles
                  return (
                    <tr key={m.user_id} className="opacity-60">
                      <td className="px-5 py-3">
                        <div className="font-medium text-gray-700">{profile?.display_name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{profile?.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}

      {/* ── Invite Modal ──────────────────────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">Invite Member</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isOwner && <option value="OWNER">Owner</option>}
                  {isOwner && <option value="MANAGER">Manager</option>}
                  <option value="MEMBER">Member</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowInvite(false); setInviteEmail('') }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm
                             font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm
                             font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {inviteLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
