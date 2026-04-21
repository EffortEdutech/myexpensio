'use client'
// apps/admin/app/(protected)/audit/AuditClient.tsx

import { useMemo, useState } from 'react'

type Org = { id: string; name: string; display_name: string | null }

type AuditLog = {
  id: string
  org_id: string | null
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: { display_name: string | null; email: string | null } | null
  organizations: { name: string; display_name: string | null } | null
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

// Action colour coding
function actionColor(action: string): string {
  if (action.includes('DELETE') || action.includes('REMOVE') || action.includes('SUSPEND')) return 'bg-red-50 text-red-700'
  if (action.includes('CREATE') || action.includes('INVITE') || action.includes('ACCEPT'))  return 'bg-green-50 text-green-700'
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
  const [logs,    setLogs]    = useState(initialLogs)
  const [loading, setLoading] = useState(false)

  const [orgFilter,    setOrgFilter]    = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [from,         setFrom]         = useState('')
  const [to,           setTo]           = useState('')
  const [expandedId,   setExpandedId]   = useState<string | null>(null)

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (orgFilter    && l.org_id      !== orgFilter)    return false
      if (entityFilter && l.entity_type !== entityFilter) return false
      if (actionFilter && !l.action.toLowerCase().includes(actionFilter.toLowerCase())) return false
      if (from && l.created_at < from) return false
      if (to   && l.created_at > to + 'T23:59:59Z') return false
      return true
    })
  }, [logs, orgFilter, entityFilter, actionFilter, from, to])

  async function fetchLogs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (orgFilter)    params.set('org_id', orgFilter)
      if (entityFilter) params.set('entity_type', entityFilter)
      if (from)         params.set('from', from)
      if (to)           params.set('to', to)
      params.set('page_size', '200')

      const res = await fetch(`/api/admin/audit-logs?${params}`)
      const json = await res.json()
      if (res.ok) setLogs(json.logs ?? [])
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform-wide activity trail. All key actions are recorded here.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Organisation</label>
            <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              <option value="">All orgs</option>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.display_name ?? o.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Entity Type</label>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
              <option value="">All entities</option>
              {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date from</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date to</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3">
          <input type="text" value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            placeholder="Filter by action keyword…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          <button onClick={fetchLogs} disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-50">
            {loading ? 'Loading…' : 'Apply'}
          </button>
          <button onClick={() => { setOrgFilter(''); setEntityFilter(''); setActionFilter(''); setFrom(''); setTo('') }}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
            Clear
          </button>
        </div>
      </div>

      {/* Log table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Time (MYT)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No audit entries found.</td></tr>
              )}
              {filtered.map(log => {
                const actor = Array.isArray(log.profiles)      ? log.profiles[0]      : log.profiles
                const org   = Array.isArray(log.organizations) ? log.organizations[0] : log.organizations
                const isExpanded = expandedId === log.id

                return (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-gray-800">{actor?.display_name ?? '—'}</div>
                        <div className="text-xs text-gray-400">{actor?.email ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${actionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-medium text-gray-700">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="text-gray-400 font-mono text-[10px]">{log.entity_id.slice(0, 8)}…</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {(org as { display_name?: string | null; name: string } | null)?.display_name ?? (org as { name: string } | null)?.name ?? '—'}
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
                      <tr key={`${log.id}-meta`} className="bg-gray-50">
                        <td colSpan={6} className="px-5 py-3">
                          <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap bg-white border border-gray-100 rounded p-3 max-h-40">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} entries shown
        </div>
      </div>
    </div>
  )
}
