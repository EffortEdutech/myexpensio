'use client'

import { useMemo, useState } from 'react'

type Rate = {
  id: string
  template_name: string | null
  effective_from: string
  currency: string
  mileage_rate_per_km: number
  motorcycle_rate_per_km: number | null    // ← NEW
  meal_rate_default: number | null
  meal_rate_per_session: number | null
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

const EMPTY = {
  id: '',
  template_name: '',
  effective_from: new Date().toISOString().slice(0, 10),
  mileage_rate_per_km: 0.60,
  motorcycle_rate_per_km: 0.30,            // ← NEW
  perdiem_rate_myr: 150,
  meal_rate_morning: 20,
  meal_rate_noon: 30,
  meal_rate_evening: 30,
  meal_rate_full_day: 60,
  lodging_rate_default: 120,
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(v: number | null | undefined) {
  return `MYR ${Number(v ?? 0).toFixed(2)}`
}

export default function RatesClient({
  initialRates,
  templateNames,
}: {
  initialRates: Rate[]
  templateNames: string[]
}) {
  const [rates, setRates] = useState(initialRates)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [templateFilter, setTemplateFilter] = useState('ALL')

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  const filtered = useMemo(
    () => templateFilter === 'ALL' ? rates : rates.filter((r) => r.template_name === templateFilter),
    [rates, templateFilter],
  )

  function field(key: keyof typeof form, label: string, placeholder = '') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type={typeof form[key] === 'number' ? 'number' : 'text'}
          step={typeof form[key] === 'number' ? '0.01' : undefined}
          min={typeof form[key] === 'number' ? '0' : undefined}
          value={(form as Record<string, unknown>)[key] as string | number}
          onChange={(e) => setForm((f) => ({
            ...f,
            [key]: typeof f[key] === 'number' ? Number(e.target.value) : e.target.value,
          }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    )
  }

  function openNewForm() {
    setEditingId(null)
    setForm({ ...EMPTY })
    setShowForm(true)
  }

  function openEditForm(rate: Rate) {
    setEditingId(rate.id)
    setForm({
      id: rate.id,
      template_name: rate.template_name ?? '',
      effective_from: rate.effective_from,
      mileage_rate_per_km: Number(rate.mileage_rate_per_km ?? 0),
      motorcycle_rate_per_km: Number(rate.motorcycle_rate_per_km ?? 0),   // ← NEW
      perdiem_rate_myr: Number(rate.perdiem_rate_myr ?? 0),
      meal_rate_morning: Number(rate.meal_rate_morning ?? 0),
      meal_rate_noon: Number(rate.meal_rate_noon ?? 0),
      meal_rate_evening: Number(rate.meal_rate_evening ?? 0),
      meal_rate_full_day: Number(rate.meal_rate_full_day ?? 0),
      lodging_rate_default: Number(rate.lodging_rate_default ?? 0),
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.template_name.trim()) {
      toast_('err', 'Template name is required')
      return
    }

    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const res = await fetch('/api/admin/rates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')

      if (editingId) {
        setRates((prev) => prev.map((item) => (item.id === editingId ? json.rate : item)))
        toast_('ok', 'Rate template updated')
      } else {
        setRates((prev) => [json.rate, ...prev])
        toast_('ok', 'Rate template version created')
      }

      setShowForm(false)
      setEditingId(null)
      setForm({ ...EMPTY })
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(rate: Rate) {
    if (!confirm(`Delete ${rate.template_name ?? 'template'} on ${rate.effective_from}?`)) return
    setDeletingId(rate.id)
    try {
      const res = await fetch(`/api/admin/rates?id=${encodeURIComponent(rate.id)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setRates((prev) => prev.filter((item) => item.id !== rate.id))
      toast_('ok', 'Rate template deleted')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Rate Templates</h1>
          <p className="text-sm text-gray-500 mt-0.5">Company standard claim-rate templates. Users may copy any template into their own personal rate profile.</p>
        </div>
        <button onClick={() => showForm ? setShowForm(false) : openNewForm()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? 'Cancel' : '+ New Template Version'}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">{editingId ? 'Edit Template Version' : 'New Template Version'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {field('template_name', 'Template Name', 'e.g. TNB')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
              <input type="date" value={form.effective_from} onChange={(e) => setForm((f) => ({ ...f, effective_from: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* ── Mileage rates ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3">
              {field('mileage_rate_per_km', '🚗 Car Rate (MYR/km)')}
              {field('motorcycle_rate_per_km', '🏍 Motorcycle Rate (MYR/km)')}
            </div>

            {field('perdiem_rate_myr', 'Per Diem Rate (MYR/day)')}
            <div className="grid grid-cols-2 gap-3">
              {field('meal_rate_morning', 'Morning')}
              {field('meal_rate_noon', 'Noon')}
              {field('meal_rate_evening', 'Evening')}
              {field('meal_rate_full_day', 'Full Day')}
            </div>
            {field('lodging_rate_default', 'Lodging Cap (MYR/night)')}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm({ ...EMPTY }) }} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Template Version'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex gap-3">
        <select value={templateFilter} onChange={(e) => setTemplateFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none">
          <option value="ALL">All templates</option>
          {templateNames.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} versions</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Template</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Effective</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">🚗 Car/km</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">🏍 Moto/km</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Per Diem</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Meal (Full)</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Lodging</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created by</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r) => {
                const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{r.template_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(r.effective_from)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.mileage_rate_per_km)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{r.motorcycle_rate_per_km != null ? fmtMoney(r.motorcycle_rate_per_km) : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.perdiem_rate_myr)}/day</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.meal_rate_full_day)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(r.lodging_rate_default)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{(p as { display_name?: string | null } | null)?.display_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditForm(r)} className="px-3 py-1.5 text-xs font-medium rounded border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
                        <button onClick={() => handleDelete(r)} disabled={deletingId === r.id} className="px-3 py-1.5 text-xs font-medium rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50">
                          {deletingId === r.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
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
