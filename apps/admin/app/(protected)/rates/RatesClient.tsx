// apps/admin/app/(protected)/rates/RatesClient.tsx
'use client'

import { useState } from 'react'

type RateRow = {
  id: string
  effective_from: string
  currency: string
  mileage_rate_per_km: number
  perdiem_rate_myr: number
  meal_rate_full_day: number | null
  meal_rate_morning: number | null
  meal_rate_noon: number | null
  meal_rate_evening: number | null
  lodging_rate_default: number | null
  created_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

type Props = {
  initialRates: RateRow[]
  canCreate: boolean
}

type FormState = {
  effective_from: string
  mileage_rate_per_km: string
  perdiem_rate_myr: string
  meal_rate_morning: string
  meal_rate_noon: string
  meal_rate_evening: string
  meal_rate_full_day: string
  lodging_rate_default: string
}

const EMPTY_FORM: FormState = {
  effective_from:      '',
  mileage_rate_per_km: '',
  perdiem_rate_myr:    '',
  meal_rate_morning:   '',
  meal_rate_noon:      '',
  meal_rate_evening:   '',
  meal_rate_full_day:  '',
  lodging_rate_default:'',
}

function fmt(val: number | null, prefix = 'RM '): string {
  if (val === null || val === undefined) return '—'
  return `${prefix}${val.toFixed(2)}`
}

export default function RatesClient({ initialRates, canCreate }: Props) {
  const [rates, setRates]         = useState(initialRates)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  function field(k: keyof FormState, label: string, placeholder?: string) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={form[k]}
          onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
          placeholder={placeholder ?? '0.00'}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.effective_from) { showToast('err', 'Effective date is required'); return }
    if (!form.mileage_rate_per_km) { showToast('err', 'Mileage rate is required'); return }

    setSaving(true)
    try {
      const payload = {
        effective_from:      form.effective_from,
        mileage_rate_per_km: parseFloat(form.mileage_rate_per_km),
        perdiem_rate_myr:    parseFloat(form.perdiem_rate_myr || '0'),
        meal_rate_morning:   form.meal_rate_morning   ? parseFloat(form.meal_rate_morning)   : null,
        meal_rate_noon:      form.meal_rate_noon      ? parseFloat(form.meal_rate_noon)      : null,
        meal_rate_evening:   form.meal_rate_evening   ? parseFloat(form.meal_rate_evening)   : null,
        meal_rate_full_day:  form.meal_rate_full_day  ? parseFloat(form.meal_rate_full_day)  : null,
        lodging_rate_default:form.lodging_rate_default? parseFloat(form.lodging_rate_default): null,
      }

      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      setRates((prev) => [json.rate, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast('ok', `Rate version for ${form.effective_from} created`)
    } catch (e: unknown) {
      showToast('err', e instanceof Error ? e.message : 'Failed to create rate version')
    } finally {
      setSaving(false)
    }
  }

  const latestRate = rates[0]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rate Versions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Rate versions are immutable once created. Create a new version to update rates.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium
                       hover:bg-blue-700 transition-colors"
          >
            + New Rate Version
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium
          ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {/* Current active rate callout */}
      {latestRate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            Current Active Rate (from {latestRate.effective_from})
          </p>
          <div className="flex flex-wrap gap-6 text-sm text-blue-900">
            <span><strong>Mileage:</strong> RM {latestRate.mileage_rate_per_km.toFixed(2)}/km</span>
            <span><strong>Per Diem:</strong> {fmt(latestRate.perdiem_rate_myr)}/day</span>
            {latestRate.meal_rate_full_day && (
              <span><strong>Meal (full day):</strong> {fmt(latestRate.meal_rate_full_day)}</span>
            )}
            {latestRate.lodging_rate_default && (
              <span><strong>Lodging cap:</strong> {fmt(latestRate.lodging_rate_default)}/night</span>
            )}
          </div>
        </div>
      )}

      {/* Rate history table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Effective From</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage/km</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Per Diem/day</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Meal (full)</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Lodging cap</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">
                    No rate versions yet. Create one to get started.
                  </td>
                </tr>
              )}
              {rates.map((r, i) => {
                const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                return (
                  <tr key={r.id} className={`hover:bg-gray-50 transition-colors ${i === 0 ? 'font-medium' : ''}`}>
                    <td className="px-5 py-3">
                      {r.effective_from}
                      {i === 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{fmt(r.mileage_rate_per_km, 'RM ')}/km</td>
                    <td className="px-4 py-3">{fmt(r.perdiem_rate_myr)}</td>
                    <td className="px-4 py-3">{fmt(r.meal_rate_full_day)}</td>
                    <td className="px-4 py-3">{fmt(r.lodging_rate_default)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {profile?.display_name ?? profile?.email ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Create Rate Modal ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 my-8">
            <h2 className="text-base font-bold text-gray-900 mb-1">New Rate Version</h2>
            <p className="text-xs text-gray-400 mb-5">
              Once saved, this version is immutable. Create a newer version to update rates.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Effective date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effective From <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.effective_from}
                  onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mileage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mileage Rate (MYR/km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={form.mileage_rate_per_km}
                  onChange={(e) => setForm((f) => ({ ...f, mileage_rate_per_km: e.target.value }))}
                  placeholder="0.60"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Per Diem */}
              {field('perdiem_rate_myr', 'Per Diem Rate (MYR/day)', '150.00')}

              {/* Meals */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Meal Rates (MYR)</p>
                <div className="grid grid-cols-2 gap-3">
                  {field('meal_rate_morning', 'Morning')}
                  {field('meal_rate_noon', 'Noon')}
                  {field('meal_rate_evening', 'Evening')}
                  {field('meal_rate_full_day', 'Full Day')}
                </div>
              </div>

              {/* Lodging */}
              {field('lodging_rate_default', 'Lodging Cap (MYR/night)', '200.00')}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm
                             font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm
                             font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Create Rate Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
