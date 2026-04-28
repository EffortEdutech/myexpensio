'use client'
// apps/admin/app/(protected)/exports/page.tsx

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useWorkspaceMe } from '@/lib/use-workspace-me'
import InternalOrgPicker from '@/components/InternalOrgPicker'

type Profile = { id: string; email: string | null; display_name: string | null }

type ExportJob = {
  id: string; org_id: string; user_id: string; format: string
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  row_count: number | null; error_message: string | null
  created_at: string; completed_at: string | null
  file_path: string | null; template_id: string | null
  profiles: Profile | null
}

function fmtDateTime(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function initials(profile: Profile | null) {
  return (profile?.display_name ?? profile?.email ?? '?').slice(0, 2).toUpperCase()
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    PENDING:    { label: 'Pending',    cls: 'bg-amber-50 text-amber-700' },
    PROCESSING: { label: 'Processing', cls: 'bg-blue-50 text-blue-700' },
    DONE:       { label: 'Done',       cls: 'bg-green-50 text-green-700' },
    FAILED:     { label: 'Failed',     cls: 'bg-red-50 text-red-700' },
  }
  const c = cfg[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>
}

function FormatBadge({ format }: { format: string }) {
  const cls: Record<string, string> = {
    CSV: 'bg-gray-100 text-gray-600', XLSX: 'bg-green-50 text-green-700', PDF: 'bg-red-50 text-red-700',
  }
  return <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${cls[format] ?? 'bg-gray-100 text-gray-500'}`}>{format}</span>
}

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function ExportsList({ orgId, orgName, onChangeWorkspace }: {
  orgId: string; orgName: string | null; onChangeWorkspace?: () => void
}) {
  const [jobs, setJobs]       = useState<ExportJob[]>([])
  const [total, setTotal]     = useState(0)
  const [page, setPage]       = useState(1)
  const [loading, setLoading] = useState(true)
  const [format, setFormat]   = useState('')
  const [status, setStatus]   = useState('')
  const PAGE_SIZE = 25

  const doneCount    = jobs.filter(j => j.status === 'DONE').length
  const failedCount  = jobs.filter(j => j.status === 'FAILED').length
  const pendingCount = jobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING').length

  const fetchJobs = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE), org_id: orgId })
      if (format) params.set('format', format)
      if (status) params.set('status', status)
      const res = await fetch(`/api/workspace/export-jobs?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setJobs(json.jobs ?? []); setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [orgId, format, status])

  useEffect(() => { setPage(1); fetchJobs(1) }, [fetchJobs])
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Export History</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgName ?? 'Workspace'} — export jobs
            {onChangeWorkspace && (
              <button onClick={onChangeWorkspace} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline">Change workspace</button>
            )}
          </p>
        </div>
        <Link href="/claims" className="text-sm text-blue-600 hover:text-blue-800 font-medium flex-shrink-0">← Back to Claims</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total exports" value={total}        sub="all time" />
        <KPICard label="Completed"     value={doneCount}    sub="ready to download" />
        <KPICard label="In progress"   value={pendingCount} sub="pending / processing" />
        <KPICard label="Failed"        value={failedCount}  sub="check error details" />
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <select value={format} onChange={e => setFormat(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All formats</option>
          <option value="CSV">CSV</option><option value="XLSX">XLSX</option><option value="PDF">PDF</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All statuses</option>
          <option value="DONE">Done</option><option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option><option value="FAILED">Failed</option>
        </select>
        {(format || status) && <button onClick={() => { setFormat(''); setStatus('') }} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} jobs</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2">
            <p className="text-sm text-gray-400">No export jobs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Generated by','Format','Status','Rows','Created','Completed','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} className={`border-b border-gray-50 hover:bg-gray-50 ${job.status === 'FAILED' ? 'bg-red-50/20' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {initials(job.profiles)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{job.profiles?.display_name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{job.profiles?.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><FormatBadge format={job.format} /></td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                      {job.status === 'FAILED' && job.error_message && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-32 truncate">{job.error_message}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 tabular-nums">{job.row_count ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(job.created_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(job.completed_at)}</td>
                    <td className="px-4 py-3">
                      {job.status === 'DONE' && job.file_path ? (
                        <a href={`/api/exports/${job.id}/download`} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium">Download</a>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
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
              <button key={label} onClick={() => { setPage(p); fetchJobs(p) }} disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ExportsPage() {
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
        <div><h1 className="text-lg font-semibold text-gray-900">Export History</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view its export jobs</p></div>
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <InternalOrgPicker label="export history" onSelect={(id, name) => { setSelectedOrg({ id, name }); setShowPicker(false) }} />
        </div>
      </div>
    )
  }

  if (!selectedOrg) return <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>

  return (
    <ExportsList
      orgId={selectedOrg.id}
      orgName={selectedOrg.name}
      onChangeWorkspace={me?.isInternalStaff ? () => setShowPicker(true) : undefined}
    />
  )
}
