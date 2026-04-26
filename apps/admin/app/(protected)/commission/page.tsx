'use client'
// apps/admin/app/(protected)/commission/page.tsx
// Agent/Partner workspace only.
// Shows commission earnings summary + table + payout bank details.

import { useEffect, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Commission = {
  id: string
  subscription_period: string
  gross_amount: number
  commission_rate: number
  commission_amount: number
  currency: string
  status: 'PENDING' | 'APPROVED' | 'PAID'
  created_at: string
  paid_at: string | null
  referrals: { customer_email: string; customer_name: string | null } | null
}

type CommissionSummary = {
  this_month_amount: number
  pending_payout_amount: number
  paid_to_date_amount: number
  lifetime_amount: number
  currency: string
}

type PayoutSettings = {
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  payout_method: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMYR(n: number) {
  return new Intl.NumberFormat('ms-MY', { style: 'currency', currency: 'MYR' }).format(n)
}

function formatPercent(rate: number) {
  return `${(rate * 100).toFixed(0)}%`
}

function formatDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatPeriod(period: string) {
  // 'YYYY-MM' → 'Jan 2026'
  const [y, m] = period.split('-')
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-MY', { month: 'short', year: 'numeric' })
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:  { label: 'Pending',  className: 'bg-yellow-50 text-yellow-700' },
  APPROVED: { label: 'Approved', className: 'bg-blue-50 text-blue-700' },
  PAID:     { label: 'Paid',     className: 'bg-green-50 text-green-700' },
}

// ── Summary cards ──────────────────────────────────────────────────────────────

function SummaryCards({ summary }: { summary: CommissionSummary }) {
  const cards = [
    { label: 'This month',    value: summary.this_month_amount,     accent: false },
    { label: 'Pending payout',value: summary.pending_payout_amount, accent: true  },
    { label: 'Paid to date',  value: summary.paid_to_date_amount,   accent: false },
    { label: 'Lifetime',      value: summary.lifetime_amount,       accent: false },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`bg-white rounded-xl border p-4 ${c.accent ? 'border-blue-200' : 'border-gray-200'}`}
        >
          <p className="text-xs text-gray-400">{c.label}</p>
          <p className={`text-xl font-bold tabular-nums mt-1 ${c.accent ? 'text-blue-700' : 'text-gray-900'}`}>
            {formatMYR(c.value)}
          </p>
        </div>
      ))}
    </div>
  )
}

// ── Payout Settings Form ───────────────────────────────────────────────────────

function PayoutSettingsCard({ initial }: { initial: PayoutSettings }) {
  const [settings, setSettings] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/workspace/commission?view=payout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save')
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Payout Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Where commission payments will be sent</p>
        </div>
        {saved && (
          <span className="text-xs text-green-600 font-medium">✓ Saved</span>
        )}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {editing ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
              <input
                value={settings.bank_name ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, bank_name: e.target.value }))}
                placeholder="e.g., Maybank"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Holder Name</label>
              <input
                value={settings.bank_account_name ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, bank_account_name: e.target.value }))}
                placeholder="Full name as per IC"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Account Number</label>
              <input
                value={settings.bank_account_number ?? ''}
                onChange={(e) => setSettings((s) => ({ ...s, bank_account_number: e.target.value }))}
                placeholder="e.g., 1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payout Method</label>
              <select
                value={settings.payout_method}
                onChange={(e) => setSettings((s) => ({ ...s, payout_method: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="TOYYIBPAY">ToyyibPay</option>
                <option value="MANUAL">Manual (contact team)</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-gray-400">Bank</p>
              <p className="text-sm text-gray-800 mt-0.5">{settings.bank_name || <span className="text-gray-400 italic">Not set</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Account Holder</p>
              <p className="text-sm text-gray-800 mt-0.5">{settings.bank_account_name || <span className="text-gray-400 italic">Not set</span>}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Account Number</p>
              <p className="text-sm text-gray-800 mt-0.5">
                {settings.bank_account_number
                  ? `****${settings.bank_account_number.slice(-4)}`
                  : <span className="text-gray-400 italic">Not set</span>}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Payout Method</p>
              <p className="text-sm text-gray-800 mt-0.5 capitalize">
                {settings.payout_method.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CommissionPage() {
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [payout, setPayout] = useState<PayoutSettings | null>(null)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [accessError, setAccessError] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [commRes, payoutRes] = await Promise.all([
        fetch('/api/workspace/commission?page_size=50'),
        fetch('/api/workspace/commission?view=payout'),
      ])

      if (commRes.status === 403) { setAccessError(true); return }

      const commJson = await commRes.json()
      const payoutJson = await payoutRes.json()

      setCommissions(commJson.commissions ?? [])
      setSummary(commJson.summary ?? null)
      setTotal(commJson.total ?? 0)
      setPayout(payoutJson.payout_settings ?? null)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm font-medium text-gray-700">Commission is only available for Agent workspaces</p>
      </div>
    )
  }

  const filtered = statusFilter
    ? commissions.filter((c) => c.status === statusFilter)
    : commissions

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Commission</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Earnings from your referred customers' subscriptions.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
      ) : (
        <>
          {/* Summary cards */}
          {summary && <SummaryCards summary={summary} />}

          {/* Commission table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                Commission History <span className="text-gray-400 font-normal">({total})</span>
              </h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none"
              >
                <option value="">All status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400">
                <p>{commissions.length === 0 ? 'No commissions yet. Commissions are recorded when your referred customers subscribe.' : 'No entries match filter.'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Period</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Customer</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Rate</th>
                      <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Commission</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Paid on</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-600 font-medium">{formatPeriod(c.subscription_period)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{c.referrals?.customer_name ?? c.referrals?.customer_email ?? '—'}</div>
                          {c.referrals?.customer_name && <div className="text-xs text-gray-400">{c.referrals.customer_email}</div>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-gray-900">{formatMYR(c.gross_amount)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{formatPercent(c.commission_rate)}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-gray-900">{formatMYR(c.commission_amount)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[c.status]?.className ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_CONFIG[c.status]?.label ?? c.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.paid_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Payout settings */}
          {payout && <PayoutSettingsCard initial={payout} />}
        </>
      )}
    </div>
  )
}
