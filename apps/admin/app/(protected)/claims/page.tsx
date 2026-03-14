// apps/admin/app/(protected)/claims/page.tsx
'use client'

import { useEffect, useState } from 'react'
import type { ClaimStatus } from '@/lib/types'

type ClaimRow = {
  id: string
  user_id: string
  status: ClaimStatus
  title: string | null
  total_amount: number
  currency: string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

function StatusBadge({ status }: { status: ClaimStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
      ${status === 'SUBMITTED'
        ? 'bg-green-100 text-green-700'
        : 'bg-amber-100 text-amber-700'}`}>
      {status}
    </span>
  )
}

export default function ClaimsPage() {
  const [claims, setClaims]         = useState<ClaimRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterStatus, setFilter]   = useState<'' | ClaimStatus>('')
  const [search, setSearch]         = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res  = await fetch('/api/admin/claims')
      const json = await res.json()
      setClaims(json.claims ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const visible = claims.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
      return (
        (c.title ?? '').toLowerCase().includes(q) ||
        (profile?.email ?? '').toLowerCase().includes(q) ||
        (profile?.display_name ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const submittedCount = claims.filter((c) => c.status === 'SUBMITTED').length
  const draftCount     = claims.filter((c) => c.status === 'DRAFT').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {submittedCount} submitted · {draftCount} draft — all read-only in admin view
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by title or staff name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilter(e.target.value as '' | ClaimStatus)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                    No claims found.
                  </td>
                </tr>
              )}
              {visible.map((c) => {
                const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{profile?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{profile?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.title ?? '(untitled)'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.period_start && c.period_end
                        ? `${c.period_start} → ${c.period_end}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      RM {c.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.submitted_at
                        ? new Date(c.submitted_at).toLocaleDateString('en-MY')
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
