'use client'
// apps/admin/app/(protected)/audit/page.tsx
// Audit log viewer — filterable, paginated.
// Shows expandable metadata for each entry.

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type AuditProfile = { id: string; email: string | null; display_name: string | null }
type AuditOrg = { id: string; name: string }

type AuditLog = {
  id: string
  org_id: string | null
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: AuditProfile | null
  organizations: AuditOrg | null
}

type AuditResponse = {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTime(val: string) {
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ActionBadge({ action }: { action: string }) {
  const isDestructive = action.includes('REMOVED') || action.includes('DELETED') || action.includes('REJECTED')
  const isCreate = action.includes('CREATED') || action.includes('SENT') || action.includes('SUBMITTED')

  const cls = isDestructive
    ? 'bg-red-50 text-red-700'
    : isCreate
      ? 'bg-green-50 text-green-700'
      : 'bg-gray-100 text-gray-600'

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${cls}`}>
      {action}
    </span>
  )
}

// ── Expandable row ─────────────────────────────────────────────────────────────

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const hasMetadata = Object.keys(log.metadata ?? {}).length > 0

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={() => hasMetadata && setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
          {formatDateTime(log.created_at)}
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-900 font-medium">
            {log.profiles?.display_name ?? log.profiles?.email ?? (
              <span className="text-gray-400 italic">System</span>
            )}
          </div>
          {log.profiles?.email && log.profiles?.display_name && (
            <div className="text-xs text-gray-400">{log.profiles.email}</div>
          )}
        </td>
        <td className="px-4 py-3">
          <ActionBadge action={log.action} />
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">
          <span className="font-medium">{log.entity_type}</span>
          {log.entity_id && (
            <span className="text-gray-400 ml-1 font-mono">{log.entity_id.slice(0, 8)}…</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-gray-400">
          {log.organizations?.name ?? '—'}
        </td>
        <td className="px-4 py-3 text-center">
          {hasMetadata && (
            <span className="text-xs text-gray-400">
              {expanded ? '▲' : '▼'}
            </span>
          )}
        </td>
      </tr>
      {expanded && hasMetadata && (
        <tr className="bg-gray-50">
          <td colSpan={6} className="px-4 py-3">
            <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const ENTITY_TYPES = [
  'claim', 'claim_item', 'invitation', 'invitation_request',
  'org_member', 'rate_version', 'report_template', 'export_job',
  'subscription', 'platform_config',
]

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [entityType, setEntityType] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const PAGE_SIZE = 25

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (entityType) params.set('entity_type', entityType)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/workspace/audit?${params}`)
      if (!res.ok) throw new Error('Failed to load audit logs')
      const json: AuditResponse = await res.json()

      setLogs(json.logs)
      setTotal(json.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading logs')
    } finally {
      setLoading(false)
    }
  }, [entityType, dateFrom, dateTo])

  useEffect(() => {
    setPage(1)
    fetchLogs(1)
  }, [fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All platform activity in this workspace. Click a row to expand metadata.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Entity type</label>
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {(entityType || dateFrom || dateTo) && (
          <button
            onClick={() => { setEntityType(''); setDateFrom(''); setDateTo('') }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-sm text-red-500">{error}</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">
            No audit entries found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Actor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Entity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Workspace</th>
                  <th className="px-4 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => { const p = page - 1; setPage(p); fetchLogs(p) }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => { const p = page + 1; setPage(p); fetchLogs(p) }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
