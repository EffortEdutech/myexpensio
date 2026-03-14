// apps/admin/app/(protected)/claims/page.tsx
// All claims across all organisations.

import { createServiceRoleClient } from '@/lib/supabase/server'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ClaimsPage() {
  const db = createServiceRoleClient()

  const { data: claims, error } = await db
    .from('claims')
    .select(`
      id, status, title, total_amount, currency,
      period_start, period_end, submitted_at, created_at,
      profiles ( display_name, email ),
      organizations ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    return <div><h1 className="text-xl font-bold text-gray-900 mb-2">Claims</h1>
      <p className="text-sm text-red-600">Failed to load: {error.message}</p></div>
  }

  const rows = claims ?? []
  const submitted = rows.filter(c => c.status === 'SUBMITTED').length
  const draft     = rows.filter(c => c.status === 'DRAFT').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Claims</h1>
        <p className="text-sm text-gray-500 mt-0.5">{submitted} submitted · {draft} draft — all organisations</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Claim</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(c => {
                const p   = Array.isArray(c.profiles)      ? c.profiles[0]      : c.profiles
                const org = Array.isArray(c.organizations) ? c.organizations[0] : c.organizations
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">{(org as {name?:string}|null)?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{(p as {display_name?:string|null}|null)?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{(p as {email?:string|null}|null)?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{c.title ?? <span className="italic text-gray-400">Untitled</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.status === 'SUBMITTED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      MYR {Number(c.total_amount).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {fmtDate(c.period_start)}{c.period_end ? ` – ${fmtDate(c.period_end)}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(c.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {rows.length} claims (max 500)
        </div>
      </div>
    </div>
  )
}
