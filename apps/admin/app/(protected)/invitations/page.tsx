'use client'
// apps/admin/app/(protected)/invitations/page.tsx
//
// Workspace admin submits invitation requests.
// Two tabs: Active/Completed/Rejected history + Submit New Request.
//
// If auto_approve is ON: request executes immediately → user invited.
// If auto_approve is OFF: request queued → Console staff reviews.

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type InvitationRequest = {
  id: string
  workspace_id: string
  workspace_type: string
  requested_email: string
  requested_role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED'
  rejection_reason: string | null
  notes: string | null
  created_at: string
  approved_at: string | null
  executed_at: string | null
  profiles: { display_name: string | null; email: string | null } | null
}

// ── Role options per workspace type ───────────────────────────────────────────

const TEAM_ROLES = [
  { value: 'MANAGER',  label: 'Manager',  desc: 'Can view all team claims and manage members' },
  { value: 'ADMIN',    label: 'Admin',    desc: 'Finance / HR — configures rates, exports' },
  { value: 'EMPLOYEE', label: 'Employee', desc: 'Submits own claims via MyExpensio' },
]

const AGENT_STAFF_ROLES = [
  { value: 'SALES',   label: 'Sales',   desc: 'Invites customers, tracks referrals' },
  { value: 'FINANCE', label: 'Finance', desc: 'Views commission and payout dashboard' },
]

const AGENT_SUBSCRIBER_ROLES = [
  { value: 'EMPLOYEE', label: 'Individual Subscriber', desc: 'Pays own subscription, uses MyExpensio for personal claims' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const STATUS_CFG: Record<string, { label: string; cls: string; description: string }> = {
  PENDING:  { label: 'Pending',    cls: 'bg-yellow-50 text-yellow-700',  description: 'Awaiting review by platform team' },
  APPROVED: { label: 'Approved',   cls: 'bg-blue-50 text-blue-700',      description: 'Approved — being processed' },
  REJECTED: { label: 'Rejected',   cls: 'bg-red-50 text-red-700',        description: 'Request was declined' },
  EXECUTED: { label: 'Completed',  cls: 'bg-green-50 text-green-700',    description: 'User account created and invite sent' },
  FAILED:   { label: 'Failed',     cls: 'bg-red-50 text-red-600',        description: 'Technical error — Console staff notified' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', description: '' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Submit form ────────────────────────────────────────────────────────────────

function SubmitForm({
  workspaceType,
  onSubmitted,
}: {
  workspaceType: string
  onSubmitted: (result: { auto_executed: boolean; message: string }) => void
}) {
  const [email, setEmail]   = useState('')
  const [role, setRole]     = useState('')
  const [notes, setNotes]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const isTeam  = workspaceType === 'TEAM'
  const isAgent = workspaceType === 'AGENT'

  const roleGroups = isTeam
    ? [{ roles: TEAM_ROLES }]
    : [
        { group: 'Agency Staff',          roles: AGENT_STAFF_ROLES },
        { group: 'Individual Subscriber', roles: AGENT_SUBSCRIBER_ROLES },
      ]

  async function handleSubmit() {
    if (!email.trim() || !role) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/workspace/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_email: email, requested_role: role, notes }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to submit request')
      setEmail(''); setRole(''); setNotes('')
      onSubmitted({ auto_executed: json.auto_executed ?? false, message: json.message })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error submitting request')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email address <span className="text-red-500">*</span>
        </label>
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="user@company.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Role */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Role <span className="text-red-500">*</span>
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
                const isSubscriber = isAgent && r.value === 'EMPLOYEE'
                const accent = isSubscriber ? 'border-purple-500 bg-purple-50' : 'border-blue-600 bg-blue-50'
                const textColor = isSubscriber ? 'text-purple-700' : 'text-blue-700'
                return (
                  <label key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all mb-1 ${
                      role === r.value ? accent : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <input type="radio" name="role" value={r.value} checked={role === r.value}
                      onChange={() => setRole(r.value)} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <div className={`text-sm font-medium ${role === r.value ? textColor : 'text-gray-900'}`}>
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

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes for platform team <span className="text-xs text-gray-400">(optional)</span>
        </label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context that might help the platform team process this request…"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !email.trim() || !role}
        className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting…' : 'Submit Request'}
      </button>
    </div>
  )
}

// ── Request row ────────────────────────────────────────────────────────────────

function RequestRow({ req }: { req: InvitationRequest }) {
  const cfg = STATUS_CFG[req.status]
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{req.requested_email}</div>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          {req.requested_role}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={req.status} />
        {req.rejection_reason && (
          <p className="text-xs text-red-500 mt-0.5">{req.rejection_reason}</p>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-gray-500">{fmt(req.created_at)}</td>
      <td className="px-4 py-3 text-xs text-gray-500">
        {req.status === 'EXECUTED' ? fmt(req.executed_at) : (cfg?.description ?? '—')}
      </td>
    </tr>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

type TabKey = 'new' | 'active' | 'completed' | 'rejected'

const HISTORY_TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: 'active',    label: 'Active',    statuses: ['PENDING', 'APPROVED'] },
  { key: 'completed', label: 'Completed', statuses: ['EXECUTED'] },
  { key: 'rejected',  label: 'Rejected',  statuses: ['REJECTED', 'FAILED'] },
]

export default function InvitationsPage() {
  const [tab, setTab]             = useState<TabKey>('new')
  const [historyTab, setHistoryTab] = useState<TabKey>('active')
  const [requests, setRequests]   = useState<InvitationRequest[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [workspaceType, setWorkspaceType] = useState<string>('TEAM')
  const [submitResult, setSubmitResult]   = useState<{ auto_executed: boolean; message: string } | null>(null)

  const currentHistoryTab = HISTORY_TABS.find((t) => t.key === historyTab)!

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workspace/invitations?page_size=50')
      if (!res.ok) throw new Error('Failed to load')
      const json = await res.json()
      setRequests(json.requests ?? [])
      setTotal(json.total ?? 0)
      const first = json.requests?.[0]
      if (first) setWorkspaceType(first.workspace_type)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  function handleSubmitted(result: { auto_executed: boolean; message: string }) {
    setSubmitResult(result)
    fetchRequests()
    setTab('active')
    setTimeout(() => setSubmitResult(null), 8000)
  }

  const filteredRequests = requests.filter((r) =>
    currentHistoryTab.statuses.includes(r.status),
  )

  const pendingCount   = requests.filter((r) => r.status === 'PENDING' || r.status === 'APPROVED').length
  const completedCount = requests.filter((r) => r.status === 'EXECUTED').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Invitations</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Request new users to be added to your workspace.
          </p>
        </div>
        <button
          onClick={() => setTab('new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      </div>

      {/* Success banner */}
      {submitResult && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          submitResult.auto_executed
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-blue-50 border border-blue-200 text-blue-700'
        }`}>
          {submitResult.auto_executed ? '✓ ' : 'ℹ️ '}
          {submitResult.message}
        </div>
      )}

      {/* Main tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { key: 'new' as const,      label: '+ New Request' },
          { key: 'active' as const,   label: `Active${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'completed' as const, label: `Completed${completedCount > 0 ? ` (${completedCount})` : ''}` },
          { key: 'rejected' as const, label: 'Rejected' },
        ].map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); if (t.key !== 'new') setHistoryTab(t.key) }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* New request tab */}
      {tab === 'new' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-900">New Invitation Request</h2>
            <p className="text-xs text-gray-500 mt-1">
              Submit a request to add a new user to your workspace. You will be notified when it is processed.
            </p>
          </div>
          <SubmitForm workspaceType={workspaceType} onSubmitted={handleSubmitted} />
        </div>
      )}

      {/* History tabs */}
      {tab !== 'new' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-sm text-gray-400">
              <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              No {currentHistoryTab.label.toLowerCase()} requests
              <button onClick={() => setTab('new')} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                Submit a new request →
              </button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Email','Role','Status','Submitted','Info'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => <RequestRow key={r.id} req={r} />)}
              </tbody>
            </table>
          )}
          {total > 0 && (
            <div className="px-4 py-2 border-t border-gray-50 text-xs text-gray-400">
              {total} total requests
            </div>
          )}
        </div>
      )}
    </div>
  )
}
