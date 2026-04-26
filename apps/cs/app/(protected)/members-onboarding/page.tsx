'use client'
// apps/cs/app/(protected)/members-onboarding/page.tsx
//
// Tab 1 — Add User to Workspace
//   Console directly creates/invites a user. Supports TEAM, AGENT, INTERNAL.
//   INTERNAL workspace: extra "Platform Role" field (SUPPORT | SUPER_ADMIN).
//
// Tab 2 — Invitation Requests
//   Requests from workspace admins. Console reviews + executes.

import React, { useEffect, useState, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type WorkspaceOption = {
  id: string; name: string
  workspace_type: 'TEAM' | 'AGENT' | 'INTERNAL'
  status: string; contact_email: string | null
}

type InviteRequest = {
  id: string; workspace_id: string; workspace_type: string
  requested_email: string; requested_role: string
  status: string; rejection_reason: string | null; notes: string | null
  created_at: string; approved_at: string | null; executed_at: string | null
  organizations: { id: string; name: string; workspace_type: string } | null
  requester: { id: string; email: string | null; display_name: string | null } | null
}

// ── Role definitions ───────────────────────────────────────────────────────────

const ROLE_GROUPS: Record<string, { group?: string; roles: { value: string; label: string; desc: string }[] }[]> = {
  TEAM: [
    { roles: [
      { value: 'OWNER',    label: 'Owner',    desc: 'Full workspace control, billing, member management' },
      { value: 'ADMIN',    label: 'Admin',    desc: 'Finance / HR — configures rates, exports, manages members' },
      { value: 'MANAGER',  label: 'Manager',  desc: 'Views all team claims, manages team members' },
      { value: 'EMPLOYEE', label: 'Employee', desc: 'Submits own claims via MyExpensio user app' },
    ]},
  ],
  AGENT: [
    { group: 'Agency Staff', roles: [
      { value: 'OWNER',   label: 'Owner',   desc: 'Full agency control, commission, payout settings' },
      { value: 'SALES',   label: 'Sales',   desc: 'Invites customers, tracks referrals — Workspace App access' },
      { value: 'FINANCE', label: 'Finance', desc: 'Views commission dashboard, requests payouts' },
    ]},
    { group: 'Individual Subscriber', roles: [
      { value: 'EMPLOYEE', label: 'Subscriber', desc: 'Individual professional — uses MyExpensio, generates commission for this Agent' },
    ]},
  ],
  INTERNAL: [
    { group: 'Internal Staff Role', roles: [
      { value: 'MEMBER', label: 'Member', desc: 'Standard internal workspace membership' },
    ]},
  ],
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function TypeBadge({ type }: { type: string }) {
  const cls: Record<string, string> = {
    TEAM: 'bg-blue-50 text-blue-700', AGENT: 'bg-purple-50 text-purple-700', INTERNAL: 'bg-amber-50 text-amber-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls[type] ?? 'bg-gray-100 text-gray-500'}`}>{type}</span>
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',    cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  APPROVED: { label: 'Approved',   cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  REJECTED: { label: 'Rejected',   cls: 'bg-red-50 text-red-700 border border-red-200' },
  EXECUTED: { label: 'Completed',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  FAILED:   { label: 'Failed',     cls: 'bg-red-50 text-red-600 border border-red-200' },
}

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

// ─────────────────────────────────────────────────────────────────────────────
// Workspace search typeahead
// ─────────────────────────────────────────────────────────────────────────────

function WorkspaceSearchInput({
  value, onChange,
}: {
  value: WorkspaceOption | null; onChange: (ws: WorkspaceOption | null) => void
}) {
  const [query, setQuery]     = useState(value?.name ?? '')
  const [results, setResults] = useState<WorkspaceOption[]>([])
  const [open, setOpen]       = useState(false)
  const [searching, setSearching] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  function search(q: string) {
    if (debounce.current) clearTimeout(debounce.current)
    debounce.current = setTimeout(async () => {
      if (!q.trim()) { setResults([]); return }
      setSearching(true)
      try {
        const res = await fetch(`/api/console/workspaces-search?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setResults(json.workspaces ?? [])
        setOpen(true)
      } catch { /* silent */ }
      finally { setSearching(false) }
    }, 250)
  }

  function select(ws: WorkspaceOption) { onChange(ws); setQuery(ws.name); setOpen(false) }
  function clear() { onChange(null); setQuery(''); setResults([]); setOpen(false) }

  return (
    <div className="relative">
      <div className="relative">
        <input type="text" value={query}
          onChange={(e) => { setQuery(e.target.value); if (e.target.value) search(e.target.value); else clear() }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Type workspace name…"
          className={INPUT} autoComplete="off"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}
        {value && !searching && (
          <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {results.map((ws) => (
            <button key={ws.id} onClick={() => select(ws)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left transition-colors">
              <TypeBadge type={ws.workspace_type} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{ws.name}</div>
                {ws.contact_email && <div className="text-xs text-gray-400 truncate">{ws.contact_email}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
      {value && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
          <TypeBadge type={value.workspace_type} />
          <span className="text-sm font-medium text-blue-800 flex-1">{value.name}</span>
          <span className="text-xs text-blue-400 font-mono">{value.id.slice(0, 8)}…</span>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: Add User to Workspace
// ─────────────────────────────────────────────────────────────────────────────

function AddUserTab() {
  const [workspace, setWorkspace]     = useState<WorkspaceOption | null>(null)
  const [email, setEmail]             = useState('')
  const [displayName, setDisplayName] = useState('')
  const [orgRole, setOrgRole]         = useState('')
  const [platformRole, setPlatformRole] = useState<'SUPPORT' | 'SUPER_ADMIN'>('SUPPORT')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [result, setResult]           = useState<{ message: string; user_existed: boolean } | null>(null)

  const isInternal = workspace?.workspace_type === 'INTERNAL'
  const roleGroups = workspace ? (ROLE_GROUPS[workspace.workspace_type] ?? []) : []

  useEffect(() => { setOrgRole('') }, [workspace?.id])

  async function handleAdd() {
    if (!workspace || !email.trim() || !orgRole) return
    if (isInternal && !platformRole) return

    setLoading(true); setError(null); setResult(null)
    try {
      const body: Record<string, unknown> = {
        email:        email.trim(),
        org_role:     orgRole,
        display_name: displayName.trim() || undefined,
      }
      if (isInternal) body.platform_role = platformRole

      const res = await fetch(`/api/console/workspaces/${workspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to add user')
      setResult({ message: json.message, user_existed: json.user_existed })
      setEmail(''); setDisplayName(''); setOrgRole('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setWorkspace(null); setEmail(''); setDisplayName('')
    setOrgRole(''); setPlatformRole('SUPPORT')
    setResult(null); setError(null)
  }

  const canSubmit = workspace && email.trim() && orgRole && (!isInternal || platformRole)

  return (
    <div className="max-w-lg space-y-5">
      {/* Success */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                {result.user_existed ? 'User added to workspace' : 'Invite sent and user added'}
              </p>
              <p className="text-xs text-green-600 mt-0.5">{result.message}</p>
              <button onClick={handleReset} className="mt-2 text-xs text-green-700 underline">
                Add another user
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Workspace */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
          <h3 className="text-sm font-semibold text-gray-900">Select Workspace</h3>
        </div>
        <WorkspaceSearchInput value={workspace} onChange={setWorkspace} />
      </div>

      {/* Step 2: User details + role */}
      {workspace && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <h3 className="text-sm font-semibold text-gray-900">User Details</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email address *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com" className={INPUT} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Display name (optional)</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ahmad bin Ali" className={INPUT} />
          </div>

          {/* INTERNAL workspace: Platform Role field (shown first, most important) */}
          {isInternal && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Platform Role *</label>
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 mb-3">
                This sets <code>profiles.role</code> — controls which apps the user can access.
                Choose carefully. SUPER_ADMIN has full platform control.
              </div>
              <div className="space-y-2">
                {[
                  {
                    value: 'SUPPORT' as const,
                    label: 'Support',
                    desc: 'Internal support staff — Console access (limited) + Workspace App read',
                  },
                  {
                    value: 'SUPER_ADMIN' as const,
                    label: 'Super Admin',
                    desc: 'Full platform control — all 3 apps, all operations, system config',
                  },
                ].map((r) => (
                  <label key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      platformRole === r.value ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="platformRole" value={r.value}
                      checked={platformRole === r.value}
                      onChange={() => setPlatformRole(r.value)}
                      className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={`text-sm font-medium ${platformRole === r.value ? 'text-amber-700' : 'text-gray-900'}`}>
                        {r.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Workspace role */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {isInternal ? 'Internal Workspace Role *' : `Role in ${workspace.workspace_type} workspace *`}
            </label>
            <div className="space-y-2">
              {roleGroups.map((group, gi) => (
                <div key={gi}>
                  {group.group && (
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {group.group}
                    </p>
                  )}
                  {group.roles.map((r) => {
                    const isSubscriber = workspace.workspace_type === 'AGENT' && r.value === 'EMPLOYEE'
                    const activeColor = isSubscriber ? 'border-purple-600 bg-purple-50' : 'border-blue-600 bg-blue-50'
                    const textColor = isSubscriber ? 'text-purple-700' : 'text-blue-700'
                    return (
                      <label key={r.value}
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all mb-1 ${
                          orgRole === r.value ? activeColor : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}>
                        <input type="radio" name="orgRole" value={r.value}
                          checked={orgRole === r.value}
                          onChange={() => setOrgRole(r.value)}
                          className="mt-0.5 flex-shrink-0" />
                        <div>
                          <div className={`text-sm font-medium ${orgRole === r.value ? textColor : 'text-gray-900'}`}>
                            {r.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Confirm + Submit */}
      {canSubmit && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <h3 className="text-sm font-semibold text-gray-900">Confirm & Add</h3>
          </div>

          <div className="space-y-2 mb-4">
            {[
              { label: 'Workspace',  value: workspace!.name },
              { label: 'Type',       value: workspace!.workspace_type },
              { label: 'Email',      value: email.trim() },
              { label: 'Name',       value: displayName.trim() || '(not set)' },
              ...(isInternal ? [{ label: 'Platform Role', value: platformRole }] : []),
              { label: 'Workspace Role', value: orgRole },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-4">
            New email → invite sent, user added after accepting.<br />
            Already registered → added to workspace immediately.
          </p>

          {error && (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
          )}

          <button onClick={handleAdd} disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Adding user…' : 'Add User to Workspace'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: Invitation Requests
// ─────────────────────────────────────────────────────────────────────────────

function RejectModal({ request, onClose, onDone }: {
  request: InviteRequest; onClose: () => void; onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/console/invitation-queue/${request.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error?.message ?? 'Failed') }
      onDone(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Reject Request</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{request.requested_email}</strong> → {request.organizations?.name ?? '—'}
        </p>
        <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why…" rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3" />
        {error && <p className="mb-3 text-xs text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={handleReject} disabled={loading || !reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {loading ? 'Rejecting…' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ExecuteModal({ request, onClose, onDone }: {
  request: InviteRequest; onClose: () => void
  onDone: (r: { user_existed: boolean }) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleExecute() {
    setLoading(true); setError(null)
    try {
      if (request.status === 'PENDING') {
        const r = await fetch(`/api/console/invitation-queue/${request.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'approve' }),
        })
        if (!r.ok) { const j = await r.json(); throw new Error(j.error?.message ?? 'Approve failed') }
      }
      const r = await fetch(`/api/console/invitation-queue/${request.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json.error?.message ?? 'Execute failed')
      onDone({ user_existed: json.user_existed ?? false }); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Execution failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          {request.status === 'PENDING' ? 'Approve & Execute' : 'Execute'}
        </h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
          {[
            ['Email',     request.requested_email],
            ['Workspace', request.organizations?.name ?? '—'],
            ['Type',      request.workspace_type],
            ['Role',      request.requested_role],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-gray-500">{k}</span>
              <span className="text-gray-900 font-medium">{v}</span>
            </div>
          ))}
        </div>
        {request.notes && (
          <div className="mb-4 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
            <strong>Note from requester:</strong> {request.notes}
          </div>
        )}
        {error && <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button onClick={handleExecute} disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Executing…' : request.status === 'PENDING' ? 'Approve & Execute' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  )
}

type InvTabKey = 'pending' | 'approved' | 'executed' | 'rejected'
const INV_TABS: { key: InvTabKey; label: string; status: string }[] = [
  { key: 'pending',  label: 'Pending',   status: 'PENDING' },
  { key: 'approved', label: 'Approved',  status: 'APPROVED' },
  { key: 'executed', label: 'Completed', status: 'EXECUTED' },
  { key: 'rejected', label: 'Rejected',  status: 'REJECTED' },
]

function InvitationRequestsTab() {
  const [invTab, setInvTab]             = useState<InvTabKey>('pending')
  const [requests, setRequests]         = useState<InviteRequest[]>([])
  const [total, setTotal]               = useState(0)
  const [loading, setLoading]           = useState(true)
  const [execTarget, setExecTarget]     = useState<InviteRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<InviteRequest | null>(null)
  const [successMsg, setSuccessMsg]     = useState<string | null>(null)

  const currentTab = INV_TABS.find((t) => t.key === invTab)!

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page_size: '100', status: currentTab.status })
      const res = await fetch(`/api/console/invitation-queue?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRequests(json.requests ?? []); setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [currentTab.status])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  function handleExecDone({ user_existed }: { user_existed: boolean }) {
    setSuccessMsg(user_existed
      ? 'User already existed — workspace membership granted, invite email resent.'
      : 'User account created — invite email sent successfully.')
    setTimeout(() => setSuccessMsg(null), 6000)
    fetchRequests()
  }

  return (
    <div className="space-y-4">
      {execTarget && <ExecuteModal request={execTarget} onClose={() => setExecTarget(null)} onDone={handleExecDone} />}
      {rejectTarget && <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onDone={fetchRequests} />}

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">✓ {successMsg}</div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        These are requests submitted by workspace admins via Expensio Workspace. Console staff review and execute.
        To bypass this queue, use the <strong>Add User to Workspace</strong> tab.
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {INV_TABS.map((t) => (
          <button key={t.key} onClick={() => setInvTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              invTab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-gray-400 pr-1">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            {invTab === 'pending' ? '✓ No pending requests — queue is clear' : `No ${currentTab.label.toLowerCase()} requests`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Email','Workspace','Role','Requested by','Status','Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.PENDING
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{r.requested_email}</div>
                        {r.notes && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-36">{r.notes}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">{r.organizations?.name ?? '—'}</div>
                        <TypeBadge type={r.workspace_type} />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{r.requested_role}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600">{r.requester?.display_name ?? r.requester?.email ?? '—'}</div>
                        <div className="text-xs text-gray-400">{fmt(r.created_at)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
                        {r.rejection_reason && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-28">{r.rejection_reason}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(['PENDING','APPROVED','FAILED'] as const).includes(r.status as 'PENDING'|'APPROVED'|'FAILED') && (
                            <button onClick={() => setExecTarget(r)}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg">
                              {r.status === 'PENDING' ? 'Approve & Execute' : r.status === 'FAILED' ? 'Retry' : 'Execute'}
                            </button>
                          )}
                          {(['PENDING','APPROVED'] as const).includes(r.status as 'PENDING'|'APPROVED') && (
                            <button onClick={() => setRejectTarget(r)}
                              className="px-2.5 py-1 border border-red-300 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50">
                              Reject
                            </button>
                          )}
                          {r.status === 'EXECUTED' && <span className="text-xs text-green-600">✓ {fmt(r.executed_at)}</span>}
                          {r.status === 'REJECTED' && <span className="text-xs text-red-500">✕ Rejected</span>}
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
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

type PageTab = 'add' | 'requests'

export default function MembersOnboardingPage() {
  const [tab, setTab] = useState<PageTab>('add')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Members & Onboarding</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Add users to any workspace directly, or review requests from workspace admins.
        </p>
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          {
            key: 'add' as const, label: 'Add User to Workspace',
            icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
          },
          {
            key: 'requests' as const, label: 'Invitation Requests',
            icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
          },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
            </svg>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'add'      && <AddUserTab />}
      {tab === 'requests' && <InvitationRequestsTab />}
    </div>
  )
}
