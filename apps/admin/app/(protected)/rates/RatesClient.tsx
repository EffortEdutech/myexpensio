'use client'
// apps/admin/app/(protected)/rates/RatesClient.tsx
// All rate versions across all orgs. Admin selects org when creating.

import { useState } from 'react'

type Org = { id: string; name: string }
type Rate = {
  id: string; org_id: string; effective_from: string; currency: string
  mileage_rate_per_km: number; perdiem_rate_myr: number
  meal_rate_full_day: number | null; meal_rate_morning: number | null
  meal_rate_noon: number | null; meal_rate_evening: number | null
  lodging_rate_default: number | null; created_at: string
  profiles:      { display_name: string | null; email: string | null } | null
  organizations: { name: string } | null
}

const EMPTY = {
  org_id: '', effective_from: new Date().toISOString().slice(0, 10),
  mileage_rate_per_km: 0.60, perdiem_rate_myr: 150,
  meal_rate_morning: 20, meal_rate_noon: 30, meal_rate_evening: 30, meal_rate_full_day: 60,
  lodging_rate_default: 120,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function RatesClient({ initialRates, orgs }: { initialRates: Rate[]; orgs: Org[] }) {
  const [rates,     setRates]     = useState(initialRates)
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState({ ...EMPTY, org_id: orgs[0]?.id ?? '' })
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [orgFilter, setOrgFilter] = useState('ALL')

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  const filtered = orgFilter === 'ALL' ? rates : rates.filter(r => r.org_id === orgFilter)

  function field(key: keyof typeof form, label: string, placeholder = '') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input type="number" step="0.01" min="0"
          value={(form as Record<string, unknown>)[key] as number}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.org_id) { toast_('err', 'Select an organisation'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/admin/rates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id:               form.org_id,
          effective_from:       form.effective_from,
          mileage_rate_per_km:  parseFloat(String(form.mileage_rate_per_km)),
          perdiem_rate_myr:     parseFloat(String(form.perdiem_rate_myr)),
          meal_rate_morning:    parseFloat(String(form.meal_rate_morning)),
          meal_rate_noon:       parseFloat(String(form.meal_rate_noon)),
          meal_rate_evening:    parseFloat(String(form.meal_rate_evening)),
          meal_rate_full_day:   parseFloat(String(form.meal_rate_full_day)),
          lodging_rate_default: parseFloat(String(form.lodging_rate_default)),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setRates(prev => [json.rate, ...prev])
      setShowForm(false); setForm({ ...EMPTY, org_id: orgs[0]?.id ?? '' })
      toast_('ok', 'Rate version created')
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rate Versions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Mileage + meal + lodging rates for all organisations</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? 'Cancel' : '+ New Rate Version'}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">New Rate Version</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation <span className="text-red-500">*</span></label>
              <select value={form.org_id} onChange={e => setForm(f => ({ ...f, org_id: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select org…</option>
                {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From <span className="text-red-500">*</span></label>
              <input type="date" value={form.effective_from} onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))} required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {field('mileage_rate_per_km', 'Mileage Rate (MYR/km)', '0.60')}
            {field('perdiem_rate_myr', 'Per Diem Rate (MYR/day)', '150.00')}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Meal Rates (MYR)</p>
              <div className="grid grid-cols-2 gap-3">
                {field('meal_rate_morning', 'Morning')}
                {field('meal_rate_noon', 'Noon')}
                {field('meal_rate_evening', 'Evening')}
                {field('meal_rate_full_day', 'Full Day')}
              </div>
            </div>
            {field('lodging_rate_default', 'Lodging Cap (MYR/night)', '200.00')}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Create Rate Version'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <select value={orgFilter} onChange={e => setOrgFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All organisations</option>
          {orgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} versions</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Effective</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Mileage</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Per Diem</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Meal (Full)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lodging</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(r => {
                const p   = Array.isArray(r.profiles)      ? r.profiles[0]      : r.profiles
                const org = Array.isArray(r.organizations) ? r.organizations[0] : r.organizations
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{(org as {name?:string}|null)?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(r.effective_from)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">MYR {Number(r.mileage_rate_per_km).toFixed(2)}/km</td>
                    <td className="px-4 py-3 text-right text-gray-700">MYR {Number(r.perdiem_rate_myr).toFixed(2)}/day</td>
                    <td className="px-4 py-3 text-right text-gray-700">MYR {Number(r.meal_rate_full_day ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">MYR {Number(r.lodging_rate_default ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{(p as {display_name?:string|null}|null)?.display_name ?? '—'}</td>
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
