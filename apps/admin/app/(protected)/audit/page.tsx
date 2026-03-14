// apps/admin/app/(protected)/audit/page.tsx
'use client'

import { useEffect, useState } from 'react'

type AuditRow = {
  id: string
  actor_user_id: string | null
  entity_type: string
  entity_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

export default function AuditPage() {
  const [logs, setLogs]    = useState<AuditRow[]>([])
  const [loading, setLoad] = useState(true)
  const [search, setSearch]= useState('')

  useEffect(() => {
    fetch('/api/admin/audit')
      .then((r) => r.json())
      .then((j) => { setLogs(j.logs ?? []); setLoad(false) })
  }, [])

  const visible = logs.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      (profile?.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">Admin and system actions for your organisation.</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by action, entity, or user…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">When</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
              )}
              {!loading && visible.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No audit logs found.</td></tr>
              )}
              {visible.map((l) => {
                const profile = Array.isArray(l.profiles) ? l.profiles[0] : l.profiles
                return (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString('en-MY')}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {profile?.display_name ?? profile?.email ?? l.actor_user_id?.slice(0, 8) ?? 'system'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono
                                       bg-gray-100 text-gray-700">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      <span className="font-medium text-gray-700">{l.entity_type}</span>
                      {l.entity_id && (
                        <span className="ml-1 text-gray-400">/{l.entity_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono max-w-xs truncate">
                      {Object.keys(l.metadata).length > 0
                        ? JSON.stringify(l.metadata)
                        : '—'}
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
