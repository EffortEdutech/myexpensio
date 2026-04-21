'use client'
// apps/admin/app/(protected)/audit/AuditClient.tsx

import type { AuditLog } from '@myexpensio/domain/audit'
import { normalizeAuditLogs } from '@myexpensio/domain/audit'
import { Fragment, useMemo, useState } from 'react'

type Org = { id: string; name: string | null; display_name: string | null }

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

function actionColor(action: string): string {
  if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('SUSPEND')) return 'bg-red-50 text-red-700'
  if (action.includes('CREATE') || action.includes('INVITE') || action.includes('ACCEPT')) return 'bg-green-50 text-green-700'
  if (action.includes('UPDATE') || action.includes('CHANGE') || action.includes('OVERRIDE')) return 'bg-blue-50 text-blue-700'
  if (action.includes('EXPORT') || action.includes('SUBMIT')) return 'bg-purple-50 text-purple-700'
  return 'bg-gray-100 text-gray-600'
}

export default function AuditClient({
  initialLogs,
  orgs,
  entityTypes,
}: {
  initialLogs: AuditLog[]
  orgs: Org[]
  entityTypes: string[]
}) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs)
  const [loading, setLoading] = useState(false)

  const [orgFilter, setOrgFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (orgFilter && log.org_id !== orgFilter) return false
      if (entityFilter && log.entity_type !== entityFilter) return false
      if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false
      if (from && log.created_at < from) return false
      if (to && log.created_at > to + 'T23:59:59Z') return false
      return true
    })
  }, [logs, orgFilter, entityFilter, actionFilter, from, to])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgFilter) params.set('org_id', orgFilter)
      if (entityFilter) params.set('entity_type', entityFilter)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('page_size', '200')

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const json = await res.json()
      if (res.ok) setLogs(normalizeAuditLogs(json.logs ?? []))
    } catch {
      // keep existing logs
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Platform-wide activity trail. All key actions are recorded here.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Organisation</label>
            <select
              value={orgFilter}
              onChange={(e) => setOrgFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All orgs</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.display_name ?? org.name ?? '—'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Entity Type</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">All entities</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Date from</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Date to</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filter by action keyword…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Apply'}
          </button>
          <button
            onClick={() => {
              setOrgFilter('')
              setEntityFilter('')
              setActionFilter('')
              setFrom('')
              setTo('')
            }}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-gray-500">Time (MYT)</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actor</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Organisation</th>
                <th className="px-4 py-3 text-xs font-medium uppercase text-gray-500">Detail</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">
                    No audit entries found.
                  </td>
                </tr>
              )}

              {filtered.map((log) => {
                const actor = log.profiles
                const org = log.organizations
                const isExpanded = expandedId === log.id

                return (
                  <Fragment key={log.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-gray-500">{fmtDateTime(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-800">{actor?.display_name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{actor?.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-gray-700">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="font-mono text-[10px] text-gray-400">
                            {log.entity_id.slice(0, 8)}…
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {org?.display_name ?? org?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Object.keys(log.metadata ?? {}).length > 0 && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? 'Hide' : 'Metadata'}
                          </button>
                        )}
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-3">
                          <pre className="max-h-40 overflow-x-auto whitespace-pre-wrap rounded border border-gray-100 bg-white p-3 text-xs text-gray-600">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
          {filtered.length} entries shown
        </div>
      </div>
    </div>
  )
}
