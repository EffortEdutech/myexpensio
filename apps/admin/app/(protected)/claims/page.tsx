'use client'
// apps/admin/app/(protected)/claims/page.tsx
//
// Workspace Claims Oversight — Phase C
// Shows ALL claims in the workspace (all users, all statuses).
// Read-only. Accessible by OWNER, ADMIN, MANAGER.
// SUBMITTED claims are locked — UI reflects this clearly.

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = { id: string; email: string | null; display_name: string | null }

type Claim = {
  id: string
  user_id: string
  status: 'DRAFT' | 'SUBMITTED'
  title: string | null
  total_amount: number | null
  currency: string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  profiles: Profile | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtMoney(val: number | null, currency = 'MYR') {
  if (val === null || val === undefined) return '—'
  return `${currency} ${val.toFixed(2)}`
}

function fmtPeriod(start: string | null, end: string | null) {
  if (!start && !end) return '—'
  const s = start ? new Date(start).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : '?'
  const e = end   ? new Date(end).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '?'
  return `${s} – ${e}`
}

function initials(profile: Profile | null) {
  const name = profile?.display_name ?? profile?.email ?? '?'
  return name.slice(0, 2).toUpperCase()
}

// ── Badge ──────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return status === 'SUBMITTED' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
      Submitted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Draft
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color = 'gray' }: {
  label: string; value: string | number; sub?: string
  color?: 'gray' | 'green' | 'amber' | 'blue'
}) {
  const vc = color === 'green' ? 'text-green-700' : color === 'amber' ? 'text-amber-600' : color === 'blue' ? 'text-blue-700' : 'text-gray-900'
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-4 py-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${vc}`}>{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ClaimsPage() {
  const [claims, setClaims]       = useState<Claim[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(true)
  const [status, setStatus]       = useState('')
  const [userId, setUserId]       = useState('')
  const [dateFrom, setDateFrom]   = useState('')
  const [dateTo, setDateTo]       = useState('')

  const PAGE_SIZE = 25

  // Derived KPIs from loaded page
  const submittedCount = claims.filter(c => c.status === 'SUBMITTED').length
  const draftCount     = claims.filter(c => c.status === 'DRAFT').length
  const totalAmount    = claims.filter(c => c.status === 'SUBMITTED')
    .reduce((sum, c) => sum + (c.total_amount ?? 0), 0)

  const fetchClaims = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(p),
        page_size: String(PAGE_SIZE),
      })
      if (status)   params.set('status', status)
      if (userId)   params.set('user_id', userId)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo)   params.set('to', dateTo)

      const res = await fetch(`/api/workspace/claims?${params}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setClaims(json.claims ?? [])
      setTotal(json.total ?? 0)
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [status, userId, dateFrom, dateTo])

  useEffect(() => { setPage(1); fetchClaims(1) }, [fetchClaims])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Claims Oversight</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            All claims in your workspace — read-only view.
          </p>
        </div>
        <Link href="/exports"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export History
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Total claims"   value={total}          sub="in this workspace" />
        <KPICard label="Submitted"      value={submittedCount} sub="locked + audit-ready" color="green" />
        <KPICard label="Draft"          value={draftCount}     sub="in progress"          color="amber" />
        <KPICard label="Submitted value" value={`RM ${totalAmount.toFixed(2)}`} sub="this page" color="blue" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="DRAFT">Draft</option>
        </select>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500 whitespace-nowrap">To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatus(''); setDateFrom(''); setDateTo('') }}
            className="text-xs text-gray-400 hover:text-gray-600">
            Clear filters
          </button>
        )}

        <span className="ml-auto text-xs text-gray-400 self-end">{total} claim{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading…</div>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-52 gap-2">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-gray-400">No claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Claimant', 'Title', 'Period', 'Status', 'Total', 'Submitted', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map(claim => (
                  <tr key={claim.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                    {/* Claimant */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {initials(claim.profiles)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 leading-tight">
                            {claim.profiles?.display_name ?? '—'}
                          </div>
                          <div className="text-xs text-gray-400">{claim.profiles?.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-40 truncate">
                        {claim.title || <span className="text-gray-400 italic">Untitled</span>}
                      </div>
                    </td>

                    {/* Period */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtPeriod(claim.period_start, claim.period_end)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={claim.status} />
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 tabular-nums">
                      {fmtMoney(claim.total_amount, claim.currency)}
                    </td>

                    {/* Submitted at */}
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {fmtDate(claim.submitted_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        View
                      </Link>
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
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {[
              { label: 'Previous', p: page - 1, disabled: page === 1 },
              { label: 'Next',     p: page + 1, disabled: page >= totalPages },
            ].map(({ label, p, disabled }) => (
              <button key={label}
                onClick={() => { setPage(p); fetchClaims(p) }}
                disabled={disabled}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 text-xs">
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
