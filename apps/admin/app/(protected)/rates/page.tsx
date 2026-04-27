'use client'
// apps/admin/app/(protected)/rates/page.tsx
//
// Rate Templates — workspace-aware view.
//
// ALL workspace users (OWNER, ADMIN, MANAGER) can VIEW global rate templates.
// This is read-only — workspace users cannot create or modify rate templates.
// Rate template management is handled by Console internal staff.
//
// What this page is for:
//   - Workspace OWNER/ADMIN see available templates so they know
//     what rates their employees can apply to claims
//   - They can reference the rates for verification / dispute resolution
//   - The actual rate a user applied is stored in their claim snapshot

import { useEffect, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type RateVersion = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null
  meal_rate_default: number | null
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  perdiem_rate_myr: number
  created_at: string
  updated_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtMoney(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `MYR ${Number(v).toFixed(3)}`
}

function fmtMoneyRound(v: number | null | undefined) {
  if (v === null || v === undefined) return '—'
  return `MYR ${Number(v).toFixed(2)}`
}

// ── Expandable rate detail ─────────────────────────────────────────────────────

function RateDetailRow({ rate }: { rate: RateVersion }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Template name */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-medium text-gray-900 text-sm">
              {rate.template_name ?? '—'}
            </span>
          </div>
        </td>

        {/* Effective from */}
        <td className="px-4 py-3 text-sm text-gray-600">
          {fmtDate(rate.effective_from)}
        </td>

        {/* Car rate */}
        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 tabular-nums">
          {fmtMoney(rate.mileage_rate_per_km)}/km
        </td>

        {/* Per diem */}
        <td className="px-4 py-3 text-sm text-right text-gray-700 tabular-nums">
          {fmtMoneyRound(rate.perdiem_rate_myr)}/day
        </td>

        {/* Meal full day */}
        <td className="px-4 py-3 text-sm text-right text-gray-700 tabular-nums">
          {fmtMoneyRound(rate.meal_rate_full_day)}
        </td>

        {/* Lodging */}
        <td className="px-4 py-3 text-sm text-right text-gray-700 tabular-nums">
          {fmtMoneyRound(rate.lodging_rate_default)}
        </td>

        {/* Created by */}
        <td className="px-4 py-3 text-xs text-gray-400">
          {rate.profiles?.display_name ?? rate.profiles?.email ?? '—'}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="border-b border-gray-50 bg-blue-50/30">
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Mileage rates</p>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">🚗 Car</span>
                    <span className="font-medium text-gray-900 tabular-nums">{fmtMoney(rate.mileage_rate_per_km)}/km</span>
                  </div>
                  {rate.motorcycle_rate_per_km !== null && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-600">🏍 Motorcycle</span>
                      <span className="font-medium text-gray-900 tabular-nums">{fmtMoney(rate.motorcycle_rate_per_km)}/km</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Meal rates</p>
                <div className="space-y-1">
                  {[
                    { label: 'Morning', val: rate.meal_rate_morning },
                    { label: 'Noon',    val: rate.meal_rate_noon },
                    { label: 'Evening', val: rate.meal_rate_evening },
                    { label: 'Full day', val: rate.meal_rate_full_day },
                  ].map(({ label, val }) => (
                    <div key={label} className="flex justify-between gap-4">
                      <span className="text-gray-600">{label}</span>
                      <span className="font-medium text-gray-900 tabular-nums">{fmtMoneyRound(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Other rates</p>
                <div className="space-y-1">
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Lodging</span>
                    <span className="font-medium text-gray-900 tabular-nums">{fmtMoneyRound(rate.lodging_rate_default)}/night</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Per diem</span>
                    <span className="font-medium text-gray-900 tabular-nums">{fmtMoneyRound(rate.perdiem_rate_myr)}/day</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Metadata</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>Created: {fmtDate(rate.created_at)}</div>
                  <div>Updated: {fmtDate(rate.updated_at)}</div>
                  <div>Currency: {rate.currency}</div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function RatesPage() {
  const [rates, setRates]               = useState<RateVersion[]>([])
  const [templateNames, setTemplateNames] = useState<string[]>([])
  const [loading, setLoading]           = useState(true)
  const [templateFilter, setTemplateFilter] = useState('ALL')

  useEffect(() => {
    fetch('/api/workspace/rates')
      .then(r => r.json())
      .then(json => {
        setRates(json.rates ?? [])
        setTemplateNames(json.templateNames ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = templateFilter === 'ALL'
    ? rates
    : rates.filter(r => r.template_name === templateFilter)

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Rate Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Global rate templates available on the platform. These are set by the platform team.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
        <strong>Read-only view.</strong> Rate templates are managed by the platform team (EffortEdutech).
        Your employees choose which template to apply when setting their personal claim rates.
        The rate used in any claim is recorded in the claim snapshot and cannot be changed after submission.
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={templateFilter}
          onChange={e => setTemplateFilter(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">All templates</option>
          {templateNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {filtered.length} version{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-sm text-gray-400">
            <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No rate templates found</p>
            <p className="text-xs">Contact EffortEdutech to add rate templates</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Template</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Effective from</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Car/km</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Per diem</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Meal (full day)</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Lodging cap</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Created by</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rate => (
                  <RateDetailRow key={rate.id} rate={rate} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <p className="text-xs text-gray-400">
        Click any row to expand full rate breakdown. Rates shown in MYR.
      </p>
    </div>
  )
}
