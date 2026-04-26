'use client'
// apps/cs/components/AgentReferralsDrawer.tsx
//
// Shows individual SUBSCRIBERS (org_role = EMPLOYEE) of an Agent workspace
// plus the referral funnel status.
//
// Two sections:
// 1. Referral Funnel — INVITED / SIGNED_UP / SUBSCRIBED / CHURNED counts
// 2. Subscribers list — all EMPLOYEE members with their referral status
// 3. Add subscriber — Console can manually add an individual user

import { useEffect, useState, useCallback } from 'react'

type Member = {
  org_id: string
  user_id: string
  org_role: string
  status: string
  created_at: string
  profiles: {
    id: string
    email: string | null
    display_name: string | null
    role: string
  } | null
}

type Referral = {
  id: string
  customer_email: string
  customer_name: string | null
  status: 'INVITED' | 'SIGNED_UP' | 'SUBSCRIBED' | 'CHURNED'
  signed_up_at: string | null
  subscribed_at: string | null
  created_at: string
}

const REFERRAL_STATUS_CFG: Record<string, { label: string; dotCls: string; textCls: string }> = {
  INVITED:    { label: 'Invited',    dotCls: 'bg-gray-300',   textCls: 'text-gray-500' },
  SIGNED_UP:  { label: 'Signed Up',  dotCls: 'bg-blue-500',   textCls: 'text-blue-700' },
  SUBSCRIBED: { label: 'Subscribed', dotCls: 'bg-green-500',  textCls: 'text-green-700' },
  CHURNED:    { label: 'Churned',    dotCls: 'bg-red-400',    textCls: 'text-red-600' },
}

function fmt(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(str: string | null) {
  return (str ?? '?').slice(0, 2).toUpperCase()
}

// ── Funnel card ────────────────────────────────────────────────────────────────

function FunnelCard({ referrals }: { referrals: Referral[] }) {
  const counts = {
    INVITED:    referrals.filter((r) => r.status === 'INVITED').length,
    SIGNED_UP:  referrals.filter((r) => r.status === 'SIGNED_UP').length,
    SUBSCRIBED: referrals.filter((r) => r.status === 'SUBSCRIBED').length,
    CHURNED:    referrals.filter((r) => r.status === 'CHURNED').length,
  }
  const total = referrals.length
  const convRate = total > 0 ? Math.round((counts.SUBSCRIBED / total) * 100) : 0

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referral Funnel</p>
        {total > 0 && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            {convRate}% conversion
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(['INVITED','SIGNED_UP','SUBSCRIBED','CHURNED'] as const).map((status) => {
          const cfg = REFERRAL_STATUS_CFG[status]
          return (
            <div key={status} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <span className={`w-2 h-2 rounded-full ${cfg.dotCls}`} />
              </div>
              <div className={`text-lg font-bold tabular-nums ${cfg.textCls}`}>
                {counts[status]}
              </div>
              <div className="text-xs text-gray-400 leading-tight">{cfg.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Add subscriber form ────────────────────────────────────────────────────────

function AddSubscriberForm({ orgId, onAdded }: { orgId: string; onAdded: () => void }) {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleAdd() {
    if (!email.trim()) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const res = await fetch(`/api/console/workspaces/${orgId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        email.trim(),
          org_role:     'EMPLOYEE',  // Individual subscriber always = EMPLOYEE
          display_name: name.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error?.message ?? 'Failed')
      setSuccess(json.message)
      setEmail(''); setName('')
      onAdded()
      setTimeout(() => setSuccess(null), 5000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border-t border-gray-100 pt-4 mt-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Add Individual Subscriber
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700 mb-3">
        <strong>Who goes here:</strong> Individual professionals recruited by this Agent. They will log into MyExpensio and submit their own claims to their own external employer. Their subscription generates commission for the Agent.
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email address *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="subscriber@company.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full name (optional)</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Ahmad bin Ali"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && (
          <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}
        {success && (
          <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">✓ {success}</div>
        )}

        <button onClick={handleAdd} disabled={loading || !email.trim()}
          className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
          {loading ? 'Adding…' : 'Add Subscriber'}
        </button>
      </div>
    </div>
  )
}

// ── Main drawer ────────────────────────────────────────────────────────────────

export default function AgentReferralsDrawer({
  orgId,
  orgName,
  onClose,
}: {
  orgId: string
  orgName: string
  onClose: () => void
}) {
  const [members, setMembers]     = useState<Member[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'subscribers' | 'referrals'>('subscribers')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [membersRes, referralsRes] = await Promise.all([
        fetch(`/api/console/workspaces/${orgId}/members`),
        fetch(`/api/console/referrals?org_id=${orgId}`),
      ])

      const membersJson = membersRes.ok ? await membersRes.json() : { members: [] }
      const referralsJson = referralsRes.ok ? await referralsRes.json() : { referrals: [] }

      setMembers(membersJson.members ?? [])
      setReferrals(referralsJson.referrals ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [orgId])

  useEffect(() => { fetchData() }, [fetchData])

  // Split: agency staff vs individual subscribers
  const agencyStaff   = members.filter((m) => m.status === 'ACTIVE' && m.org_role !== 'EMPLOYEE')
  const subscribers   = members.filter((m) => m.status === 'ACTIVE' && m.org_role === 'EMPLOYEE')

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white border-l border-gray-200 shadow-xl flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">{orgName}</h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700">AGENT</span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''} · {agencyStaff.length} agency staff
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {[
            { key: 'subscribers' as const, label: `Subscribers (${subscribers.length})` },
            { key: 'referrals' as const, label: `Referrals (${referrals.length})` },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2.5 text-xs font-medium transition-colors ${
                tab === t.key
                  ? 'border-b-2 border-purple-600 text-purple-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading…</div>
          ) : tab === 'subscribers' ? (

            // ── Subscribers tab ──────────────────────────────────────────────
            <>
              {/* Agency staff section */}
              {agencyStaff.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Agency Staff</p>
                  <div className="bg-gray-50 rounded-lg border border-gray-100 divide-y divide-gray-100">
                    {agencyStaff.map((m) => (
                      <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-purple-100 text-purple-700 flex-shrink-0">
                          {initials(m.profiles?.display_name ?? m.profiles?.email ?? null)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {m.profiles?.display_name ?? m.profiles?.email ?? '—'}
                          </div>
                          {m.profiles?.display_name && (
                            <div className="text-xs text-gray-400 truncate">{m.profiles.email}</div>
                          )}
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 flex-shrink-0">
                          {m.org_role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual subscribers */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Individual Subscribers (EMPLOYEE)
              </p>

              {subscribers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-24 text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                  <p>No subscribers yet</p>
                  <p className="text-xs mt-1">Use "Add Subscriber" below</p>
                </div>
              ) : (
                <div className="space-y-0 border border-gray-100 rounded-lg divide-y divide-gray-50 overflow-hidden">
                  {subscribers.map((m) => (
                    <div key={m.user_id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 flex-shrink-0">
                        {initials(m.profiles?.display_name ?? m.profiles?.email ?? null)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {m.profiles?.display_name ?? m.profiles?.email ?? '—'}
                        </div>
                        {m.profiles?.display_name && (
                          <div className="text-xs text-gray-400 truncate">{m.profiles.email}</div>
                        )}
                        <div className="text-xs text-gray-400">Added {fmt(m.created_at)}</div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">Subscriber</span>
                    </div>
                  ))}
                </div>
              )}

              <AddSubscriberForm orgId={orgId} onAdded={fetchData} />
            </>

          ) : (

            // ── Referrals tab ────────────────────────────────────────────────
            <>
              <FunnelCard referrals={referrals} />

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Referral History</p>

              {referrals.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-sm text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                  No referrals recorded
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r) => {
                    const cfg = REFERRAL_STATUS_CFG[r.status]
                    return (
                      <div key={r.id} className="border border-gray-100 rounded-lg px-3 py-2.5 hover:bg-gray-50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {r.customer_name ?? r.customer_email}
                            </div>
                            {r.customer_name && (
                              <div className="text-xs text-gray-400 truncate">{r.customer_email}</div>
                            )}
                            <div className="text-xs text-gray-400 mt-0.5">
                              Invited {fmt(r.created_at)}
                              {r.subscribed_at && ` · Subscribed ${fmt(r.subscribed_at)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className={`w-2 h-2 rounded-full ${cfg.dotCls}`} />
                            <span className={`text-xs font-medium ${cfg.textCls}`}>{cfg.label}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
