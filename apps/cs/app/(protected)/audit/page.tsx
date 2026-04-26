'use client'
// apps/cs/app/(protected)/audit/page.tsx
// FIX: <React.Fragment key={...}> instead of <> for rows with keys in map.

import React, { useEffect, useState, useCallback } from 'react'

type AuditLog = {
  id: string; org_id: string | null; actor_user_id: string | null
  entity_type: string; entity_id: string | null; action: string
  metadata: Record<string, unknown>; created_at: string
  profiles: { email: string | null; display_name: string | null } | null
  organizations: { name: string } | null
}

function fmt(val: string) {
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ActionBadge({ action }: { action: string }) {
  const isCreate = /CREATED|EXECUTED|APPROVED|SUBMITTED|INVITED/.test(action)
  const isDelete = /REMOVED|DELETED|REJECTED|FAILED/.test(action)
  const cls = isDelete
    ? 'text-red-600 bg-red-50'
    : isCreate
      ? 'text-green-700 bg-green-50'
      : 'text-gray-600 bg-gray-100'
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-mono font-medium ${cls}`}>
      {action}
    </span>
  )
}

const ENTITY_TYPES = [
  'claim', 'claim_item', 'invitation_request', 'org_member', 'rate_version',
  'report_template', 'export_job', 'subscription_status', 'platform_config',
  'profile', 'organization', 'referral', 'commission',
]

export default function AuditPage() {
  const [logs, setLogs]         = useState<AuditLog[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [entityType, setEntityType] = useState('')
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')

  const PAGE_SIZE = 25

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (entityType) params.set('entity_type', entityType)
      if (dateFrom)   params.set('from', dateFrom)
      if (dateTo)     params.set('to', dateTo)
      const res = await fetch(`/api/console/audit?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setLogs(json.logs)
      setTotal(json.total)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [entityType, dateFrom, dateTo])

  useEffect(() => { setPage(1); fetchLogs(1) }, [fetchLogs])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide activity across all workspaces</p>
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
            {ENTITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {(entityType || dateFrom || dateTo) && (
          <button
            onClick={() => { setEntityType(''); setDateFrom(''); setDateTo('') }}
            className="text-xs text-gray-400 hover:text-gray-600 self-end pb-1.5"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end pb-1.5">{total} entries</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">No audit entries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Time', 'Actor', 'Action', 'Entity', 'Workspace', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const hasMetadata = Object.keys(log.metadata ?? {}).length > 0
                  const isExpanded = expanded === log.id
                  return (
                    // ✅ React.Fragment with key — the correct pattern for multiple rows per iteration
                    <React.Fragment key={log.id}>
                      <tr
                        className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${hasMetadata ? 'cursor-pointer' : ''}`}
                        onClick={() => hasMetadata && setExpanded(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmt(log.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {log.profiles?.display_name ?? log.profiles?.email ?? (
                              <span className="text-gray-400 italic">System</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-600 font-medium">{log.entity_type}</span>
                          {log.entity_id && (
                            <span className="text-xs text-gray-400 ml-1 font-mono">
                              {log.entity_id.slice(0, 8)}…
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {log.organizations?.name ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {hasMetadata && (isExpanded ? '▲' : '▼')}
                        </td>
                      </tr>
                      {isExpanded && hasMetadata && (
                        <tr className="bg-gray-50">
                          <td colSpan={6} className="px-4 py-3">
                            <pre className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
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
            {[
              { label: 'Previous', p: page - 1, disabled: page === 1 },
              { label: 'Next',     p: page + 1, disabled: page >= totalPages },
            ].map(({ label, p, disabled }) => (
              <button
                key={label}
                onClick={() => { setPage(p); fetchLogs(p) }}
                disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
