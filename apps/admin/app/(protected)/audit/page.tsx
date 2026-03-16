// apps/admin/app/(protected)/audit/page.tsx
import React from 'react'
import { createServiceRoleClient } from '@/lib/supabase/server'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
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

  // Count unresolved storage orphans so we can show a banner
  const orphanLogs = rows.filter(r => r.action === 'TNG_STORAGE_ORPHAN')

  const actionColor: Record<string, string> = {
    TEMPLATE_CREATED:     'bg-blue-100 text-blue-700',
    TEMPLATE_UPDATED:     'bg-blue-50 text-blue-600',
    TEMPLATE_DEACTIVATED: 'bg-gray-100 text-gray-600',
    ORG_STATUS_CHANGED:   'bg-amber-100 text-amber-700',
    ORG_UPDATED:          'bg-amber-50 text-amber-600',
    ORG_CREATED:          'bg-green-100 text-green-700',
    ORG_TIER_CHANGED:     'bg-purple-100 text-purple-700',
    INVITE_SENT:          'bg-purple-100 text-purple-700',
    INVITE_ACCEPTED:      'bg-green-100 text-green-700',
    INVITE_REVOKED:       'bg-red-100 text-red-600',
    MEMBER_ROLE_CHANGED:  'bg-blue-100 text-blue-700',
    MEMBER_REMOVED:       'bg-red-100 text-red-600',
    RATE_CREATED:         'bg-green-100 text-green-700',
    // Storage orphan — prominent red alert
    TNG_STORAGE_ORPHAN:   'bg-red-100 text-red-700 font-bold',
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Audit Log</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          All admin and system actions — {rows.length} entries (latest 500)
        </p>
      </div>

      {/* ── Orphan alert banner ─────────────────────────────────────────────── */}
      {orphanLogs.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <div className="text-sm font-bold text-red-800 mb-1">
                {orphanLogs.length} orphaned TNG statement file{orphanLogs.length !== 1 ? 's' : ''} — manual cleanup required
              </div>
              <p className="text-xs text-red-700 mb-3">
                These PDF files were not deleted from the <code className="bg-red-100 px-1 rounded">tng-statements</code> bucket
                when the statement batch was removed. Please delete them manually in
                Supabase Storage → tng-statements.
              </p>
              {orphanLogs.map(log => {
                const meta = log.metadata as Record<string, unknown>
                const paths = (meta?.orphaned_paths as string[]) ?? []
                return (
                  <div key={log.id} className="mb-2 rounded-lg bg-white border border-red-200 p-3">
                    <div className="text-xs text-red-500 mb-1">{fmtDate(log.created_at)}</div>
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      Bucket: <code className="bg-gray-100 px-1 rounded">tng-statements</code>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">Files to delete:</div>
                    {paths.map(p => (
                      <code key={p} className="block text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 mb-1 font-mono text-gray-800">
                        {p}
                      </code>
                    ))}
                    {meta?.storage_error && (
                      <div className="text-xs text-red-500 mt-1">
                        Error: {String(meta.storage_error)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main table ──────────────────────────────────────────────────────── */}
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
                const isOrphan = log.action === 'TNG_STORAGE_ORPHAN'
                const meta     = log.metadata as Record<string, unknown>
                const paths    = isOrphan ? ((meta?.orphaned_paths as string[]) ?? []) : []

                return (
                  <React.Fragment key={log.id}>
                    <tr className={isOrphan ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                      <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {fmtDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700 text-xs font-medium">
                          {(p as { display_name?: string | null } | null)?.display_name ?? '—'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {(p as { email?: string | null } | null)?.email ?? ''}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${actionColor[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                          {isOrphan ? '⚠️ STORAGE ORPHAN' : log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 font-medium">{log.entity_type}</div>
                        <div className="text-xs text-gray-400 font-mono">
                          {log.entity_id?.slice(0, 8)}…
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {(org as { name?: string } | null)?.name ?? '—'}
                      </td>
                    </tr>

                    {/* Detail row for storage orphans — shows paths inline */}
                    {isOrphan && paths.length > 0 && (
                      <tr className="bg-red-50">
                        <td colSpan={5} className="px-5 pb-3 pt-0">
                          <div className="rounded-lg border border-red-200 bg-white p-3">
                            <div className="text-xs font-semibold text-red-700 mb-2">
                              🗑 Files to manually delete from{' '}
                              <code className="bg-red-50 px-1 rounded">tng-statements</code> bucket:
                            </div>
                            {paths.map(p => (
                              <code key={p} className="block text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 mb-1 font-mono text-gray-700">
                                {p}
                              </code>
                            ))}
                            {meta?.storage_error && (
                              <div className="text-xs text-red-500 mt-2">
                                Storage error: {String(meta.storage_error)}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-2">
                              Supabase Dashboard → Storage → tng-statements → navigate to path → delete file
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
