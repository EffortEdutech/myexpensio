'use client'
// apps/admin/app/(protected)/claims/ClaimsClient.tsx

import { useMemo, useState } from 'react'
import Link from 'next/link'

type Org = { id: string; name: string; display_name: string | null }

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
  updated_at: string
  organizations: { name: string; display_name: string | null } | null
  profiles: { display_name: string | null; email: string | null } | null
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(amount: number, currency = 'MYR') {
  return `${currency} ${Number(amount).toFixed(2)}`
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT:     'bg-amber-50 text-amber-700 border border-amber-200',
    SUBMITTED: 'bg-green-50 text-green-700 border border-green-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${styles[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  )
}

export default function ClaimsClient({
  initialClaims,
  orgs,
}: {
  initialClaims: Claim[]
  orgs: Org[]
}) {
  const [claims, setClaims] = useState(initialClaims)
  const [loading, setLoading] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter]   = useState('')
  const [orgFilter,    setOrgFilter]      = useState('')
  const [search,       setSearch]         = useState('')
  const [from,         setFrom]           = useState('')
  const [to,           setTo]             = useState('')

  const filtered = useMemo(() => {
    return claims.filter(c => {
      if (statusFilter && c.status !== statusFilter) return false
      if (orgFilter && c.org_id !== orgFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const titleMatch = c.title?.toLowerCase().includes(q)
        const userMatch  = c.profiles?.display_name?.toLowerCase().includes(q) || c.profiles?.email?.toLowerCase().includes(q)
        if (!titleMatch && !userMatch) return false
      }
      if (from && c.period_start && c.period_start < from) return false
      if (to && c.period_end && c.period_end > to) return false
      return true
    })
  }, [claims, statusFilter, orgFilter, search, from, to])

  async function fetchWithFilters() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (orgFilter)    params.set('org_id', orgFilter)
      if (search)       params.set('search', search)
      if (from)         params.set('from', from)
      if (to)           params.set('to', to)
      params.set('page_size', '200')

      const res = await fetch(`/api/admin/claims?${params}`)
      const json = await res.json()
      if (res.ok) setClaims(json.claims ?? [])
    } catch {
      // keep existing
    } finally {
      setLoading(false)
    }
  }

  // Totals by status
  const submittedCount = filtered.filter(c => c.status === 'SUBMITTED').length
  const draftCount     = filtered.filter(c => c.status === 'DRAFT').length
  const submittedTotal = filtered
    .filter(c => c.status === 'SUBMITTED')
    .reduce((sum, c) => sum + Number(c.total_amount), 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">All claims across all organisations. Read-only in Phase 1.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Submitted</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{submittedCount}</div>
          <div className="text-xs text-gray-500 mt-1">{fmtMoney(submittedTotal)} total</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Draft</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{draftCount}</div>
          <div className="text-xs text-gray-500 mt-1">In progress</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtered</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{filtered.length}</div>
          <div className="text-xs text-gray-500 mt-1">of {claims.length} loaded</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Organisation</label>
            <select
              value={orgFilter}
              onChange={e => setOrgFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none"
            >
              <option value="">All orgs</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.display_name ?? o.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Period from</label>
            <input
              type="date" value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Period to</label>
            <input
              type="date" value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <input
            type="text" value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search title or staff name…"
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
          />
          <button
            onClick={fetchWithFilters}
            disabled={loading}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Apply'}
          </button>
          <button
            onClick={() => { setStatusFilter(''); setOrgFilter(''); setSearch(''); setFrom(''); setTo('') }}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Claims table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Submitted</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">No claims found.</td>
                </tr>
              )}
              {filtered.map(claim => {
                const org  = Array.isArray(claim.organizations) ? claim.organizations[0] : claim.organizations
                const user = Array.isArray(claim.profiles) ? claim.profiles[0] : claim.profiles
                return (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900 text-xs">{user?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{user?.email ?? '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{(org as { display_name?: string | null; name: string } | null)?.display_name ?? (org as { name: string } | null)?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs text-gray-900 max-w-[180px] truncate">{claim.title ?? '(untitled)'}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {fmtDate(claim.period_start)} – {fmtDate(claim.period_end)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={claim.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 text-xs">{fmtMoney(claim.total_amount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(claim.submitted_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/claims/${claim.id}`}
                        className="text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} claim{filtered.length !== 1 ? 's' : ''} shown
        </div>
      </div>
    </div>
  )
}
