'use client'
// apps/admin/app/(protected)/members/MembersClient.tsx
//
// Members & Onboarding console
// - shows all platform users
// - shows org memberships
// - provisions direct access to a selected org
// - sends onboarding email via /api/beta/provision-user
// - allows role change and removal from org

import { useMemo, useState } from 'react'

type Profile = {
  id: string
  email: string | null
  display_name: string | null
  role: string
  created_at: string
}

type Membership = {
  org_id: string
  user_id: string
  org_role: string
  status: string
  created_at: string
  organizations: { name: string } | null
}

type Invite = {
  id: string
  org_id: string
  email: string
  org_role: string
  status: string
  expires_at: string
  created_at: string
  organizations: { name: string } | null
}

type Org = {
  id: string
  name: string
}

type OrgRole = 'OWNER' | 'MANAGER' | 'MEMBER'

type ProvisionResponse = {
  success?: boolean
  mode?: 'CREATED' | 'RESET' | 'ALREADY_EXISTS'
  user?: {
    id: string
    email: string
    display_name: string
  }
  org?: {
    id: string
    name: string
    org_role: OrgRole
  }
  credentials?: {
    email: string
    temp_password: string | null
    note?: string
  }
  email_delivery?: {
    attempted?: boolean
    sent?: boolean
    message?: string
    message_id?: string
  }
  error?: {
    code?: string
    message?: string
  }
}

function RoleBadge({ role }: { role: string }) {
  const c: Record<string, string> = {
    OWNER: 'bg-purple-100 text-purple-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-gray-100 text-gray-600',
  }

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c[role] ?? c.MEMBER}`}>
      {role}
    </span>
  )
}

function PlatformBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
        role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {role === 'ADMIN' ? '⚡ Admin' : 'User'}
    </span>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'

  return d.toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MembersClient({
  initialProfiles,
  initialMemberships,
  initialInvitations,
  orgs,
}: {
  initialProfiles: Profile[]
  initialMemberships: Membership[]
  initialInvitations: Invite[]
  orgs: Org[]
}) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [memberships, setMemberships] = useState(initialMemberships)
  const [invitations, setInvitations] = useState(initialInvitations)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [orgFilter, setOrgFilter] = useState('ALL')

  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  const [showProvision, setShowProvision] = useState(false)
  const [pEmail, setPEmail] = useState('')
  const [pDisplayName, setPDisplayName] = useState('')
  const [pOrgId, setPOrgId] = useState('')
  const [pRole, setPRole] = useState<OrgRole>('MEMBER')
  const [pResetIfExists, setPResetIfExists] = useState(false)
  const [pLoading, setPLoading] = useState(false)
  const [pError, setPError] = useState<string | null>(null)
  const [pResult, setPResult] = useState<ProvisionResponse | null>(null)
  const [copied, setCopied] = useState<'email' | 'password' | 'all' | null>(null)

  const defaultOrg = useMemo(() => {
    return orgs.find((o) => o.name === 'Beta Organisation') ?? orgs[0] ?? null
  }, [orgs])

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const membershipsByUser: Record<string, Membership[]> = {}
  for (const m of memberships) {
    if (!membershipsByUser[m.user_id]) membershipsByUser[m.user_id] = []
    membershipsByUser[m.user_id].push(m)
  }

  const filtered = profiles.filter((p) => {
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false

    if (orgFilter !== 'ALL') {
      const userMemberships = membershipsByUser[p.id] ?? []
      if (!userMemberships.some((m) => m.org_id === orgFilter)) return false
    }

    if (search) {
      const q = search.toLowerCase()
      if (
        !p.email?.toLowerCase().includes(q) &&
        !p.display_name?.toLowerCase().includes(q)
      ) {
        return false
      }
    }

    return true
  })

  function openProvisionFor(profile?: Profile) {
    setPEmail(profile?.email ?? '')
    setPDisplayName(profile?.display_name ?? profile?.email ?? '')
    setPOrgId(defaultOrg?.id ?? '')
    setPRole('MEMBER')
    setPResetIfExists(false)
    setPError(null)
    setPResult(null)
    setCopied(null)
    setShowProvision(true)
  }

  function upsertLocalProfile(nextProfile: Profile) {
    setProfiles((prev) => {
      const idx = prev.findIndex((p) => p.id === nextProfile.id)
      if (idx === -1) return [nextProfile, ...prev]

      const copy = [...prev]
      copy[idx] = { ...copy[idx], ...nextProfile }
      return copy
    })
  }

  function upsertLocalMembership(params: {
    userId: string
    orgId: string
    orgName: string
    orgRole: string
  }) {
    setMemberships((prev) => {
      const idx = prev.findIndex(
        (m) => m.user_id === params.userId && m.org_id === params.orgId,
      )

      const nextRow: Membership = {
        user_id: params.userId,
        org_id: params.orgId,
        org_role: params.orgRole,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        organizations: { name: params.orgName },
      }

      if (idx === -1) return [nextRow, ...prev]

      const copy = [...prev]
      copy[idx] = {
        ...copy[idx],
        org_role: params.orgRole,
        status: 'ACTIVE',
        organizations: { name: params.orgName },
      }
      return copy
    })
  }

  async function handleProvision(e: React.FormEvent) {
    e.preventDefault()
    setPError(null)
    setPResult(null)

    const email = pEmail.trim().toLowerCase()
    if (!email) {
      setPError('Email is required.')
      return
    }

    if (!pOrgId) {
      setPError('Please select an organisation.')
      return
    }

    setPLoading(true)

    try {
      const res = await fetch('/api/beta/provision-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: pOrgId,
          email,
          org_role: pRole,
          display_name: pDisplayName.trim() || email,
          reset_if_exists: pResetIfExists,
          send_email: true,
        }),
      })

      const json: ProvisionResponse = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message ?? 'Failed to provision user.')
      }

      setPResult(json)

      if (json.user?.id && json.user?.email) {
        upsertLocalProfile({
          id: json.user.id,
          email: json.user.email,
          display_name: json.user.display_name ?? email,
          role: 'USER',
          created_at: new Date().toISOString(),
        })
      }

      if (json.user?.id && json.org?.id && json.org?.name && json.org?.org_role) {
        upsertLocalMembership({
          userId: json.user.id,
          orgId: json.org.id,
          orgName: json.org.name,
          orgRole: json.org.org_role,
        })
      }

      toast_(
        'ok',
        json.email_delivery?.sent
          ? `User provisioned and email sent to ${email}`
          : `User provisioned for ${email}`,
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed'
      setPError(msg)
      toast_('err', msg)
    } finally {
      setPLoading(false)
    }
  }

  async function copyText(kind: 'email' | 'password' | 'all') {
    if (!pResult?.credentials?.email) return

    let text = ''

    if (kind === 'email') {
      text = pResult.credentials.email
    } else if (kind === 'password') {
      text = pResult.credentials.temp_password ?? ''
    } else {
      text = [
        `Organisation: ${pResult.org?.name ?? '—'}`,
        `Email: ${pResult.credentials.email}`,
        `Temporary password: ${pResult.credentials.temp_password ?? '(not reset)'}`,
      ].join('\n')
    }

    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      setTimeout(() => setCopied(null), 1200)
    } catch {
      setCopied(null)
    }
  }

  async function handleRoleChange(m: Membership, newRole: string) {
    if (!confirm(`Change role to ${newRole}?`)) return

    const key = `${m.org_id}-${m.user_id}`
    setBusy(key)

    try {
      const res = await fetch(`/api/admin/members/${m.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_role: newRole, org_id: m.org_id }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setMemberships((prev) =>
        prev.map((x) =>
          x.org_id === m.org_id && x.user_id === m.user_id
            ? { ...x, org_role: newRole }
            : x,
        ),
      )

      toast_('ok', 'Role updated')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleRemove(m: Membership) {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations
    if (!confirm(`Remove from ${org?.name ?? 'this org'}?`)) return

    const key = `${m.org_id}-${m.user_id}`
    setBusy(key)

    try {
      const res = await fetch(`/api/admin/members/${m.user_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: m.org_id }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setMemberships((prev) =>
        prev.filter((x) => !(x.org_id === m.org_id && x.user_id === m.user_id)),
      )

      toast_('ok', 'Member removed')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function handleRevokeInvite(id: string) {
    if (!confirm('Revoke this invitation?')) return

    const res = await fetch(`/api/admin/invitations/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitations((prev) => prev.filter((i) => i.id !== id))
      toast_('ok', 'Invitation revoked')
    } else {
      toast_('err', 'Failed to revoke')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Members &amp; Onboarding</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {profiles.length} users on the platform ·{' '}
            {memberships.filter((m) => m.status === 'ACTIVE').length} active org memberships
          </p>
        </div>

        <button
          onClick={() => openProvisionFor()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          + Add User to Organisation
        </button>
      </div>

      {toast && (
        <div
          className={`px-4 py-2.5 rounded-lg text-sm font-medium ${
            toast.type === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {showProvision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Add User to Organisation
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Provision the account first, attach it to the selected org, then send the onboarding email.
            </p>

            <form onSubmit={handleProvision} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisation <span className="text-red-500">*</span>
                </label>
                <select
                  value={pOrgId}
                  onChange={(e) => setPOrgId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select organisation…</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={pEmail}
                  onChange={(e) => setPEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={pDisplayName}
                  onChange={(e) => setPDisplayName(e.target.value)}
                  placeholder={pEmail.trim().toLowerCase() || 'Defaults to email'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Leave blank to default to email address.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={pRole}
                  onChange={(e) => setPRole(e.target.value as OrgRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MEMBER">Member</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={pResetIfExists}
                  onChange={(e) => setPResetIfExists(e.target.checked)}
                />
                <span>Reset temporary password if user already exists</span>
              </label>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600 leading-6">
                <div>
                  <strong>Provision flow:</strong>
                </div>
                <div>• create / update auth user</div>
                <div>• upsert profile</div>
                <div>• upsert org membership for selected org</div>
                <div>• generate temporary password</div>
                <div>• send onboarding email after provisioning succeeds</div>
              </div>

              {pError && (
                <div className="px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-sm text-red-700">
                  {pError}
                </div>
              )}

              {pResult?.success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="text-sm font-semibold text-green-800">
                    {pResult.mode === 'CREATED'
                      ? 'User created'
                      : pResult.mode === 'RESET'
                        ? 'Temporary password reset'
                        : 'User already exists'}
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-y-2 gap-x-3 text-sm">
                    <div className="text-green-700 font-medium">Organisation</div>
                    <div className="text-green-900 break-all">
                      {pResult.org?.name ?? '—'}
                    </div>

                    <div className="text-green-700 font-medium">Email</div>
                    <div className="text-green-900 break-all">
                      {pResult.credentials?.email ?? '—'}
                    </div>

                    <div className="text-green-700 font-medium">Temp Password</div>
                    <div className="text-green-900 font-mono break-all">
                      {pResult.credentials?.temp_password ?? 'Not reset'}
                    </div>

                    <div className="text-green-700 font-medium">Role</div>
                    <div className="text-green-900">
                      {pResult.org?.org_role ?? pRole}
                    </div>

                    <div className="text-green-700 font-medium">Email Delivery</div>
                    <div className="text-green-900">
                      {pResult.email_delivery?.attempted
                        ? pResult.email_delivery?.sent
                          ? 'Sent'
                          : 'Failed'
                        : 'Not attempted'}
                    </div>
                  </div>

                  {pResult.credentials?.note && (
                    <div className="text-xs text-green-700 leading-5">
                      {pResult.credentials.note}
                    </div>
                  )}

                  {pResult.email_delivery?.message && (
                    <div className="text-xs text-green-700 leading-5">
                      {pResult.email_delivery.message}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyText('email')}
                      className="px-3 py-1.5 rounded-lg border border-green-300 bg-white text-xs font-medium text-green-700 hover:bg-green-50"
                    >
                      {copied === 'email' ? 'Copied Email' : 'Copy Email'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText('password')}
                      disabled={!pResult.credentials?.temp_password}
                      className="px-3 py-1.5 rounded-lg border border-green-300 bg-white text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                    >
                      {copied === 'password' ? 'Copied Password' : 'Copy Password'}
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText('all')}
                      className="px-3 py-1.5 rounded-lg border border-green-300 bg-white text-xs font-medium text-green-700 hover:bg-green-50"
                    >
                      {copied === 'all' ? 'Copied All' : 'Copy All'}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProvision(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={pLoading}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {pLoading ? 'Provisioning…' : 'Provision & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or email…"
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 w-56"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="ALL">All platform roles</option>
          <option value="ADMIN">Admin only</option>
          <option value="USER">User only</option>
        </select>

        <select
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
        >
          <option value="ALL">All organisations</option>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-sm text-gray-400 self-center">
          {filtered.length} of {profiles.length} users
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Role
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Org Memberships
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.map((profile) => {
                const userMemberships = (membershipsByUser[profile.id] ?? []).filter(
                  (m) => m.status === 'ACTIVE',
                )

                return (
                  <tr key={profile.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">
                        {profile.display_name ?? '—'}
                      </div>
                      <div className="text-xs text-gray-500">{profile.email ?? '—'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <PlatformBadge role={profile.role} />
                    </td>

                    <td className="px-4 py-3">
                      {userMemberships.length === 0 ? (
                        <span className="text-xs text-gray-400 italic">
                          No org membership
                        </span>
                      ) : (
                        <div className="space-y-1.5">
                          {userMemberships.map((m) => {
                            const org = Array.isArray(m.organizations)
                              ? m.organizations[0]
                              : m.organizations
                            const key = `${m.org_id}-${m.user_id}`

                            return (
                              <div key={key} className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs text-gray-700 font-medium">
                                  {(org as { name?: string } | null)?.name ?? '—'}
                                </span>

                                <RoleBadge role={m.org_role} />

                                <select
                                  value={m.org_role}
                                  disabled={busy === key}
                                  onChange={(e) => handleRoleChange(m, e.target.value)}
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

                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(profile.created_at)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openProvisionFor(profile)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      >
                        Provision / Reset Access
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

      {invitations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">
              Legacy Pending Invitations ({invitations.length})
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Older token-based invite records kept for reference.
            </p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-400 uppercase">
                  Email
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">
                  Organisation
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">
                  Role
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-400 uppercase">
                  Expires
                </th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {invitations.map((inv) => {
                const org = Array.isArray(inv.organizations)
                  ? inv.organizations[0]
                  : inv.organizations

                return (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-gray-700">{inv.email}</td>
                    <td className="px-4 py-2.5 text-gray-600">
                      {(org as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <RoleBadge role={inv.org_role} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">
                      {fmtDate(inv.expires_at)}
                    </td>
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

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">
          Current onboarding workflow
        </h2>
        <div className="text-sm text-gray-600 leading-7">
          <div>1. Admin selects organisation and provisions the user.</div>
          <div>2. System creates or updates auth user, profile, and org membership.</div>
          <div>3. System generates a temporary password.</div>
          <div>4. System sends onboarding email after provisioning succeeds.</div>
          <div>5. User logs in and changes password in Settings.</div>
        </div>
      </div>
    </div>
  )
}