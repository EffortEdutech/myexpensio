'use client'
// apps/cs/app/(protected)/invitation-queue/page.tsx — light theme

import { useEffect, useState, useCallback } from 'react'

type InviteRequest = {
  id: string; workspace_id: string; workspace_type: string
  requested_email: string; requested_role: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED'
  rejection_reason: string | null; notes: string | null
  created_at: string; approved_at: string | null; executed_at: string | null
  organizations: { id: string; name: string; workspace_type: string } | null
  requester: { id: string; email: string | null; display_name: string | null } | null
  assignee:  { id: string; email: string | null; display_name: string | null } | null
}

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: 'Pending',   cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  APPROVED: { label: 'Approved',  cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  REJECTED: { label: 'Rejected',  cls: 'bg-red-50 text-red-700 border border-red-200' },
  EXECUTED: { label: 'Executed',  cls: 'bg-green-50 text-green-700 border border-green-200' },
  FAILED:   { label: 'Failed',    cls: 'bg-red-50 text-red-600 border border-red-200' },
}
const TYPE_BADGE: Record<string, string> = {
  TEAM:  'bg-blue-50 text-blue-700',
  AGENT: 'bg-purple-50 text-purple-700',
}

function RejectModal({ request, onClose, onDone }: { request: InviteRequest; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  async function handleReject() {
    if (!reason.trim()) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/console/invitation-queue/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      onDone(); onClose()
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Reject Request</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong className="text-gray-800">{request.requested_email}</strong>
          {' → '}{request.organizations?.name ?? request.workspace_id}
        </p>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Rejection reason <span className="text-red-500">*</span>
        </label>
        <textarea
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this request is being rejected…"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-3 mt-5">
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
      const execRes = await fetch(`/api/console/invitation-queue/${request.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute' }),
      })
      const json = await execRes.json()
      if (!execRes.ok) throw new Error(json.error?.message ?? 'Execute failed')
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
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-5">
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
        <ul className="text-xs text-gray-500 list-disc list-inside mb-5 space-y-1">
          <li>Create user account (or use existing if email already registered)</li>
          <li>Add them to workspace as <strong className="text-gray-700">{request.requested_role}</strong></li>
          <li>Send invite email to set up their account</li>
        </ul>
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleExecute} disabled={loading}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Executing…' : request.status === 'PENDING' ? 'Approve & Execute' : 'Execute'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RequestRow({ request, onExec, onReject }: {
  request: InviteRequest
  onExec: (r: InviteRequest) => void
  onReject: (r: InviteRequest) => void
}) {
  const cfg = STATUS_CFG[request.status] ?? STATUS_CFG.PENDING
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <div className="text-sm font-medium text-gray-900">{request.requested_email}</div>
        {request.notes && <div className="text-xs text-gray-400 mt-0.5 truncate max-w-48">{request.notes}</div>}
      </td>
      <td className="px-4 py-3">
        <div className="text-sm text-gray-700">{request.organizations?.name ?? '—'}</div>
        <span className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[request.workspace_type] ?? 'bg-gray-100 text-gray-600'}`}>
          {request.workspace_type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-700">{request.requested_role}</td>
      <td className="px-4 py-3">
        <div className="text-xs text-gray-600">{request.requester?.display_name ?? request.requester?.email ?? '—'}</div>
        <div className="text-xs text-gray-400 mt-0.5">{fmt(request.created_at)}</div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span>
        {request.rejection_reason && (
          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-32">{request.rejection_reason}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {(['PENDING', 'APPROVED', 'FAILED'] as const).includes(request.status as 'PENDING' | 'APPROVED' | 'FAILED') && (
            <button onClick={() => onExec(request)}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
              {request.status === 'PENDING' ? 'Approve & Execute' : request.status === 'FAILED' ? 'Retry' : 'Execute'}
            </button>
          )}
          {(['PENDING', 'APPROVED'] as const).includes(request.status as 'PENDING' | 'APPROVED') && (
            <button onClick={() => onReject(request)}
              className="px-3 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 text-xs font-medium rounded-lg transition-colors">
              Reject
            </button>
          )}
          {request.status === 'EXECUTED' && (
            <span className="text-xs text-green-600">✓ Done — {fmt(request.executed_at)}</span>
          )}
          {request.status === 'REJECTED' && (
            <span className="text-xs text-red-500">✕ Rejected</span>
          )}
        </div>
      </td>
    </tr>
  )
}

type TabKey = 'pending' | 'approved' | 'executed' | 'rejected'
const TABS: { key: TabKey; label: string; status: string }[] = [
  { key: 'pending',  label: 'Pending',  status: 'PENDING' },
  { key: 'approved', label: 'Approved', status: 'APPROVED' },
  { key: 'executed', label: 'Executed', status: 'EXECUTED' },
  { key: 'rejected', label: 'Rejected', status: 'REJECTED' },
]

export default function InvitationQueuePage() {
  const [tab, setTab]             = useState<TabKey>('pending')
  const [requests, setRequests]   = useState<InviteRequest[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [execTarget, setExecTarget]     = useState<InviteRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<InviteRequest | null>(null)
  const [successMsg, setSuccessMsg]     = useState<string | null>(null)

  const currentTab = TABS.find((t) => t.key === tab)!

  const fetchQueue = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page_size: '100', status: currentTab.status })
      const res = await fetch(`/api/console/invitation-queue?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setRequests(json.requests); setTotal(json.total)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [currentTab.status])

  useEffect(() => { fetchQueue() }, [fetchQueue])

  function handleExecDone({ user_existed }: { user_existed: boolean }) {
    setSuccessMsg(user_existed
      ? 'User already existed — workspace membership granted and invite email sent.'
      : 'User account created — invite email sent successfully.')
    setTimeout(() => setSuccessMsg(null), 6000)
    fetchQueue()
  }

  return (
    <div className="space-y-5">
      {execTarget && <ExecuteModal request={execTarget} onClose={() => setExecTarget(null)} onDone={handleExecDone} />}
      {rejectTarget && <RejectModal request={rejectTarget} onClose={() => setRejectTarget(null)} onDone={fetchQueue} />}

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Invitation Queue</h1>
        <p className="text-sm text-gray-500 mt-0.5">Review and execute user onboarding requests from workspace admins.</p>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ {successMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-gray-400 pr-1">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            {tab === 'pending' ? '✓ No pending requests — queue is clear' : `No ${currentTab.label.toLowerCase()} requests`}
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
                {requests.map((r) => (
                  <RequestRow key={r.id} request={r} onExec={setExecTarget} onReject={setRejectTarget} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
