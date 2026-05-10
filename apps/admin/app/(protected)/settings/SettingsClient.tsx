'use client'
// apps/admin/app/(protected)/settings/SettingsClient.tsx
//
// Three views depending on the viewer's authority level:
//
//   'internal'  Internal staff — platform limits + searchable workspace table + edit drawer
//   'team'      Team workspace OWNER/ADMIN — profile + plan summary (rates on /rates)
//   'agent'     Agent workspace OWNER/ADMIN — profile only + plan summary

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ── Shared types ───────────────────────────────────────────────────────────────

type Org = {
  id: string
  name: string
  display_name: string | null
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  status: string
  workspace_type: string | null
  created_at: string
  updated_at: string | null
}

type Sub = {
  org_id: string
  tier: 'FREE' | 'PRO'
  billing_status: string | null
  period_start: string | null
  period_end: string | null
  updated_at: string
}

type OrgSettingRow = {
  org_id: string
  settings: unknown
  updated_at: string
}

type Props =
  | {
      viewMode: 'internal'
      orgs: Org[]
      subscriptions: Sub[]
      orgSettings: OrgSettingRow[]
      templateNames: string[]
      orgRole: null
      org?: never
      subscription?: never
      adminSetting?: never
    }
  | {
      viewMode: 'team' | 'agent'
      org: Org | null
      subscription: Sub | null
      orgRole: string | null
      orgs?: never
      subscriptions?: never
      orgSettings?: never
      adminSetting?: never
      templateNames?: never
    }

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getSettings(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
}

function getLimits(settings: Record<string, unknown>): Record<string, unknown> {
  const l = settings.limits
  return l && typeof l === 'object' ? l as Record<string, unknown> : {}
}

function toInput(v: unknown) { return v == null ? '' : String(v) }

const TYPE_CFG: Record<string, { label: string; cls: string }> = {
  TEAM:     { label: 'Team',     cls: 'bg-blue-50 text-blue-700' },
  AGENT:    { label: 'Partner',  cls: 'bg-purple-50 text-purple-700' },
  INTERNAL: { label: 'Internal', cls: 'bg-amber-50 text-amber-700' },
}

const TIER_CFG: Record<string, { label: string; cls: string }> = {
  PRO:  { label: 'Pro',  cls: 'bg-blue-50 text-blue-700 font-semibold' },
  FREE: { label: 'Free', cls: 'bg-gray-100 text-gray-500' },
}

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Active',    cls: 'bg-green-50 text-green-700' },
  INACTIVE:  { label: 'Inactive',  cls: 'bg-gray-100 text-gray-500' },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50 text-red-600' },
}

// ── Reusable UI ────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-xl border border-gray-200">{children}</div>
}

function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-5 py-4 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4 space-y-4">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const SELECT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'

function Toast({ toast }: { toast: { type: 'ok' | 'err'; msg: string } | null }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all ${
      toast.type === 'ok'
        ? 'bg-green-50 text-green-700 border-green-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      {toast.msg}
    </div>
  )
}

function useToast() {
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  function show(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3200)
  }
  return { toast, show }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL VIEW — searchable table + slide-in drawer
// ─────────────────────────────────────────────────────────────────────────────

type PlatformConfig = {
  free_routes_per_month: number | null
  free_trips_per_month: number | null
  free_exports_per_month: number | null
}

type DrawerState = {
  org: Org
  tier: 'FREE' | 'PRO'
  preset: 'DEFAULT' | 'BETA_UNLIMITED' | 'CUSTOM'
  routes: string
  trips: string
  exports: string
  label: string
  expires_at: string
  policy_notes: string
  rate_template_name: string
  org_name: string
  org_display_name: string
  contact_email: string
  contact_phone: string
  address: string
  org_notes: string
}

function buildDrawer(org: Org, sub: Sub | undefined, row: OrgSettingRow | undefined): DrawerState {
  const settings = getSettings(row?.settings)
  const limits = getLimits(settings)
  const preset = String(limits.preset ?? 'DEFAULT').trim().toUpperCase()
  return {
    org,
    tier: sub?.tier ?? 'FREE',
    preset: (preset === 'CUSTOM' || preset === 'BETA_UNLIMITED') ? preset as DrawerState['preset'] : 'DEFAULT',
    routes: toInput(limits.routes_per_month),
    trips:  toInput(limits.trips_per_month),
    exports: toInput(limits.exports_per_month),
    label: typeof limits.label === 'string' ? limits.label : '',
    expires_at: typeof limits.expires_at === 'string' ? limits.expires_at : '',
    policy_notes: typeof limits.notes === 'string' ? limits.notes : '',
    rate_template_name: typeof settings.rate_template_name === 'string' ? settings.rate_template_name : '',
    org_name: org.name ?? '',
    org_display_name: org.display_name ?? org.name ?? '',
    contact_email: org.contact_email ?? '',
    contact_phone: org.contact_phone ?? '',
    address: org.address ?? '',
    org_notes: org.notes ?? '',
  }
}

function InternalView({
  orgs, subscriptions, orgSettings, templateNames,
}: {
  orgs: Org[]
  subscriptions: Sub[]
  orgSettings: OrgSettingRow[]
  templateNames: string[]
}) {
  const { toast, show } = useToast()

  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>({ free_routes_per_month: 2, free_trips_per_month: null, free_exports_per_month: null })
  const [freeForm, setFreeForm] = useState({ routes: '2', trips: '', exports: '' })
  const [platformLoaded, setPlatformLoaded] = useState(false)
  const [platformBusy, setPlatformBusy] = useState(false)
  const [showPlatform, setShowPlatform] = useState(false)

  function loadPlatformConfig() {
    if (platformLoaded) return
    fetch('/api/admin/platform-config')
      .then(r => r.json())
      .then(j => {
        if (j.config) {
          const c: PlatformConfig = j.config
          setPlatformConfig(c)
          setFreeForm({
            routes:  c.free_routes_per_month  != null ? String(c.free_routes_per_month)  : '',
            trips:   c.free_trips_per_month   != null ? String(c.free_trips_per_month)   : '',
            exports: c.free_exports_per_month != null ? String(c.free_exports_per_month) : '',
          })
        }
      })
      .catch(() => {})
      .finally(() => setPlatformLoaded(true))
  }

  async function savePlatformLimits() {
    setPlatformBusy(true)
    try {
      const res = await fetch('/api/admin/platform-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          free_routes_per_month:  freeForm.routes.trim()  ? Number(freeForm.routes)  : null,
          free_trips_per_month:   freeForm.trips.trim()   ? Number(freeForm.trips)   : null,
          free_exports_per_month: freeForm.exports.trim() ? Number(freeForm.exports) : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setPlatformConfig(json.config)
      show('ok', 'Free tier limits updated')
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setPlatformBusy(false)
    }
  }

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filtered = useMemo(() => {
    return orgs.filter(o => {
      const matchSearch = !search || (o.display_name ?? o.name).toLowerCase().includes(search.toLowerCase())
      const matchType = !typeFilter || o.workspace_type === typeFilter
      return matchSearch && matchType
    })
  }, [orgs, search, typeFilter])

  const [drawer, setDrawer] = useState<DrawerState | null>(null)
  const [drawerBusy, setDrawerBusy] = useState(false)

  function openDrawer(org: Org) {
    const sub = subscriptions.find(s => s.org_id === org.id)
    const row = orgSettings.find(r => r.org_id === org.id)
    setDrawer(buildDrawer(org, sub, row))
  }

  function closeDrawer() { setDrawer(null) }

  function setD(patch: Partial<DrawerState>) {
    setDrawer(prev => prev ? { ...prev, ...patch } : prev)
  }

  async function saveDrawer() {
    if (!drawer) return
    if (!drawer.org_name.trim()) { show('err', 'Workspace name is required'); return }
    setDrawerBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scope: 'org',
          org_id: drawer.org.id,
          tier: drawer.tier,
          org_profile: {
            name:          drawer.org_name,
            display_name:  drawer.org_display_name,
            contact_email: drawer.contact_email || null,
            contact_phone: drawer.contact_phone || null,
            address:       drawer.address || null,
            notes:         drawer.org_notes || null,
          },
          limits_override: {
            preset:            drawer.preset,
            routes_per_month:  drawer.routes.trim()  ? Number(drawer.routes)  : null,
            trips_per_month:   drawer.trips.trim()   ? Number(drawer.trips)   : null,
            exports_per_month: drawer.exports.trim() ? Number(drawer.exports) : null,
            label:             drawer.label || null,
            expires_at:        drawer.expires_at || null,
            notes:             drawer.policy_notes || null,
          },
          rate_template_name: drawer.rate_template_name || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      show('ok', 'Workspace saved')
      setDrawer(null)
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setDrawerBusy(false)
    }
  }

  async function toggleStatus() {
    if (!drawer) return
    const next = drawer.org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    if (!confirm(`${next === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} "${drawer.org.display_name ?? drawer.org.name}"?`)) return
    setDrawerBusy(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: drawer.org.id, status: next }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      show('ok', `Workspace ${next === 'SUSPENDED' ? 'suspended' : 'reactivated'}`)
      setDrawer(null)
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setDrawerBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <Toast toast={toast} />

      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage platform limits and all workspace profiles.</p>
        </div>
        <Link href="/orgs/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Workspace
        </Link>
      </div>

      {/* Platform free tier limits */}
      <Card>
        <button
          onClick={() => { setShowPlatform(v => !v); if (!showPlatform) loadPlatformConfig() }}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <span className="text-sm font-semibold text-gray-900">Free Tier Limits</span>
            <span className="ml-3 text-xs text-gray-400">
              Routes {platformConfig.free_routes_per_month ?? 'unlimited'} · Trips {platformConfig.free_trips_per_month ?? 'unlimited'} · Exports {platformConfig.free_exports_per_month ?? 'unlimited'} / month
            </span>
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPlatform ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPlatform && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-4">
            <p className="text-xs text-gray-400">Default monthly limits for all FREE workspaces on DEFAULT preset. Leave blank for unlimited. PRO tier is always unlimited.</p>
            {!platformLoaded ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  {([
                    { key: 'routes',  label: 'Routes / month' },
                    { key: 'trips',   label: 'Trips / month' },
                    { key: 'exports', label: 'Exports / month' },
                  ] as { key: keyof typeof freeForm; label: string }[]).map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <input type="number" min="0" step="1" placeholder="blank = unlimited"
                        value={freeForm[key]}
                        onChange={e => setFreeForm(f => ({ ...f, [key]: e.target.value }))}
                        className={INPUT} />
                    </Field>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button onClick={savePlatformLimits} disabled={platformBusy}
                    className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
                    {platformBusy ? 'Saving...' : 'Save Free Tier Limits'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Workspace table */}
      <Card>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search workspaces..."
            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            <option value="TEAM">Team</option>
            <option value="AGENT">Partner</option>
          </select>
          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
            {filtered.length} / {orgs.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Workspace', 'Type', 'Tier', 'Status', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                    No workspaces match your search
                  </td>
                </tr>
              ) : filtered.map(org => {
                const sub = subscriptions.find(s => s.org_id === org.id)
                const tier = sub?.tier ?? 'FREE'
                const typeCfg   = TYPE_CFG[org.workspace_type ?? 'TEAM'] ?? TYPE_CFG.TEAM
                const tierCfg   = TIER_CFG[tier]
                const statusCfg = STATUS_CFG[org.status] ?? STATUS_CFG.INACTIVE
                return (
                  <tr key={org.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{org.display_name ?? org.name}</div>
                      <div className="text-xs text-gray-400 font-mono mt-0.5">{org.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${typeCfg.cls}`}>{typeCfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${tierCfg.cls}`}>{tierCfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.cls}`}>{statusCfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{fmtDate(org.created_at)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => openDrawer(org)}
                        className="px-3 py-1 text-xs font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit drawer */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-40 bg-black/25" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">{drawer.org.display_name ?? drawer.org.name}</h2>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{drawer.org.id.slice(0, 12)}...</p>
              </div>
              <button onClick={closeDrawer}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

              {/* Profile section */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</p>
                <Field label="Name">
                  <input value={drawer.org_name} onChange={e => setD({ org_name: e.target.value })} className={INPUT} />
                </Field>
                <Field label="Display name">
                  <input value={drawer.org_display_name} onChange={e => setD({ org_display_name: e.target.value })} className={INPUT} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Contact email">
                    <input type="email" value={drawer.contact_email} onChange={e => setD({ contact_email: e.target.value })} className={INPUT} />
                  </Field>
                  <Field label="Contact phone">
                    <input value={drawer.contact_phone} onChange={e => setD({ contact_phone: e.target.value })} className={INPUT} />
                  </Field>
                </div>
                <Field label="Address">
                  <textarea value={drawer.address} onChange={e => setD({ address: e.target.value })} rows={2} className={INPUT} />
                </Field>
                <Field label="Internal notes">
                  <textarea value={drawer.org_notes} onChange={e => setD({ org_notes: e.target.value })} rows={2} className={INPUT} />
                </Field>
              </section>

              {/* Plan section */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plan</p>
                <Field label="Subscription tier">
                  <select value={drawer.tier} onChange={e => setD({ tier: e.target.value as 'FREE' | 'PRO' })} className={SELECT}>
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                  </select>
                </Field>
                <Field label="Rate template reference">
                  <select value={drawer.rate_template_name} onChange={e => setD({ rate_template_name: e.target.value })} className={SELECT}>
                    <option value="">-- None assigned --</option>
                    {templateNames.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
              </section>

              {/* Policy override section */}
              <section className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Policy Override</p>
                <Field label="Preset">
                  <select value={drawer.preset} onChange={e => setD({ preset: e.target.value as DrawerState['preset'] })} className={SELECT}>
                    <option value="DEFAULT">Default (uses platform limits)</option>
                    <option value="BETA_UNLIMITED">Beta Unlimited</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </Field>
                {drawer.preset === 'CUSTOM' && (
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Routes / mo">
                      <input type="number" min="0" value={drawer.routes} onChange={e => setD({ routes: e.target.value })} placeholder="unlimited" className={INPUT} />
                    </Field>
                    <Field label="Trips / mo">
                      <input type="number" min="0" value={drawer.trips} onChange={e => setD({ trips: e.target.value })} placeholder="unlimited" className={INPUT} />
                    </Field>
                    <Field label="Exports / mo">
                      <input type="number" min="0" value={drawer.exports} onChange={e => setD({ exports: e.target.value })} placeholder="unlimited" className={INPUT} />
                    </Field>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Override label">
                    <input value={drawer.label} onChange={e => setD({ label: e.target.value })} placeholder="e.g. Beta partner" className={INPUT} />
                  </Field>
                  <Field label="Expires at">
                    <input type="date" value={drawer.expires_at} onChange={e => setD({ expires_at: e.target.value })} className={INPUT} />
                  </Field>
                </div>
                <Field label="Policy notes (internal)">
                  <textarea value={drawer.policy_notes} onChange={e => setD({ policy_notes: e.target.value })} rows={2} className={INPUT} />
                </Field>
              </section>
            </div>

            {/* Drawer footer */}
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 space-y-2">
              <button onClick={saveDrawer} disabled={drawerBusy}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition-colors">
                {drawerBusy ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={toggleStatus} disabled={drawerBusy}
                className={`w-full py-2 rounded-xl text-sm font-medium border transition-colors ${
                  drawer.org.status === 'ACTIVE'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-green-200 text-green-700 hover:bg-green-50'
                } disabled:opacity-40`}>
                {drawer.org.status === 'ACTIVE' ? 'Suspend workspace' : 'Reactivate workspace'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WORKSPACE USER VIEW — team or agent
// Profile only. Rates on /rates. Subscription/billing on /billing.
// ─────────────────────────────────────────────────────────────────────────────

function WorkspaceView({
  viewMode, org, subscription, orgRole,
}: {
  viewMode: 'team' | 'agent'
  org: Org | null
  subscription: Sub | null
  orgRole: string | null
}) {
  const { toast, show } = useToast()
  const canEdit = orgRole === 'OWNER' || orgRole === 'ADMIN'

  const [name,        setName]        = useState(org?.name ?? '')
  const [displayName, setDisplayName] = useState(org?.display_name ?? org?.name ?? '')
  const [email,       setEmail]       = useState(org?.contact_email ?? '')
  const [phone,       setPhone]       = useState(org?.contact_phone ?? '')
  const [address,     setAddress]     = useState(org?.address ?? '')
  const [profileBusy, setProfileBusy] = useState(false)

  async function saveProfile() {
    if (!name.trim()) { show('err', 'Workspace name is required'); return }
    setProfileBusy(true)
    try {
      const res = await fetch('/api/workspace/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_profile: {
            name,
            display_name:  displayName || name,
            contact_email: email || null,
            contact_phone: phone || null,
            address:       address || null,
          },
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      show('ok', 'Profile updated')
    } catch (e) {
      show('err', e instanceof Error ? e.message : 'Failed')
    } finally {
      setProfileBusy(false)
    }
  }

  const tier = subscription?.tier ?? 'FREE'
  const billingStatus = subscription?.billing_status ?? 'INACTIVE'

  if (!org) {
    return <div className="text-sm text-gray-400 py-10 text-center">Workspace data unavailable</div>
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Toast toast={toast} />

      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org.display_name ?? org.name}</p>
      </div>

      {!canEdit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          You have view-only access. Only the workspace Owner or Admin can update settings.
        </div>
      )}

      {/* Profile card */}
      <Card>
        <CardHeader title="Workspace Profile" subtitle="Visible on invoices and correspondence" />
        <CardBody>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Workspace name *">
              <input value={name} onChange={e => setName(e.target.value)} disabled={!canEdit}
                className={INPUT + (!canEdit ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : '')} />
            </Field>
            <Field label="Display name">
              <input value={displayName} onChange={e => setDisplayName(e.target.value)} disabled={!canEdit}
                placeholder="Same as name"
                className={INPUT + (!canEdit ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : '')} />
            </Field>
            <Field label="Contact email">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!canEdit}
                className={INPUT + (!canEdit ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : '')} />
            </Field>
            <Field label="Contact phone">
              <input value={phone} onChange={e => setPhone(e.target.value)} disabled={!canEdit}
                placeholder="+60 12-345 6789"
                className={INPUT + (!canEdit ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : '')} />
            </Field>
          </div>
          <Field label="Address">
            <textarea value={address} onChange={e => setAddress(e.target.value)} disabled={!canEdit} rows={2}
              className={INPUT + (!canEdit ? ' bg-gray-50 text-gray-500 cursor-not-allowed' : '')} />
          </Field>
          {canEdit && (
            <div className="flex justify-end pt-1">
              <button onClick={saveProfile} disabled={profileBusy}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {profileBusy ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Quick links */}
      {viewMode === 'team' && (
        <Card>
          <CardHeader title="Quick Links" subtitle="Manage other workspace settings" />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/rates"
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Team Rates
              </Link>
              <Link href="/billing"
                className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Billing
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Plan summary */}
      <Card>
        <CardHeader title="Subscription" subtitle="Managed by EffortEdutech" />
        <CardBody>
          <div className="flex items-center gap-3">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${TIER_CFG[tier].cls}`}>
              {tier === 'PRO' ? 'Pro Plan' : 'Free Plan'}
            </span>
            {billingStatus && billingStatus !== 'INACTIVE' && (
              <span className="text-xs text-gray-500 capitalize">{billingStatus.toLowerCase()}</span>
            )}
          </div>
          {tier === 'FREE' && (
            <p className="text-xs text-gray-400">
              Free plan includes limited route calculations, trips, and exports per month.
              Contact EffortEdutech to upgrade.
            </p>
          )}
          <div className="pt-1">
            <Link href="/billing"
              className="inline-flex items-center gap-1 text-sm text-blue-600 font-medium hover:text-blue-800">
              View billing details
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsClient(props: Props) {
  if (props.viewMode === 'internal') {
    return (
      <InternalView
        orgs={props.orgs}
        subscriptions={props.subscriptions}
        orgSettings={props.orgSettings}
        templateNames={props.templateNames}
      />
    )
  }

  return (
    <WorkspaceView
      viewMode={props.viewMode}
      org={props.org ?? null}
      subscription={props.subscription ?? null}
      orgRole={props.orgRole}
    />
  )
}
