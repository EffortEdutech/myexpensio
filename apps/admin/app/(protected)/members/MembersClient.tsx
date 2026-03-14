'use client'
// apps/admin/app/(protected)/members/MembersClient.tsx
//
// Shows ALL platform users (from profiles table).
// For each user, shows their org memberships (may be zero).
// Admin can: invite user to an org, change role, remove from org.

import { useState } from 'react'

type Profile = {
  id:           string
  email:        string | null
  display_name: string | null
  role:         string
  created_at:   string
}
type Membership = {
  org_id:        string
  user_id:       string
  org_role:      string
  status:        string
  created_at:    string
  organizations: { name: string } | null
}
type Invite = {
  id:            string
  org_id:        string
  email:         string
  org_role:      string
  status:        string
  expires_at:    string
  created_at:    string
  organizations: { name: string } | null
}
type Org = { id: string; name: string }

function RoleBadge({ role }: { role: string }) {
  const c: Record<string, string> = {
    OWNER:   'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    MEMBER:  'bg-gray-100 text-gray-600',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c[role] ?? c.MEMBER}`}>{role}</span>
}

function PlatformBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
      role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {role === 'ADMIN' ? '⚡ Admin' : 'User'}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function MembersClient({
  initialProfiles,
  initialMemberships,
  initialInvitations,
  orgs,
}: {
  initialProfiles:    Profile[]
  initialMemberships: Membership[]
  initialInvitations: Invite[]
  orgs:               Org[]
}) {
  const [memberships, setMemberships] = useState(initialMemberships)
  const [invitations, setInvitations] = useState(initialInvitations)
  const [search,      setSearch]      = useState('')
  const [roleFilter,  setRoleFilter]  = useState('ALL')  // ALL | ADMIN | USER
  const [orgFilter,   setOrgFilter]   = useState('ALL')
  const [toast,       setToast]       = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy,        setBusy]        = useState<string | null>(null)

  // Invite form
  const [showInvite, setShowInvite] = useState(false)
  const [iUserId,    setIUserId]    = useState('')  // pre-fill when clicking "Invite" on a user row
  const [iEmail,     setIEmail]     = useState('')
  const [iOrg,       setIOrg]       = useState(orgs[0]?.id ?? '')
  const [iRole,      setIRole]      = useState('MEMBER')
  const [iLoading,   setILoading]   = useState(false)

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  // Build a map: user_id → their memberships
  const membershipsByUser: Record<string, Membership[]> = {}
  for (const m of memberships) {
    if (!membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = []
    membershipsByUser[m.user_id].push(m)
  }

  // Filter profiles
  const filtered = initialProfiles.filter(p => {
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false
    if (orgFilter !== 'ALL') {
      const userMemberships = membershipsByUser[p.id] ?? []
      if (!userMemberships.some(m => m.org_id === orgFilter)) return false
    }
    if (search) {
      const q = search.toLowerCase()
      if (!p.email?.toLowerCase().includes(q) && !p.display_name?.toLowerCase().includes(q)) return false
    }
    return true
  })

  function openInviteFor(profile: Profile) {
    setIUserId(profile.id)
    setIEmail(profile.email ?? '')
    setIOrg(orgs[0]?.id ?? '')
    setIRole('MEMBER')
    setShowInvite(true)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!iOrg) { toast_('err', 'Select an organisation'); return }
    setILoading(true)
    try {
      const res  = await fetch('/api/admin/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: iEmail.trim(), org_id: iOrg, org_role: iRole }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setInvitations(prev => [json.invitation, ...prev])
      setShowInvite(false); setIEmail(''); setIUserId('')
      toast_('ok', `Invitation sent to ${iEmail}`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setILoading(false) }
  }

  async function handleRoleChange(m: Membership, newRole: string) {
    if (!confirm(`Change role to ${newRole}?`)) return
    const key = `${m.org_id}-${m.user_id}`
    setBusy(key)
    try {
      const res  = await fetch(`/api/admin/members/${m.user_id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_role: newRole, org_id: m.org_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setMemberships(prev => prev.map(x =>
        x.org_id === m.org_id && x.user_id === m.user_id ? { ...x, org_role: newRole } : x
      ))
      toast_('ok', 'Role updated')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  async function handleRemove(m: Membership) {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
    if (!confirm(`Remove from ${org?.name ?? 'this org'}?`)) return
    const key = `${m.org_id}-${m.user_id}`
    setBusy(key)
    try {
      const res  = await fetch(`/api/admin/members/${m.user_id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: m.org_id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setMemberships(prev => prev.filter(x => !(x.org_id === m.org_id && x.user_id === m.user_id)))
      toast_('ok', 'Member removed')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  async function handleRevokeInvite(id: string) {
    if (!confirm('Revoke this invitation?')) return
    const res = await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitations(prev => prev.filter(i => i.id !== id))
      toast_('ok', 'Invitation revoked')
    } else {
      toast_('err', 'Failed to revoke')
    }
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {initialProfiles.length} users on the platform · {memberships.filter(m => m.status === 'ACTIVE').length} org memberships
          </p>
        </div>
        <button
          onClick={() => { setIUserId(''); setIEmail(''); setShowInvite(true) }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Invite to Org
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${
          toast.type === 'ok'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>{toast.msg}</div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Invite to Organisation</h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organisation <span className="text-red-500">*</span></label>
                <select value={iOrg} onChange={e => setIOrg(e.target.value)} required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select org…</option>
                  {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                <input type="email" value={iEmail} onChange={e => setIEmail(e.target.value)} required
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={iRole} onChange={e => setIRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowInvite(false); setIUserId('') }}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={iLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {iLoading ? 'Sending…' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
        />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All platform roles</option>
          <option value="ADMIN">Admin only</option>
          <option value="USER">User only</option>
        </select>
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="ml-auto text-sm text-gray-400 self-center">{filtered.length} of {initialProfiles.length} users</span>
      </div>

      {/* ── Users table ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Role</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Org Memberships</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(profile => {
                const userMemberships = (membershipsByUser[profile.id] ?? [])
                  .filter(m => m.status === 'ACTIVE')

                return (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{profile.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-500">{profile.email ?? '—'}</div>
                    </td>

                    {/* Platform role */}
                    <td className="px-4 py-3">
                      <PlatformBadge role={profile.role} />
                    </td>

                    {/* Org memberships — each org on its own line */}
                    <td className="px-4 py-3">
                      {userMemberships.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">No org membership</span>
                      ) : (
                        <div className="space-y-1.5">
                          {userMemberships.map(m => {
                            const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
                            const key = `${m.org_id}-${m.user_id}`
                            return (
                              <div key={key} className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-700 font-medium">{(org as {name?:string}|null)?.name ?? '—'}</span>
                                <RoleBadge role={m.org_role} />
                                <select
                                  value={m.org_role}
                                  disabled={busy === key}
                                  onChange={e => handleRoleChange(m, e.target.value)}
                                  className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 focus:outline-none disabled:opacity-40"
                                >
                                  <option value="OWNER">Owner</option>
                                  <option value="MANAGER">Manager</option>
                                  <option value="MEMBER">Member</option>
                                </select>
                                <button
                                  disabled={busy === key}
                                  onClick={() => handleRemove(m)}
                                  className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                                >
                                  Remove
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(profile.created_at)}
                    </td>

                    {/* Invite action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openInviteFor(profile)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      >
                        + Invite to org
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} users shown
        </div>
      </div>

      {/* ── Pending invitations ──────────────────────────────────────────────── */}
      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Pending Invitations ({invitations.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase">Email</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Organisation</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Role</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">Expires</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invitations.map(inv => {
                const org = Array.isArray(inv.organizations) ? inv.organizations[0] : inv.organizations
                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">{inv.email}</td>
                    <td className="px-4 py-2.5 text-gray-600">{(org as {name?:string}|null)?.name ?? '—'}</td>
                    <td className="px-4 py-2.5"><RoleBadge role={inv.org_role} /></td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{fmtDate(inv.expires_at)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Revoke
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
  )
}
