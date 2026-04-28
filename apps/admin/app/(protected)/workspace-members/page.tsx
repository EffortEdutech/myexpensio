'use client'
// apps/admin/app/(protected)/workspace-members/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { useWorkspaceMe } from '@/lib/use-workspace-me'
import InternalOrgPicker from '@/components/InternalOrgPicker'

type Profile = {
  id: string; email: string | null; display_name: string | null; department: string | null
}

type Member = {
  org_id: string; user_id: string; org_role: string
  status: 'ACTIVE' | 'REMOVED'; created_at: string; profiles: Profile | null
}

function fmtDate(val: string) {
  return new Date(val).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(profile: Profile | null) {
  return (profile?.display_name ?? profile?.email ?? '?').slice(0, 2).toUpperCase()
}

const ROLE_CLS: Record<string, string> = {
  OWNER: 'bg-purple-50 text-purple-700', ADMIN: 'bg-blue-50 text-blue-700',
  MANAGER: 'bg-blue-50 text-blue-600', EMPLOYEE: 'bg-gray-100 text-gray-600',
  SALES: 'bg-green-50 text-green-700', FINANCE: 'bg-amber-50 text-amber-700',
  MEMBER: 'bg-gray-100 text-gray-500',
}

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af' }, { bg: '#dcfce7', text: '#166534' },
  { bg: '#f3e8ff', text: '#6b21a8' }, { bg: '#fef3c7', text: '#92400e' },
  { bg: '#fee2e2', text: '#991b1b' },
]

function MembersList({ orgId, orgName, onChangeWorkspace }: {
  orgId: string; orgName: string | null; onChangeWorkspace?: () => void
}) {
  const [members, setMembers]   = useState<Member[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [showRemoved, setShowRemoved] = useState(false)

  const fetchMembers = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/workspace/members?org_id=${orgId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error?.message ?? 'Failed to load members')
      setMembers(json.members ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally { setLoading(false) }
  }, [orgId])

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const activeMembers  = members.filter(m => m.status === 'ACTIVE')
  const removedMembers = members.filter(m => m.status === 'REMOVED')
  const displayed      = showRemoved ? members : activeMembers

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {orgName ?? 'Workspace'} — {activeMembers.length} active member{activeMembers.length !== 1 ? 's' : ''}
            {onChangeWorkspace && (
              <button onClick={onChangeWorkspace} className="ml-2 text-blue-600 hover:text-blue-800 text-xs font-medium underline">
                Change workspace
              </button>
            )}
          </p>
        </div>
        {removedMembers.length > 0 && (
          <button onClick={() => setShowRemoved(v => !v)} className="text-xs text-gray-500 hover:text-gray-700 flex-shrink-0">
            {showRemoved ? 'Hide removed' : `Show ${removedMembers.length} removed`}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52 text-sm text-gray-400">Loading members…</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-2 bg-white rounded-xl border border-gray-200">
          <svg className="w-10 h-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-400">No members yet</p>
          <p className="text-xs text-gray-400">Use Members &amp; Onboarding in Console to add members</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Member', 'Role', 'Department', 'Status', 'Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((m, i) => {
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length]
                const isRemoved = m.status === 'REMOVED'
                return (
                  <tr key={m.user_id} className={`border-b border-gray-50 ${isRemoved ? 'opacity-40' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                          style={{ background: color.bg, color: color.text }}>
                          {initials(m.profiles)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{m.profiles?.display_name ?? '—'}</div>
                          <div className="text-xs text-gray-400">{m.profiles?.email ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_CLS[m.org_role] ?? 'bg-gray-100 text-gray-500'}`}>
                        {m.org_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{m.profiles?.department ?? '—'}</td>
                    <td className="px-4 py-3">
                      {isRemoved ? (
                        <span className="text-xs text-gray-400 italic">Removed</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(m.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function WorkspaceMembersPage() {
  const { me, loading } = useWorkspaceMe()
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null)
  const [showPicker, setShowPicker]   = useState(false)

  // Once me is loaded, decide whether to show picker or go straight to data
  useEffect(() => {
    if (!me) return
    if (me.isInternalStaff) {
      setShowPicker(true)
    }
    // For workspace users, orgId is already in me.orgId — pre-fill selectedOrg
    if (!me.isInternalStaff && me.orgId && me.orgName) {
      setSelectedOrg({ id: me.orgId, name: me.orgName })
    }
  }, [me])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>
  )

  if (showPicker) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500 mt-0.5">Select a workspace to view its members</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 py-8">
          <InternalOrgPicker label="members" onSelect={(id, name) => { setSelectedOrg({ id, name }); setShowPicker(false) }} />
        </div>
      </div>
    )
  }

  if (!selectedOrg) return (
    <div className="flex items-center justify-center h-64 text-sm text-gray-400">Loading…</div>
  )

  return (
    <MembersList
      orgId={selectedOrg.id}
      orgName={selectedOrg.name}
      onChangeWorkspace={me?.isInternalStaff ? () => setShowPicker(true) : undefined}
    />
  )
}
