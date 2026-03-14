// apps/admin/app/(protected)/exports/page.tsx
'use client'

import { useEffect, useState } from 'react'
import type { ExportFormat, ExportStatus } from '@/lib/types'

type JobRow = {
  id: string
  format: ExportFormat
  status: ExportStatus
  file_url: string | null
  row_count: number | null
  created_at: string
  completed_at: string | null
  profiles: { display_name: string | null; email: string | null } | null
}

function StatusBadge({ status }: { status: ExportStatus }) {
  const map: Record<ExportStatus, string> = {
    DONE:    'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    RUNNING: 'bg-blue-100 text-blue-700',
    FAILED:  'bg-red-100 text-red-600',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  )
}

export default function ExportsPage() {
  const [jobs, setJobs]     = useState<JobRow[]>([])
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    fetch('/api/admin/exports')
      .then((r) => r.json())
      .then((j) => { setJobs(j.jobs ?? []); setLoad(false) })
  }, [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Export Jobs</h1>
        <p className="text-sm text-gray-500 mt-0.5">All export jobs across your organisation.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rows</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
              )}
              {!loading && jobs.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">No export jobs yet.</td></tr>
              )}
              {jobs.map((j) => {
                const profile = Array.isArray(j.profiles) ? j.profiles[0] : j.profiles
                return (
                  <tr key={j.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{profile?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{profile?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        {j.format}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{j.row_count ?? '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(j.created_at).toLocaleString('en-MY')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {j.status === 'DONE' && j.file_url && (
                        <a
                          href={j.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
