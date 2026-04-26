'use client'
// apps/cs/app/(protected)/system/page.tsx — SUPER_ADMIN only

import { useEffect, useState } from 'react'

type Config = {
  free_routes_per_month:    number
  free_trips_per_month:     number | null
  free_exports_per_month:   number | null
  auto_approve_invitations: boolean
  updated_at:               string | null
  updated_by:               string | null
}

function fmt(val: string | null) {
  if (!val) return 'Never'
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const INPUT = 'w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Toggle({
  checked, onChange, disabled,
}: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function SettingRow({
  label, description, children, warn,
}: {
  label: string; description: string; children: React.ReactNode; warn?: boolean
}) {
  return (
    <div className={`flex items-start justify-between gap-6 py-4 border-b border-gray-100 last:border-0 ${warn ? 'bg-amber-50 -mx-5 px-5 rounded-lg' : ''}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0 flex items-start">{children}</div>
    </div>
  )
}

export default function SystemConfigPage() {
  const [config, setConfig]   = useState<Config | null>(null)
  const [form, setForm]       = useState({
    free_routes_per_month:    2,
    free_trips_per_month:     '',
    free_exports_per_month:   '',
    auto_approve_invitations: false,
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [accessError, setAccessError] = useState(false)

  useEffect(() => {
    fetch('/api/console/system')
      .then(async (res) => {
        if (res.status === 403) { setAccessError(true); return }
        const json = await res.json()
        const cfg: Config = json.config
        setConfig(cfg)
        setForm({
          free_routes_per_month:    cfg.free_routes_per_month,
          free_trips_per_month:     cfg.free_trips_per_month !== null ? String(cfg.free_trips_per_month) : '',
          free_exports_per_month:   cfg.free_exports_per_month !== null ? String(cfg.free_exports_per_month) : '',
          auto_approve_invitations: cfg.auto_approve_invitations ?? false,
        })
      })
      .catch(() => setError('Failed to load config'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const payload: Record<string, unknown> = {
        free_routes_per_month:    Number(form.free_routes_per_month),
        auto_approve_invitations: form.auto_approve_invitations,
      }
      if (String(form.free_trips_per_month).trim() !== '')
        payload.free_trips_per_month = Number(form.free_trips_per_month)
      if (String(form.free_exports_per_month).trim() !== '')
        payload.free_exports_per_month = Number(form.free_exports_per_month)

      const res = await fetch('/api/console/system', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setConfig(json.config)
      setSaved(true)
      setTimeout(() => setSaved(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>

  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-sm font-medium text-red-600">SUPER_ADMIN access required</p>
        <p className="text-xs text-gray-400">System configuration can only be edited by SUPER_ADMIN.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">System Configuration</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Platform-wide settings. Changes take effect immediately across all workspaces.
        </p>
      </div>

      {/* Invitation settings */}
      <div className="bg-white border border-gray-200 rounded-xl px-5">
        <div className="py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Invitation Settings</h2>
        </div>

        <SettingRow
          label="Auto-approve invitation requests"
          description={
            form.auto_approve_invitations
              ? 'ON — Requests submitted by workspace admins are automatically executed. User account created + invite email sent immediately. No Console staff action needed.'
              : 'OFF — Requests go into the Invitation Queue. Console staff must manually review, approve and execute each request.'
          }
          warn={form.auto_approve_invitations}
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${form.auto_approve_invitations ? 'text-blue-700' : 'text-gray-500'}`}>
              {form.auto_approve_invitations ? 'ON' : 'OFF'}
            </span>
            <Toggle
              checked={form.auto_approve_invitations}
              onChange={(v) => setForm((f) => ({ ...f, auto_approve_invitations: v }))}
            />
          </div>
        </SettingRow>

        {form.auto_approve_invitations && (
          <div className="py-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
              <strong>⚠️ Auto-approve is ON.</strong> Any workspace admin can add users to their workspace without Console review.
              Suitable for trusted environments. Turn OFF if you want full control over who joins each workspace.
            </div>
          </div>
        )}
      </div>

      {/* Free tier limits */}
      <div className="bg-white border border-gray-200 rounded-xl px-5">
        <div className="py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Free Tier Limits</h2>
          <p className="text-xs text-gray-400 mt-0.5">Applies to all FREE workspaces immediately. Leave blank for unlimited.</p>
        </div>

        <SettingRow
          label="Route calculations / month"
          description="Phase 1 lock: 2. Each call costs a Google Maps API request. Increase carefully."
        >
          <input
            type="number" min={0} step={1}
            value={form.free_routes_per_month}
            onChange={(e) => setForm((f) => ({ ...f, free_routes_per_month: Number(e.target.value) }))}
            className={INPUT}
          />
        </SettingRow>

        <SettingRow
          label="Trips / month"
          description="Leave blank for unlimited trips on the Free plan."
        >
          <input
            type="number" min={0} step={1}
            value={form.free_trips_per_month}
            onChange={(e) => setForm((f) => ({ ...f, free_trips_per_month: e.target.value }))}
            placeholder="Unlimited"
            className={INPUT}
          />
        </SettingRow>

        <SettingRow
          label="Exports / month"
          description="Leave blank for unlimited exports on the Free plan."
        >
          <input
            type="number" min={0} step={1}
            value={form.free_exports_per_month}
            onChange={(e) => setForm((f) => ({ ...f, free_exports_per_month: e.target.value }))}
            placeholder="Unlimited"
            className={INPUT}
          />
        </SettingRow>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          ✓ Configuration saved. Changes are live across all workspaces.
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
        {config?.updated_at && (
          <p className="text-xs text-gray-400">Last saved: {fmt(config.updated_at)}</p>
        )}
      </div>
    </div>
  )
}
