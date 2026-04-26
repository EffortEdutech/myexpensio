'use client'
// apps/admin/app/(protected)/referrals/page.tsx
// Agent/Partner workspace only.
//
// Model (locked):
//   Agent invites INDIVIDUAL USERS (not companies).
//   Users register under this Agent workspace.
//   Users submit their own claims to their own external employers.
//   Agent earns commission per user subscription.

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Referral = {
  id: string
  customer_email: string
  customer_name: string | null
  status: 'INVITED' | 'SIGNED_UP' | 'SUBSCRIBED' | 'CHURNED'
  signed_up_at: string | null
  subscribed_at: string | null
  created_at: string
}

type ReferralsResponse = {
  referrals: Referral[]
  total: number
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string; dot: string }> = {
  INVITED:    { label: 'Invited',    className: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
  SIGNED_UP:  { label: 'Signed Up',  className: 'bg-blue-50 text-blue-700',     dot: 'bg-blue-500' },
  SUBSCRIBED: { label: 'Subscribed', className: 'bg-green-50 text-green-700',   dot: 'bg-green-500' },
  CHURNED:    { label: 'Churned',    className: 'bg-red-50 text-red-600',       dot: 'bg-red-400' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.INVITED
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Invite Modal ───────────────────────────────────────────────────────────────

function InviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!email.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_email: email, customer_name: name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create referral')
      onCreated()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error creating referral')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Invite a Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
          The customer will receive an invite email to register their MyExpensio account under your partner network.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name (optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ahmad bin Ali"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !email.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stats strip ────────────────────────────────────────────────────────────────

function StatsStrip({ referrals }: { referrals: Referral[] }) {
  const counts = {
    invited:    referrals.filter(r => r.status === 'INVITED').length,
    signed_up:  referrals.filter(r => r.status === 'SIGNED_UP').length,
    subscribed: referrals.filter(r => r.status === 'SUBSCRIBED').length,
    churned:    referrals.filter(r => r.status === 'CHURNED').length,
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: 'Invited',    value: counts.invited,    color: 'text-gray-700' },
        { label: 'Signed Up',  value: counts.signed_up,  color: 'text-blue-700' },
        { label: 'Subscribed', value: counts.subscribed, color: 'text-green-700' },
        { label: 'Churned',    value: counts.churned,    color: 'text-red-600' },
      ].map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3">
          <p className="text-xs text-gray-400">{stat.label}</p>
          <p className={`text-2xl font-bold tabular-nums mt-0.5 ${stat.color}`}>{stat.value}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [accessError, setAccessError] = useState(false)

  const fetchReferrals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/workspace/referrals?page_size=100')
      if (res.status === 403) { setAccessError(true); return }
      if (!res.ok) throw new Error()
      const json: ReferralsResponse = await res.json()
      setReferrals(json.referrals)
      setTotal(json.total)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReferrals() }, [fetchReferrals])

  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm font-medium text-gray-700">Referrals are only available for Agent workspaces</p>
        <p className="text-xs text-gray-400">This workspace is not an Agent/Partner workspace.</p>
      </div>
    )
  }

  const filtered = referrals.filter((r) => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.customer_email.includes(q) || r.customer_name?.toLowerCase().includes(q)
    const matchStatus = !statusFilter || r.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-5">
      {showModal && (
        <InviteModal onClose={() => setShowModal(false)} onCreated={fetchReferrals} />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Referrals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Individual users you have invited to subscribe under your partner network.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Invite Customer
        </button>
      </div>

      {/* Stats */}
      {!loading && <StatsStrip referrals={referrals} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Email or name…"
            className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <option value="INVITED">Invited</option>
            <option value="SIGNED_UP">Signed Up</option>
            <option value="SUBSCRIBED">Subscribed</option>
            <option value="CHURNED">Churned</option>
          </select>
        </div>
        <span className="ml-auto text-xs text-gray-400 self-end">{total} total</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-sm text-gray-400">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
            </svg>
            {referrals.length === 0 ? 'No referrals yet. Start by inviting a customer.' : 'No referrals match filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Signed Up</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Subscribed</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Invited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{r.customer_name ?? r.customer_email}</div>
                      {r.customer_name && <div className="text-xs text-gray-400">{r.customer_email}</div>}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.signed_up_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.subscribed_at)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
