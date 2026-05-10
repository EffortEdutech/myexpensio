'use client'
// apps/admin/app/orgs/[id]/invites/page.tsx
// Internal staff only — invitation requests for a specific workspace.
// Reuses the same /api/workspace/invitations endpoint with org_id scoping.

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_CFG: Record<string, { label: string; cls: string; desc: string }> = {
  PENDING:  { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700', desc: 'Awaiting review' },
  APPROVED: { label: 'Approved',  cls: 'bg-blue-50 text-blue-700',     desc: 'Being processed' },
  REJECTED: { label: 'Rejected',  cls: 'bg-red-50 text-red-700',       desc: 'Request declined' },
  EXECUTED: { label: 'Completed', cls: 'bg-green-50 text-green-700',   desc: 'Invite sent' },
  FAILED:   { label: 'Failed',    cls: 'bg-red-50 text-red-600',       desc: 'Technical error' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', desc: '' }
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

// ── Submit form for internal staff ─────────────────────────────────────────────

function AddInviteForm({ orgId, workspaceType, onSubmitted }: {
  orgId: string
  workspaceType: string
  onSubmitted: () => void
}) {
  const [email, setEmail]     = useState('')
  const [role, setRole]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const TEAM_ROLES  = ['ADMIN', 'MANAGER', 'EMPLOYEE']
  const AGENT_ROLES = ['SALES', 'FINANCE', 'EMPLOYEE']
  const roles = workspaceType === 'AGENT' ? AGENT_ROLES : TEAM_ROLES

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !role) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const res = await fetch('/api/workspace/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requested_email: email, requested_role: role }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? 'Failed')
      setEmail(''); setRole('')
      setSuccess(json.message ?? 'Invitation submitted')
      onSubmitted()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-900">Add Team Member</h2>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="user@company.com" required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
          <select
            value={role} onChange={(e) => setRole(e.target.value)} required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select role…</option>
            {roles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      {error   && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div>}
      {success && <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-3 py-2">{success}</div>}
      <button
        type="submit"
        disabled={loading || !email.trim() || !role}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Submitting…' : 'Submit Invitation Request'}
      </button>
    </form>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrgInvitesPage() {
  const params       = useParams()
  const searchParams = useSearchParams()
  const orgId        = params.id as string
  const justCreated  = searchParams.get('created') === '1'

  const [requests, setRequests]           = useState<InvitationRequest[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [workspaceType, setWorkspaceType] = useState<string>('TEAM')
  const [orgName, setOrgName]             = useState<string>('')
  const [tab, setTab]                     = useState<'active' | 'completed' | 'rejected'>('active')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch org info
      const orgRes  = await fetch(`/api/admin/orgs?search=&page=1&page_size=100`)
      const orgJson = await orgRes.json()
      const org = (orgJson.orgs ?? []).find((o: { id: string; name: string; workspace_type: string }) => o.id === orgId)
      if (org) { setOrgName(org.name); setWorkspaceType(org.workspace_type) }

      // Fetch invitation requests for this org
      const res  = await fetch(`/api/workspace/invitations?workspace_id=${orgId}&page_size=100`)
      const json = await res.json()
      setRequests(json.requests ?? [])
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [orgId])

  useEffect(() => { fetchData() }, [fetchData])

  const STATUS_MAP: Record<string, string[]> = {
    active:    ['PENDING', 'APPROVED'],
    completed: ['EXECUTED'],
    rejected:  ['REJECTED', 'FAILED'],
  }

  const filtered       = requests.filter((r) => (STATUS_MAP[tab] ?? []).includes(r.status))
  const pendingCount   = requests.filter((r) => ['PENDING', 'APPROVED'].includes(r.status)).length
  const completedCount = requests.filter((r) => r.status === 'EXECUTED').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link href="/orgs" className="hover:text-gray-600">Organisations</Link>
            <span>/</span>
            <span className="text-gray-700">{orgName || orgId}</span>
            <span>/</span>
            <span className="text-gray-700">Invitations</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Invitation Requests
            {total > 0 && <span className="ml-2 text-sm text-gray-400 font-normal">{total} total</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage who gets invited to <strong>{orgName || 'this workspace'}</strong>.
          </p>
        </div>
      </div>

      {/* Success banner if just provisioned */}
      {justCreated && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ Workspace created successfully. Owner invite sent. You can add more members below.
        </div>
      )}

      {/* Add member form */}
      <AddInviteForm orgId={orgId} workspaceType={workspaceType} onSubmitted={fetchData} />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {([
          { key: 'active',    label: `Active${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { key: 'completed', label: `Completed${completedCount > 0 ? ` (${completedCount})` : ''}` },
          { key: 'rejected',  label: 'Rejected' },
        ] as { key: typeof tab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-sm text-gray-400">
            No {tab} requests
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Email', 'Role', 'Status', 'Requested', 'Info'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{req.requested_email}</div>
                    {req.notes && <div className="text-xs text-gray-400 mt-0.5">{req.notes}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
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
                    {req.status === 'EXECUTED'
                      ? `Completed ${fmt(req.executed_at)}`
                      : STATUS_CFG[req.status]?.desc ?? ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
