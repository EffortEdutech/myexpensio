'use client'
// apps/admin/app/(protected)/settings/SettingsClient.tsx

import { useMemo, useState } from 'react'

type Org = { id: string; name: string; status: string; created_at: string }
type Sub = { org_id: string; tier: 'FREE' | 'PRO'; period_start: string | null; period_end: string | null; updated_at: string }
type OrgSettingRow = { org_id: string; settings: unknown; updated_at: string }

type PlanForm = {
  routes_per_month: string
  trips_per_month: string
  exports_per_month: string
  label: string
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

function parsePlan(raw: unknown, fallbackLabel: string) {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  return {
    routes_per_month: typeof obj.routes_per_month === 'number' ? obj.routes_per_month : null,
    trips_per_month: typeof obj.trips_per_month === 'number' ? obj.trips_per_month : null,
    exports_per_month: typeof obj.exports_per_month === 'number' ? obj.exports_per_month : null,
    label: typeof obj.label === 'string' && obj.label.trim() ? obj.label : fallbackLabel,
  }
}

function parsePlatformSettings(raw: unknown) {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const plans = obj.plans && typeof obj.plans === 'object' ? obj.plans as Record<string, unknown> : {}

  return {
    FREE: parsePlan(plans.FREE, 'Free'),
    PRO: parsePlan(plans.PRO, 'Pro Unlimited'),
  }
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
      } satisfies OrgPolicyForm]
    }),
  ) as Record<string, OrgPolicyForm>
}

function effectiveRouteText(state: OrgPolicyForm, plans: { FREE: ReturnType<typeof parsePlan>; PRO: ReturnType<typeof parsePlan> }) {
  if (state.preset === 'BETA_UNLIMITED') return state.label || 'Beta Unlimited'
  if (state.preset === 'CUSTOM') return state.routes_per_month ? `${state.routes_per_month} / month` : 'Unlimited'
  const plan = plans[state.tier]
  return plan.routes_per_month == null ? `${plan.label} — Unlimited` : `${plan.label} — ${plan.routes_per_month} / month`
}

export default function SettingsClient({
  orgs,
  subscriptions,
  orgSettings,
  platformSettings,
}: {
  orgs: Org[]
  subscriptions: Sub[]
  orgSettings: OrgSettingRow[]
  platformSettings: unknown
}) {
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const platformParsed = useMemo(() => parsePlatformSettings(platformSettings), [platformSettings])

  const [plans, setPlans] = useState<{ FREE: PlanForm; PRO: PlanForm }>({
    FREE: {
      routes_per_month: toInput(platformParsed.FREE.routes_per_month),
      trips_per_month: toInput(platformParsed.FREE.trips_per_month),
      exports_per_month: toInput(platformParsed.FREE.exports_per_month),
      label: platformParsed.FREE.label,
    },
    PRO: {
      routes_per_month: toInput(platformParsed.PRO.routes_per_month),
      trips_per_month: toInput(platformParsed.PRO.trips_per_month),
      exports_per_month: toInput(platformParsed.PRO.exports_per_month),
      label: platformParsed.PRO.label,
    },
  })

  const [orgForms, setOrgForms] = useState<Record<string, OrgPolicyForm>>(
    buildOrgInitialState(orgs, subscriptions, orgSettings),
  )

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
        body: JSON.stringify({ action: 'create_org', name: newName.trim() }),
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

  async function savePlatformDefaults() {
    setBusy('platform')
    try {
      const payload = {
        scope: 'platform',
        plans: {
          FREE: {
            routes_per_month: trimOrNull(plans.FREE.routes_per_month) ? Number(plans.FREE.routes_per_month) : null,
            trips_per_month: trimOrNull(plans.FREE.trips_per_month) ? Number(plans.FREE.trips_per_month) : null,
            exports_per_month: trimOrNull(plans.FREE.exports_per_month) ? Number(plans.FREE.exports_per_month) : null,
            label: plans.FREE.label,
          },
          PRO: {
            routes_per_month: trimOrNull(plans.PRO.routes_per_month) ? Number(plans.PRO.routes_per_month) : null,
            trips_per_month: trimOrNull(plans.PRO.trips_per_month) ? Number(plans.PRO.trips_per_month) : null,
            exports_per_month: trimOrNull(plans.PRO.exports_per_month) ? Number(plans.PRO.exports_per_month) : null,
            label: plans.PRO.label,
          },
        },
      }

      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      toast_('ok', 'Platform defaults updated')
    } catch (e: unknown) {
      toast_('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(null)
    }
  }

  async function toggleOrgStatus(org: Org) {
    const newStatus = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (!confirm(`${newStatus === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} "${org.name}"?`)) return
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

  async function saveOrgPolicy(orgId: string) {
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
      toast_('ok', 'Organisation policy updated')
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
          <h1 className="text-xl font-bold text-gray-900">Platform Limits & Policies</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure plan defaults and per-organisation overrides, including beta unlimited access.</p>
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
            <input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Organisation name" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button type="submit" disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2">Organisation will be created on Free tier. You can customise limits immediately below.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Platform Default Plans</h2>
          <p className="text-xs text-gray-500 mt-1">These defaults apply when an organisation uses preset = DEFAULT.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {(['FREE', 'PRO'] as const).map(tier => (
            <div key={tier} className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="text-sm font-semibold text-gray-900">{tier} default</div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Routes / month">
                  <input value={plans[tier].routes_per_month} onChange={e => setPlans(prev => ({ ...prev, [tier]: { ...prev[tier], routes_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="blank = unlimited" />
                </Field>
                <Field label="Trips / month">
                  <input value={plans[tier].trips_per_month} onChange={e => setPlans(prev => ({ ...prev, [tier]: { ...prev[tier], trips_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="future use" />
                </Field>
                <Field label="Exports / month">
                  <input value={plans[tier].exports_per_month} onChange={e => setPlans(prev => ({ ...prev, [tier]: { ...prev[tier], exports_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="future use" />
                </Field>
              </div>
              <Field label="Label">
                <input value={plans[tier].label} onChange={e => setPlans(prev => ({ ...prev, [tier]: { ...prev[tier], label: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </Field>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={savePlatformDefaults} disabled={busy === 'platform'} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {busy === 'platform' ? 'Saving…' : 'Save Platform Defaults'}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {orgs.map(org => {
          const form = orgForms[org.id]
          const effective = effectiveRouteText(form, { FREE: platformParsed.FREE, PRO: platformParsed.PRO })

          return (
            <div key={org.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-base font-semibold text-gray-900">{org.name}</div>
                  <div className="text-xs text-gray-400 font-mono">{org.id.slice(0, 8)}…</div>
                  <div className="text-xs text-gray-500 mt-1">Created {fmtDate(org.created_at)} · Effective route policy: {effective}</div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${org.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {org.status}
                  </span>
                  <button disabled={busy === `status-${org.id}`} onClick={() => toggleOrgStatus(org)} className={`text-xs font-medium px-3 py-1.5 rounded border ${org.status === 'ACTIVE' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-700 hover:bg-green-50'} disabled:opacity-40`}>
                    {busy === `status-${org.id}` ? '…' : org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                  </button>
                </div>
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

                <Field label="Display label">
                  <input value={form.label} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], label: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="e.g. Beta Unlimited" />
                </Field>
              </div>

              {form.preset === 'CUSTOM' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Field label="Routes / month">
                    <input value={form.routes_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], routes_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="blank = unlimited" />
                  </Field>
                  <Field label="Trips / month">
                    <input value={form.trips_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], trips_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="future use" />
                  </Field>
                  <Field label="Exports / month">
                    <input value={form.exports_per_month} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], exports_per_month: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="future use" />
                  </Field>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Override expires at (optional)">
                  <input type="date" value={form.expires_at} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], expires_at: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </Field>
                <Field label="Notes">
                  <input value={form.notes} onChange={e => setOrgForms(prev => ({ ...prev, [org.id]: { ...prev[org.id], notes: e.target.value } }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="Reason / internal note" />
                </Field>
              </div>

              <div className="flex justify-end">
                <button onClick={() => saveOrgPolicy(org.id)} disabled={busy === `org-${org.id}`} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {busy === `org-${org.id}` ? 'Saving…' : 'Save Organisation Policy'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-gray-500 mb-1.5">{label}</div>
      {children}
    </label>
  )
}
