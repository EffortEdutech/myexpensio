'use client'
// apps/cs/components/WorkspaceEditDrawer.tsx
// Full workspace editing: name, contact details, status, subscription tier override.
// Console staff only. SUPER_ADMIN can do everything. SUPPORT can view + change status.

import { useState } from 'react'

type WorkspaceType = 'TEAM' | 'AGENT' | 'INTERNAL'

type Subscription = {
  tier: 'FREE' | 'PRO'
  billing_status: string
  period_end: string | null
}

export type EditableWorkspace = {
  id: string
  name: string
  workspace_type: WorkspaceType
  status: string
  contact_email: string | null
  contact_phone: string | null
  address: string | null
  notes: string | null
  subscription_status: Subscription | null
}

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
const LABEL = 'block text-xs font-medium text-gray-500 mb-1'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export default function WorkspaceEditDrawer({
  workspace,
  isSuperAdmin,
  onClose,
  onSaved,
}: {
  workspace: EditableWorkspace
  isSuperAdmin: boolean
  onClose: () => void
  onSaved: () => void
}) {
  // Editable fields
  const [name, setName]                 = useState(workspace.name)
  const [contactEmail, setContactEmail] = useState(workspace.contact_email ?? '')
  const [contactPhone, setContactPhone] = useState(workspace.contact_phone ?? '')
  const [address, setAddress]           = useState(workspace.address ?? '')
  const [notes, setNotes]               = useState(workspace.notes ?? '')
  const [status, setStatus]             = useState(workspace.status)
  const [tier, setTier]                 = useState(workspace.subscription_status?.tier ?? 'FREE')
  const [billingStatus, setBillingStatus] = useState(workspace.subscription_status?.billing_status ?? 'INACTIVE')
  const [periodEnd, setPeriodEnd]         = useState(workspace.subscription_status?.period_end?.slice(0, 10) ?? '')

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState(false)

  async function handleSave() {
    if (!name.trim()) { setError('Organisation name is required'); return }
    setLoading(true); setError(null)

    try {
      // Update org details
      const orgRes = await fetch(`/api/console/workspaces/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          name.trim(),
          contact_email: contactEmail.trim() || null,
          contact_phone: contactPhone.trim() || null,
          address:       address.trim() || null,
          notes:         notes.trim() || null,
          status,
        }),
      })

      if (!orgRes.ok) {
        const j = await orgRes.json()
        throw new Error(j.error?.message ?? 'Failed to save workspace details')
      }

      // Update subscription if changed
      const tierChanged   = tier !== workspace.subscription_status?.tier
      const statusChanged = billingStatus !== workspace.subscription_status?.billing_status
      const endChanged    = periodEnd !== (workspace.subscription_status?.period_end?.slice(0, 10) ?? '')

      if (tierChanged || statusChanged || endChanged) {
        const subRes = await fetch('/api/console/subscriptions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            org_id:         workspace.id,
            tier,
            billing_status: billingStatus,
            period_end:     periodEnd || undefined,
            note:           'Updated via Console workspace editor',
          }),
        })
        if (!subRes.ok) {
          const j = await subRes.json()
          throw new Error(j.error?.message ?? 'Failed to save subscription')
        }
      }

      setSuccess(true)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error saving changes')
    } finally {
      setLoading(false)
    }
  }

  const typeBadgeCls: Record<string, string> = {
    TEAM:     'bg-blue-50 text-blue-700',
    AGENT:    'bg-purple-50 text-purple-700',
    INTERNAL: 'bg-amber-50 text-amber-700',
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-gray-200 shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">Edit Workspace</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${typeBadgeCls[workspace.workspace_type] ?? 'bg-gray-100 text-gray-500'}`}>
                {workspace.workspace_type}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">{workspace.id.slice(0, 8)}…</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          <Section title="Organisation">
            <div>
              <label className={LABEL}>Organisation name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="ACME Sdn Bhd" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Contact email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                placeholder="billing@company.com" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Contact phone</label>
              <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+60 12-345 6789" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Office address…" rows={2}
                className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className={LABEL}>Internal notes (Console-only)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes not visible to workspace users…" rows={2}
                className={`${INPUT} resize-none`} />
            </div>
          </Section>

          <Section title="Status">
            <div>
              <label className={LABEL}>Workspace status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={INPUT}>
                <option value="ACTIVE">Active — workspace is fully operational</option>
                <option value="INACTIVE">Inactive — workspace is paused</option>
                <option value="SUSPENDED">Suspended — users blocked from logging in</option>
              </select>
              {status === 'SUSPENDED' && workspace.status !== 'SUSPENDED' && (
                <p className="mt-1.5 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                  This will immediately block all workspace users from logging in.
                </p>
              )}
            </div>
          </Section>

          <Section title="Subscription">
            <div>
              <label className={LABEL}>Plan tier</label>
              <select value={tier} onChange={(e) => setTier(e.target.value as 'FREE' | 'PRO')} className={INPUT}>
                <option value="FREE">Free — 2 route calculations/month</option>
                <option value="PRO">Pro — unlimited route calculations</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Billing status</label>
              <select value={billingStatus} onChange={(e) => setBillingStatus(e.target.value)} className={INPUT}>
                {['INACTIVE','TRIALING','ACTIVE','PAST_DUE','UNPAID','CANCELED','EXPIRED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Period end date</label>
              <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={INPUT} />
            </div>
          </Section>

          {!isSuperAdmin && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 -mt-2 mb-4">
              You are logged in as Support. Status changes require SUPER_ADMIN for subscription overrides.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
          {error && (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✓ Workspace updated successfully
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave} disabled={loading || !name.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
