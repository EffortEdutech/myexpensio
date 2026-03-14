// apps/admin/app/(protected)/settings/SettingsClient.tsx
//
// Client component for the admin Settings page.
// Receives org + subscription data from the server component (page.tsx).
//
// Sections:
//   1. Organisation — name (editable by OWNER only)
//   2. Subscription — tier + period (read-only; upgrade handled externally)
//   3. Danger zone — reserved for future (account deletion, data export request)

'use client'

import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type OrgRow = {
  id:         string
  name:       string
  status:     string | null
  created_at: string
} | null

type SubscriptionRow = {
  tier:         string
  period_start: string | null
  period_end:   string | null
  updated_at:   string
} | null

type Props = {
  org:          OrgRow
  subscription: SubscriptionRow
  isOwner:      boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  })
}

function TierBadge({ tier }: { tier: string }) {
  const isPro = tier === 'PRO'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
      {isPro ? '✦ Pro' : 'Free'}
    </span>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SettingsClient({ org, subscription, isOwner }: Props) {
  const [orgName,   setOrgName]   = useState(org?.name ?? '')
  const [saving,    setSaving]    = useState(false)
  const [saveErr,   setSaveErr]   = useState<string | null>(null)
  const [saveOk,    setSaveOk]    = useState(false)

  async function handleSaveOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim()) { setSaveErr('Organisation name cannot be empty.'); return }
    setSaving(true); setSaveErr(null); setSaveOk(false)

    try {
      const res  = await fetch('/api/admin/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: orgName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to save.')
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 3000)
    } catch (err: unknown) {
      setSaveErr(err instanceof Error ? err.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your organisation and subscription.</p>
      </div>

      {/* ── Organisation ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Organisation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isOwner ? 'Update your organisation details.' : 'View your organisation details. Only Owners can edit.'}
          </p>
        </div>

        <form onSubmit={handleSaveOrg} className="px-5 py-5 space-y-4">

          {/* Org ID (read-only) */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Organisation ID</label>
            <p className="text-xs font-mono text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              {org?.id ?? '—'}
            </p>
          </div>

          {/* Org name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisation Name {isOwner && <span className="text-red-500">*</span>}
            </label>
            {isOwner ? (
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. EffortEdutech Sdn Bhd"
              />
            ) : (
              <p className="text-sm text-gray-900 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                {org?.name ?? '—'}
              </p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
              ${org?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {org?.status ?? 'ACTIVE'}
            </span>
          </div>

          {/* Created at */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
            <p className="text-sm text-gray-600">{fmtDate(org?.created_at)}</p>
          </div>

          {/* Error / success feedback */}
          {saveErr && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {saveErr}
            </div>
          )}
          {saveOk && (
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
              ✓ Organisation name updated.
            </div>
          )}

          {isOwner && (
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                           rounded-lg disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── Subscription ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Subscription</h2>
          <p className="text-xs text-gray-500 mt-0.5">Your current plan and billing period.</p>
        </div>

        <div className="px-5 py-5 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Current Plan</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {subscription?.tier === 'PRO'
                  ? 'Unlimited route calculations, exports, and trips.'
                  : 'Free tier — 2 route calculations per month.'}
              </p>
            </div>
            <TierBadge tier={subscription?.tier ?? 'FREE'} />
          </div>

          {subscription?.period_start && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
              <div>
                <p className="text-xs font-medium text-gray-500">Period Start</p>
                <p className="text-sm text-gray-700 mt-0.5">{fmtDate(subscription.period_start)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Period End</p>
                <p className="text-sm text-gray-700 mt-0.5">{fmtDate(subscription.period_end)}</p>
              </div>
            </div>
          )}

          {subscription?.tier !== 'PRO' && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-lg">✦</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-purple-800">Upgrade to Pro</p>
                  <p className="text-xs text-purple-600 mt-0.5">
                    Unlimited route calculations, exports, and trips for your whole team.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Contact your administrator or support to upgrade your plan.
              </p>
            </div>
          )}

          {subscription?.updated_at && (
            <p className="text-xs text-gray-400">
              Last updated: {fmtDate(subscription.updated_at)}
            </p>
          )}
        </div>
      </div>

      {/* ── Account info (non-editable in Phase 1) ───────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Data & Account</h2>
          <p className="text-xs text-gray-500 mt-0.5">Data retention and account management.</p>
        </div>
        <div className="px-5 py-5">
          <p className="text-sm text-gray-500">
            Data management and account deletion options will be available in a future release.
            Contact support for urgent data requests.
          </p>
        </div>
      </div>

    </div>
  )
}
