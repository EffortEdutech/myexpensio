'use client'
// apps/admin/app/(protected)/settings/SettingsClient.tsx
// Platform settings: create organisations, manage tiers.

import { useState } from 'react'

type Org  = { id: string; name: string; status: string; created_at: string }
type Sub  = { org_id: string; tier: string; period_start: string | null; period_end: string | null; updated_at: string }

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${tier === 'PRO' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
      {tier === 'PRO' ? '✦ Pro' : 'Free'}
    </span>
  )
}

export default function SettingsClient({ orgs: initialOrgs, subscriptions }: { orgs: Org[]; subscriptions: Sub[] }) {
  const [orgs,    setOrgs]    = useState(initialOrgs)
  const [toast,   setToast]   = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy,    setBusy]    = useState<string | null>(null)

  // Create org form
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500)
  }

  function subFor(orgId: string): Sub | undefined {
    return subscriptions.find(s => s.org_id === orgId)
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_org', name: newName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setOrgs(prev => [json.org, ...prev])
      setShowNew(false); setNewName('')
      toast_('ok', `Organisation "${json.org.name}" created`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setCreating(false) }
  }

  async function toggleOrgStatus(org: Org) {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} "${org.name}"?`)) return
    setBusy(org.id)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setOrgs(prev => prev.map(o => o.id === org.id ? { ...o, status: newStatus } : o))
      toast_('ok', `"${org.name}" ${newStatus === 'ACTIVE' ? 'reactivated' : 'suspended'}`)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  async function setTier(org: Org, tier: string) {
    if (!confirm(`Set "${org.name}" to ${tier}?`)) return
    setBusy(`tier-${org.id}`)
    try {
      const res  = await fetch('/api/admin/settings', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, tier }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      // Reflect in local sub data via page reload (simple approach)
      toast_('ok', `Tier updated to ${tier}`)
      setTimeout(() => window.location.reload(), 800)
    } catch (e: unknown) { toast_('err', e instanceof Error ? e.message : 'Failed') }
    finally { setBusy(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all organisations and subscriptions</p>
        </div>
        <button onClick={() => setShowNew(v => !v)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
          {showNew ? 'Cancel' : '+ New Organisation'}
        </button>
      </div>

      {toast && (
        <div className={`px-4 py-2.5 rounded-lg text-sm font-medium ${toast.type === 'ok' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {toast.msg}
        </div>
      )}

      {showNew && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Create New Organisation</h2>
          <form onSubmit={createOrg} className="flex gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} required
              placeholder="Organisation name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={creating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">Organisation will be created on Free tier. Invite members from the Members page.</p>
        </div>
      )}

      {/* Orgs table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">All Organisations ({orgs.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Organisation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tier</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sub Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orgs.map(org => {
                const sub = subFor(org.id)
                return (
                  <tr key={org.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{org.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{org.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TierBadge tier={sub?.tier ?? 'FREE'} />
                        <select
                          value={sub?.tier ?? 'FREE'}
                          disabled={!!busy}
                          onChange={e => setTier(org, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1.5 py-0.5 text-gray-700 focus:outline-none disabled:opacity-40">
                          <option value="FREE">Free</option>
                          <option value="PRO">Pro</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {sub?.period_start ? `${fmtDate(sub.period_start)} – ${fmtDate(sub.period_end)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(org.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        disabled={busy === org.id}
                        onClick={() => toggleOrgStatus(org)}
                        className={`text-xs font-medium disabled:opacity-40 ${org.status === 'ACTIVE' ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}`}>
                        {busy === org.id ? '…' : org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
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
