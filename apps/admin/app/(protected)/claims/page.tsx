'use client'
// apps/admin/app/(protected)/claims/page.tsx
// Claims overview — all claims in the workspace, filterable.
// READ-ONLY admin view. SUBMITTED claims show lock badge.

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = {
  id: string
  email: string | null
  display_name: string | null
}

type Claim = {
  id: string
  org_id: string
  user_id: string
  status: 'DRAFT' | 'SUBMITTED'
  title: string | null
  total_amount: number
  currency: string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  profiles: Profile | null
}

type ClaimsResponse = {
  claims: Claim[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMYR(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency', currency: 'MYR', maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: 'DRAFT' | 'SUBMITTED' }) {
  return status === 'SUBMITTED' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      Submitted
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      Draft
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const PAGE_SIZE = 25

  const fetchClaims = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: String(PAGE_SIZE) })
      if (statusFilter) params.set('status', statusFilter)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/workspace/claims?${params}`)
      if (!res.ok) throw new Error('Failed to load claims')
      const json: ClaimsResponse = await res.json()

      setClaims(json.claims)
      setTotal(json.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error loading claims')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, dateFrom, dateTo])

  useEffect(() => {
    setPage(1)
    fetchClaims(1)
  }, [fetchClaims])

  // Client-side search filter (by user name/email)
  const filtered = search.trim()
    ? claims.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.profiles?.display_name?.toLowerCase().includes(q) ||
          c.profiles?.email?.toLowerCase().includes(q) ||
          c.title?.toLowerCase().includes(q)
        )
      })
    : claims

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All claims in this workspace. Read-only — submitted claims are permanently locked.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            placeholder="User name, email, or title…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
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
        {(statusFilter || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatusFilter(''); setDateFrom(''); setDateTo('') }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-gray-400 self-end">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-sm text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-sm text-gray-400">
            <svg className="w-8 h-8 mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No claims found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">
                        {claim.profiles?.display_name ?? '—'}
                      </div>
                      <div className="text-xs text-gray-400">{claim.profiles?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-48 truncate">
                      {claim.title ?? <span className="text-gray-400 italic">Untitled</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={claim.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 tabular-nums">
                      {formatMYR(claim.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(claim.period_start)}
                      {claim.period_end ? ` – ${formatDate(claim.period_end)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(claim.submitted_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/claims/${claim.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { const p = page - 1; setPage(p); fetchClaims(p) }}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => { const p = page + 1; setPage(p); fetchClaims(p) }}
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
