'use client'
// apps/admin/app/(protected)/audit/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceMe } from '@/lib/use-workspace-me'
import InternalOrgPicker from '@/components/InternalOrgPicker'

type Profile      = { id: string; email: string | null; display_name: string | null }
type Organization = { id: string; name: string }
type AuditLog = {
  id: string; org_id: string | null; actor_user_id: string | null
  entity_type: string | null; entity_id: string | null; action: string
  metadata: Record<string, unknown> | null; created_at: string
  profiles: Profile | null; organizations: Organization | null
}

function fmtDateTime(val: string) {
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function AuditRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const actor = log.profiles?.display_name ?? log.profiles?.email ?? 'System'
  return (
    <>
      <tr className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.created_at)}</td>
        <td className="px-4 py-3">
          <div className="text-sm font-medium text-gray-900">{actor}</div>
          {log.profiles?.email && log.profiles.display_name && <div className="text-xs text-gray-400">{log.profiles.email}</div>}
        </td>
        <td className="px-4 py-3">
          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{log.action}</span>
        </td>
        <td className="px-4 py-3 text-xs text-gray-500">{log.entity_type ?? '—'}</td>
        <td className="px-4 py-3 text-xs text-gray-400 font-mono max-w-24 truncate">{log.entity_id?.slice(0, 8) ?? '—'}</td>
        <td className="px-4 py-3">
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </td>
      </tr>
      {expanded && log.metadata && Object.keys(log.metadata).length > 0 && (
        <tr className="border-b border-gray-50 bg-gray-50">
          <td colSpan={6} className="px-6 py-3">
            <pre className="text-xs text-gray-600 overflow-auto max-h-40 font-mono bg-white border border-gray-200 rounded p-2">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  )
}

function AuditList({ orgId, orgName, onChangeWorkspace }: {
  orgId: string; orgName: string | null; onChangeWorkspace?: () => void
}) {
  const [logs, setLogs]         = useState<AuditLog[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [entityType, setEntityType] = useState('')
  const PAGE_SIZE = 50

  const fetchLogs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE), org_id: orgId })
      if (dateFrom)   params.set('from', dateFrom)
      if (dateTo)     params.set('to', dateTo)
      if (entityType) params.set('entity_type', entityType)
      const res = await fetch(`/api/workspace/audit?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setLogs(json.logs ?? []); setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [orgId, dateFrom, dateTo, entityType])

  useEffect(() => { setPage(1); fetchLogs(1) }, [fetchLogs])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {orgName ?? 'Workspace'} — all recorded actions
          {onChangeWorkspace && <button onClick={onChangeWorkspace} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline">Change workspace</button>}
        </p>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <input type="text" value={entityType} onChange={e => setEntityType(e.target.value)}
          placeholder="Entity type…"
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-40" />
        {(dateFrom || dateTo || entityType) && <button onClick={() => { setDateFrom(''); setDateTo(''); setEntityType('') }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} entries</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">No audit entries found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Timestamp','Actor','Action','Entity type','Entity ID',''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{logs.map(log => <AuditRow key={log.id} log={log} />)}</tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {[{ label: 'Previous', p: page - 1, disabled: page === 1 },
              { label: 'Next', p: page + 1, disabled: page >= totalPages }].map(({ label, p, disabled }) => (
              <button key={label} onClick={() => { setPage(p); fetchLogs(p) }} disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AuditPage() {
  const { me, loading } = useWorkspaceMe()
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [showPicker, setShowPicker]   = useState(false)

  useEffect(() => {
    if (!me) return
    if (me.isInternalStaff) { setShowPicker(true); return }
    if (me.orgId && me.orgName) setSelectedOrg({ id: me.orgId, name: me.orgName })
  }, [me])

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>

  if (showPicker) {
    return (
      <div className="space-y-5">
        <div><h1 className="text-lg font-semibold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view its audit log</p></div>
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <InternalOrgPicker label="audit log" onSelect={(id, name) => { setSelectedOrg({ id, name }); setShowPicker(false) }} />
        </div>
      </div>
    )
  }

  if (!selectedOrg) return <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>

  return (
    <AuditList
      orgId={selectedOrg.id}
      orgName={selectedOrg.name}
      onChangeWorkspace={me?.isInternalStaff ? () => setShowPicker(true) : undefined}
    />
  )
}
