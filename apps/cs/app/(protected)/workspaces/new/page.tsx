'use client'
// apps/cs/app/(protected)/workspaces/new/page.tsx

import { useState } from 'react'
import Link from 'next/link'

type WorkspaceType = 'TEAM' | 'AGENT'
type Tier = 'FREE' | 'PRO'

type ProvisionResult = {
  org_id: string
  org_name: string
  workspace_type: WorkspaceType
  user_id: string
  user_existed: boolean
  status: 'PROVISIONED'
}

// ── Workspace type card ───────────────────────────────────────────────────────

function TypeCard({ type, selected, onClick }: { type: WorkspaceType; selected: boolean; onClick: () => void }) {
  const isTeam = type === 'TEAM'
  const accent = isTeam ? 'blue' : 'purple'
  const selectedBorder = isTeam ? 'border-blue-600 bg-blue-50' : 'border-purple-600 bg-purple-50'
  const iconBg = selected ? (isTeam ? 'bg-blue-100' : 'bg-purple-100') : 'bg-gray-100'
  const iconColor = selected ? (isTeam ? 'text-blue-700' : 'text-purple-700') : 'text-gray-500'
  const titleColor = selected ? (isTeam ? 'text-blue-700' : 'text-purple-700') : 'text-gray-900'
  const tagBg = selected ? (isTeam ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700') : 'bg-gray-100 text-gray-600'

  const features = isTeam
    ? ['Claims oversight', 'Team members', 'Export reports', 'Rate configuration']
    : ['Referral tracking', 'Commission dashboard', 'Individual subscriptions', 'Partner payouts']

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border-2 transition-all ${selected ? selectedBorder : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {isTeam ? (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ) : (
            <svg className={`w-5 h-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-semibold ${titleColor}`}>
              {isTeam ? 'Team Workspace' : 'Agent / Partner Workspace'}
            </span>
            {selected && (
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${tagBg}`}>Selected</span>
            )}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-3">
            {isTeam
              ? 'A company workspace. Employees submit claims to their manager. Finance exports team reports.'
              : 'A partner workspace. Agent recruits individual paying users. Earns commission per subscriber.'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {features.map((f) => (
              <span key={f} className={`text-xs px-2 py-0.5 rounded-full ${tagBg}`}>{f}</span>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Success view ──────────────────────────────────────────────────────────────

function SuccessView({ result, ownerEmail, onCreateAnother }: {
  result: ProvisionResult; ownerEmail: string; onCreateAnother: () => void
}) {
  const isTeam = result.workspace_type === 'TEAM'

  return (
    <div className="max-w-xl mx-auto">
      <Link href="/workspaces" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workspaces
      </Link>

      <div className="bg-white border border-green-200 rounded-2xl p-8 text-center mb-5">
        <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Workspace Created</h1>
        <p className="text-sm text-gray-500">
          {result.user_existed
            ? 'Existing user added as OWNER. Invite email resent.'
            : 'Invite email sent. Owner can log in after accepting the invite.'}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 mb-5">
        {[
          ['Organisation',   result.org_name],
          ['Type',           isTeam ? 'Team Workspace' : 'Agent / Partner Workspace'],
          ['Workspace ID',   result.org_id],
          ['Owner email',    ownerEmail],
          ['Owner status',   result.user_existed ? 'Existing user — invite resent' : 'New user — invite email sent'],
          ['Login portal',   'Expensio Workspace'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between items-start gap-4">
            <span className="text-xs font-medium text-gray-400 flex-shrink-0 w-28">{label}</span>
            <span className={`text-sm text-gray-900 text-right ${label === 'Workspace ID' ? 'font-mono text-xs bg-gray-50 px-2 py-0.5 rounded' : ''}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700 mb-5">
        Next step for the owner: Check email → click invite link → set password → log in to Expensio Workspace.
      </div>

      <div className="flex gap-3">
        <Link href="/workspaces"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-gray-50 text-center">
          View Workspaces
        </Link>
        <button onClick={onCreateAnother}
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Create Another
        </button>
      </div>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

const INPUT = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CreateWorkspacePage() {
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('TEAM')
  const [name, setName]                   = useState('')
  const [ownerEmail, setOwnerEmail]       = useState('')
  const [ownerName, setOwnerName]         = useState('')
  const [contactEmail, setContactEmail]   = useState('')
  const [contactPhone, setContactPhone]   = useState('')
  const [address, setAddress]             = useState('')
  const [notes, setNotes]                 = useState('')
  const [initialTier, setInitialTier]     = useState<Tier>('FREE')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [result, setResult]               = useState<ProvisionResult | null>(null)

  function handleReset() {
    setName(''); setOwnerEmail(''); setOwnerName('')
    setContactEmail(''); setContactPhone(''); setAddress(''); setNotes('')
    setInitialTier('FREE'); setWorkspaceType('TEAM')
    setResult(null); setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/console/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_type:      workspaceType,
          name:                name.trim(),
          owner_email:         ownerEmail.trim(),
          owner_display_name:  ownerName.trim(),
          contact_email:       contactEmail.trim() || undefined,
          contact_phone:       contactPhone.trim() || undefined,
          address:             address.trim() || undefined,
          notes:               notes.trim() || undefined,
          initial_tier:        initialTier,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed to create workspace')
      setResult(json as ProvisionResult)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-5">
        <SuccessView result={result} ownerEmail={ownerEmail} onCreateAnother={handleReset} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Link href="/workspaces" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Workspaces
      </Link>

      <div className="mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Create Workspace</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Provision a new workspace and send an invite to the workspace owner.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1: Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Workspace Type</h2>
          <div className="space-y-3">
            <TypeCard type="TEAM"  selected={workspaceType === 'TEAM'}  onClick={() => setWorkspaceType('TEAM')} />
            <TypeCard type="AGENT" selected={workspaceType === 'AGENT'} onClick={() => setWorkspaceType('AGENT')} />
          </div>
        </div>

        {/* Section 2: Organisation */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">Organisation Details</h2>

          <Field label="Organisation name" required>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder={workspaceType === 'TEAM' ? 'e.g. ACME Sdn Bhd' : 'e.g. Ahmad Partners'}
              required className={INPUT} />
          </Field>

          <Field label="Billing contact email" hint="Defaults to owner email if left blank.">
            <input type="email" value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="billing@company.com" className={INPUT} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contact phone">
              <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+60 12-345 6789" className={INPUT} />
            </Field>
            <div />
          </div>

          <Field label="Address">
            <textarea value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Office address (optional)" rows={2}
              className={`${INPUT} resize-none`} />
          </Field>

          <Field label="Internal notes" hint="Console-only. Not visible in Workspace App.">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Referred by Ahmad, trial extended…" rows={2}
              className={`${INPUT} resize-none`} />
          </Field>
        </div>

        {/* Section 3: Owner */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Workspace Owner</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              This person receives the invite email and has full OWNER access to the workspace.
            </p>
          </div>

          <Field label="Owner email" required>
            <input type="email" value={ownerEmail}
              onChange={(e) => {
                setOwnerEmail(e.target.value)
                if (!contactEmail) setContactEmail(e.target.value)
              }}
              placeholder="owner@company.com" required className={INPUT} />
          </Field>

          <Field label="Owner full name" required>
            <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
              placeholder="Ahmad bin Ali" required className={INPUT} />
          </Field>

          {ownerEmail && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              An invite email will be sent to <strong>{ownerEmail}</strong>. They click the link → set password → log in to Expensio Workspace.
            </div>
          )}
        </div>

        {/* Section 4: Plan */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Initial Plan</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['FREE', 'PRO'] as Tier[]).map((tier) => (
              <button key={tier} type="button" onClick={() => setInitialTier(tier)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  initialTier === tier ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`text-sm font-semibold mb-1 ${initialTier === tier ? 'text-blue-700' : 'text-gray-900'}`}>
                  {tier}
                </div>
                <div className="text-xs text-gray-500">
                  {tier === 'FREE' ? '2 route calculations/month (Phase 1 default)' : 'Unlimited route calculations'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Summary + Submit */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Summary</h2>
          <div className="space-y-2 mb-5">
            {[
              { label: 'Type',   value: workspaceType === 'TEAM' ? 'Team Workspace' : 'Agent / Partner Workspace' },
              { label: 'Name',   value: name || '—' },
              { label: 'Owner',  value: ownerEmail || '—' },
              { label: 'Plan',   value: initialTier },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{label}</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/workspaces"
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 font-medium hover:bg-white text-center">
              Cancel
            </Link>
            <button type="submit"
              disabled={loading || !name.trim() || !ownerEmail.trim() || !ownerName.trim()}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating workspace…' : 'Create Workspace'}
            </button>
          </div>
        </div>

      </form>
    </div>
  )
}
