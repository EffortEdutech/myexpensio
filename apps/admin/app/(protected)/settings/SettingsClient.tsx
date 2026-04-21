'use client'
/**
* apps/admin/app/(protected)/settings/
*/

import { useEffect, useMemo, useState } from 'react'

type Org = {
  id: string
  name: string
  display_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  status: string
  created_at: string
  updated_at: string | null
}
type Sub = { org_id: string; tier: 'FREE' | 'PRO'; period_start: string | null; period_end: string | null; updated_at: string }
type OrgSettingRow = { org_id: string; settings: unknown; updated_at: string }

// Hardcoded PRO limits (always unlimited — not editable)
const PRO_DEFAULTS = { routes_per_month: null as number | null, trips_per_month: null as number | null, exports_per_month: null as number | null }

type PlatformConfig = {
  free_routes_per_month: number | null
  free_trips_per_month: number | null
  free_exports_per_month: number | null
}

type OrgPolicyForm = {
  tier: 'FREE' | 'PRO'
  preset: 'DEFAULT' | 'BETA_UNLIMITED' | 'CUSTOM'
  routes_per_month: string
  trips_per_month: string
  exports_per_month: string
  label: string
  expires_at: string
  notes: string
  org_name: string
  org_display_name: string
  contact_email: string
  contact_phone: string
  address: string
  org_notes: string
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function toInput(value: number | null | undefined) {
  return value == null ? '' : String(value)
}

function trimOrNull(value: string) {
  const v = value.trim()
  return v ? v : null
}

function parseOrgLimits(raw: unknown) {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const limits = obj.limits && typeof obj.limits === 'object' ? obj.limits as Record<string, unknown> : {}
  const presetRaw = String(limits.preset ?? 'DEFAULT').trim().toUpperCase()

  return {
    preset: (presetRaw === 'CUSTOM' || presetRaw === 'BETA_UNLIMITED') ? presetRaw : 'DEFAULT',
    routes_per_month: typeof limits.routes_per_month === 'number' ? limits.routes_per_month : null,
    trips_per_month: typeof limits.trips_per_month === 'number' ? limits.trips_per_month : null,
    exports_per_month: typeof limits.exports_per_month === 'number' ? limits.exports_per_month : null,
    label: typeof limits.label === 'string' ? limits.label : '',
    expires_at: typeof limits.expires_at === 'string' ? limits.expires_at : '',
    notes: typeof limits.notes === 'string' ? limits.notes : '',
  } as const
}

function buildOrgInitialState(orgs: Org[], subscriptions: Sub[], rows: OrgSettingRow[]) {
  const byOrg = new Map(rows.map((row) => [row.org_id, row]))
  return Object.fromEntries(
    orgs.map((org) => {
      const sub = subscriptions.find((s) => s.org_id === org.id)
      const limits = parseOrgLimits(byOrg.get(org.id)?.settings)
      return [org.id, {
        tier: (sub?.tier ?? 'FREE') as 'FREE' | 'PRO',
        preset: limits.preset,
        routes_per_month: toInput(limits.routes_per_month),
        trips_per_month: toInput(limits.trips_per_month),
        exports_per_month: toInput(limits.exports_per_month),
        label: limits.label,
        expires_at: limits.expires_at,
        notes: limits.notes,
        org_name: org.name ?? '',
        org_display_name: org.display_name ?? org.name ?? '',
        contact_email: org.contact_email ?? '',
        contact_phone: org.contact_phone ?? '',
        address: org.address ?? '',
        org_notes: org.notes ?? '',
      } satisfies OrgPolicyForm]
    }),
  ) as Record<string, OrgPolicyForm>
}

// effectiveRouteText now uses platform_config state (fetched from API)
function effectiveRouteText(form: OrgPolicyForm, freeConfig: PlatformConfig) {
  if (form.preset === 'BETA_UNLIMITED') return form.label || 'Beta Unlimited'
  if (form.preset === 'CUSTOM') return form.routes_per_month ? `${form.routes_per_month} / month` : 'Unlimited'
  if (form.tier === 'PRO') return 'Pro Unlimited'
  const r = freeConfig.free_routes_per_month
  return r == null ? 'Free — Unlimited' : `Free — ${r} / month`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-gray-500 mb-1.5">{label}</div>
      {children}
    </label>
  )
}

export default function SettingsClient({
  orgs, subscriptions, orgSettings,
}: {
  orgs: Org[]
  subscriptions: Sub[]
  orgSettings: OrgSettingRow[]
}) {
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // ── Platform config state (fetched from /api/admin/platform-config) ─────────
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({
    free_routes_per_month: 2,
    free_trips_per_month: null,
    free_exports_per_month: null,
  })
  const [freeForm, setFreeForm] = useState({
    routes: '2',
    trips: '',
    exports: '',
  })
  const [configLoaded, setConfigLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/admin/platform-config')
      .then(r => r.json())
      .then(json => {
        if (json.config) {
          const c: PlatformConfig = json.config
          setPlatformConfig(c)
          setFreeForm({
            routes: toInput(c.free_routes_per_month),
            trips: toInput(c.free_trips_per_month),
            exports: toInput(c.free_exports_per_month),
          })
        }
      })
      .catch(() => {/* fail silently — defaults stay */})
      .finally(() => setConfigLoaded(true))
  }, [])

  async function saveFreeLimits() {
    setBusy('platform')
    try {
      const payload = {
        free_routes_per_month: freeForm.routes.trim() === '' ? null : Number(freeForm.routes),
        free_trips_per_month: freeForm.trips.trim() === '' ? null : Number(freeForm.trips),
        free_exports_per_month: freeForm.exports.trim() === '' ? null : Number(freeForm.exports),
      }
      const res = await fetch('/api/admin/platform-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setPlatformConfig(json.config)
      toast_('ok', 'Free tier limits updated')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  const [orgForms, setOrgForms] = useState<Record<string, OrgPolicyForm>>(buildOrgInitialState(orgs, subscriptions, orgSettings))

  function toast_(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_org', name: newName.trim(), display_name: newName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      window.location.reload()
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setCreating(false)
    }
  }

  async function toggleOrgStatus(org: Org) {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} "${org.display_name ?? org.name}"?`)) return
    setBusy(`status-${org.id}`)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, status: newStatus }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      window.location.reload()
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function saveOrg(orgId: string) {
    const form = orgForms[orgId]
    setBusy(`org-${orgId}`)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'org',
          org_id: orgId,
          tier: form.tier,
          org_profile: {
            name: form.org_name,
            display_name: form.org_display_name,
            contact_email: trimOrNull(form.contact_email),
            contact_phone: trimOrNull(form.contact_phone),
            address: trimOrNull(form.address),
            notes: trimOrNull(form.org_notes),
          },
          limits_override: {
            preset: form.preset,
            routes_per_month: trimOrNull(form.routes_per_month) ? Number(form.routes_per_month) : null,
            trips_per_month: trimOrNull(form.trips_per_month) ? Number(form.trips_per_month) : null,
            exports_per_month: trimOrNull(form.exports_per_month) ? Number(form.exports_per_month) : null,
            label: trimOrNull(form.label),
            expires_at: trimOrNull(form.expires_at),
            notes: trimOrNull(form.notes),
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      toast_('ok', 'Organisation profile and policy updated')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Organisation Profiles, Limits & Policies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organisation here means the agent / affiliate / manager that manages enrolled users. It is not the claimant employer company.</p>
        </div>
        <button onClick={() => setShowNew(v => !v)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
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
            <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Organisation / agent name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">Organisation will be created on Free tier. You can edit its profile and policy immediately below.</p>
        </div>
      )}

      {/* ── Platform Free Tier Limits ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Free Tier Limits</h2>
          <p className="text-xs text-gray-500 mt-1">
            Default limits for all FREE organisations using the DEFAULT preset. Leave blank for unlimited. PRO tier is always unlimited.
          </p>
        </div>

        {!configLoaded ? (
          <div className="text-xs text-gray-400">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Routes / month">
                <input
                  type="number" min="0" step="1"
                  placeholder="blank = unlimited"
                  value={freeForm.routes}
                  onChange={e => setFreeForm(f => ({ ...f, routes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Trips / month">
                <input
                  type="number" min="0" step="1"
                  placeholder="blank = unlimited"
                  value={freeForm.trips}
                  onChange={e => setFreeForm(f => ({ ...f, trips: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
              <Field label="Exports / month">
                <input
                  type="number" min="0" step="1"
                  placeholder="blank = unlimited"
                  value={freeForm.exports}
                  onChange={e => setFreeForm(f => ({ ...f, exports: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Current: Routes {platformConfig.free_routes_per_month ?? '∞'} · Trips {platformConfig.free_trips_per_month ?? '∞'} · Exports {platformConfig.free_exports_per_month ?? '∞'}
              </p>
              <button
                onClick={saveFreeLimits}
                disabled={busy === 'platform'}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-700"
              >
                {busy === 'platform' ? 'Saving…' : 'Save Free Tier Limits'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Per-org policies ──────────────────────────────────────────────────── */}
      <div className="space-y-4">
        {orgs.map(org => {
          const form = orgForms[org.id]
          const effective = effectiveRouteText(form, platformConfig)

          return (
            <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-base font-semibold text-gray-900">{form.org_display_name || form.org_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{org.id.slice(0, 8)}…</div>
                  <div className="text-xs text-gray-500 mt-1">Created {fmtDate(org.created_at)} · Effective route policy: {effective}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{org.status}</span>
                  <button disabled={busy === `status-${org.id}`} onClick={() => toggleOrgStatus(org)} className={`text-xs font-medium px-3 py-1.5 rounded border ${org.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'} disabled:opacity-40`}>
                    {busy === `status-${org.id}` ? '…' : org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
                Organisation profile = agent / affiliate / manager profile. Claimant employer company belongs in each user profile, not here.
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Organisation Name"><input value={form.org_name} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], org_name: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                <Field label="Display Name"><input value={form.org_display_name} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], org_display_name: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                <Field label="Contact Email"><input value={form.contact_email} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], contact_email: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                <Field label="Contact Phone"><input value={form.contact_phone} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], contact_phone: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                <Field label="Address"><textarea value={form.address} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], address: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[84px]" /></Field>
                <Field label="Organisation Notes"><textarea value={form.org_notes} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], org_notes: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[84px]" /></Field>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Commercial tier">
                  <select value={form.tier} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], tier: e.target.value as 'FREE' | 'PRO' } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                  </select>
                </Field>
                <Field label="Policy preset">
                  <select value={form.preset} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], preset: e.target.value as OrgPolicyForm['preset'] } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                    <option value="DEFAULT">DEFAULT (follow plan)</option>
                    <option value="BETA_UNLIMITED">BETA_UNLIMITED</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </Field>
                <Field label="Display label"><input value={form.label} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], label: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
              </div>

              {form.preset === 'CUSTOM' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Routes / month"><input value={form.routes_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], routes_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                  <Field label="Trips / month"><input value={form.trips_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], trips_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                  <Field label="Exports / month"><input value={form.exports_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], exports_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Override expires at (optional)"><input type="date" value={form.expires_at} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], expires_at: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
                <Field label="Policy notes"><input value={form.notes} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], notes: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></Field>
              </div>

              <div className="flex justify-end">
                <button onClick={() => saveOrg(org.id)} disabled={busy === `org-${org.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {busy === `org-${org.id}` ? 'Saving…' : 'Save Organisation'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
