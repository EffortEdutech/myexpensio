// apps/admin/app/(protected)/exports/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function ExportsPage() {
  const db = createServiceRoleClient()

  const { data: jobs } = await db
    .from('export_jobs')
    .select(`
      id, format, status, row_count, created_at, completed_at, error_message,
      profiles ( display_name, email ),
      organizations ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(300)

  const rows = jobs ?? []

  const statusColor: Record<string, string> = {
    DONE:    'bg-green-100 text-green-700',
    FAILED:  'bg-red-100 text-red-600',
    RUNNING: 'bg-blue-100 text-blue-700',
    PENDING: 'bg-amber-100 text-amber-700',
  }
  const formatColor: Record<string, string> = {
    PDF:  'bg-purple-100 text-purple-700',
    XLSX: 'bg-green-100 text-green-700',
    CSV:  'bg-gray-100 text-gray-600',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Export Jobs</h1>
        <p className="text-sm text-gray-500 mt-0.5">{rows.length} jobs across all organisations (latest 300)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Org</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Staff</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Format</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Rows</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(j => {
                const p   = Array.isArray(j.profiles)      ? j.profiles[0]      : j.profiles
                const org = Array.isArray(j.organizations) ? j.organizations[0] : j.organizations
                return (
                  <tr key={j.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {(org as {name?:string}|null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{(p as {display_name?:string|null}|null)?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{(p as {email?:string|null}|null)?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${formatColor[j.format] ?? 'bg-gray-100 text-gray-600'}`}>
                        {j.format}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor[j.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {j.status}
                        </span>
                        {j.error_message && (
                          <p className="text-xs text-red-500 mt-0.5 max-w-[200px] truncate">{j.error_message}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{j.row_count ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(j.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
