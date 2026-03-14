// apps/admin/app/(protected)/audit/page.tsx
import { createServiceRoleClient } from '@/lib/supabase/server'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function AuditPage() {
  const db = createServiceRoleClient()

  const { data: logs } = await db
    .from('audit_logs')
    .select(`
      id, entity_type, entity_id, action, metadata, created_at,
      profiles ( display_name, email ),
      organizations ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  const rows = logs ?? []

  const actionColor: Record<string, string> = {
    TEMPLATE_CREATED:   'bg-blue-100 text-blue-700',
    TEMPLATE_UPDATED:   'bg-blue-50 text-blue-600',
    TEMPLATE_DEACTIVATED: 'bg-gray-100 text-gray-600',
    ORG_STATUS_CHANGED: 'bg-amber-100 text-amber-700',
    ORG_UPDATED:        'bg-amber-50 text-amber-600',
    INVITE_SENT:        'bg-purple-100 text-purple-700',
    INVITE_ACCEPTED:    'bg-green-100 text-green-700',
    INVITE_REVOKED:     'bg-red-100 text-red-600',
    MEMBER_ROLE_CHANGED:'bg-blue-100 text-blue-700',
    MEMBER_REMOVED:     'bg-red-100 text-red-600',
    RATE_CREATED:       'bg-green-100 text-green-700',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">All admin and system actions — {rows.length} entries (latest 500)</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">When</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Org</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map(log => {
                const p   = Array.isArray(log.profiles)      ? log.profiles[0]      : log.profiles
                const org = Array.isArray(log.organizations) ? log.organizations[0] : log.organizations
                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 text-xs font-medium">{(p as {display_name?:string|null}|null)?.display_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{(p as {email?:string|null}|null)?.email ?? ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-600 font-medium">{log.entity_type}</div>
                      <div className="text-xs text-gray-400 font-mono">{log.entity_id?.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {(org as {name?:string}|null)?.name ?? '—'}
                    </td>
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
