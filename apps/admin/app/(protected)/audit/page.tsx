'use client'
/**
 * apps/admin/app/(protected)/audit/page.tsx
 */
import { useCallback, useEffect, useState } from 'react'

type AuditEntry = {
  id: string; org_id: string | null; actor_user_id: string | null
  entity_type: string; entity_id: string | null; action: string
  metadata: Record<string, unknown>; created_at: string
  profiles: { display_name: string | null; email: string | null } | null
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CREATE:  { bg: '#d1fae5', color: '#065f46' },
  UPDATE:  { bg: '#dbeafe', color: '#1e40af' },
  DELETE:  { bg: '#fee2e2', color: '#991b1b' },
  SUBMIT:  { bg: '#ede9fe', color: '#5b21b6' },
  APPROVE: { bg: '#d1fae5', color: '#065f46' },
  REJECT:  { bg: '#fee2e2', color: '#991b1b' },
  LOGIN:   { bg: '#f3f4f6', color: '#6b7280' },
}

function ActionBadge({ action }: { action: string }) {
  const verb = action.split('_')[0] ?? action
  const style = ACTION_COLORS[verb.toUpperCase()] ?? { bg: '#f3f4f6', color: '#6b7280' }
  return (
    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 7px', borderRadius: '4px', ...style, whiteSpace: 'nowrap' }}>
      {action}
    </span>
  )
}

export default function AuditLogPage() {
  const [entries, setEntries]   = useState<AuditEntry[]>([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [entityType, setEntity] = useState('')
  const [page, setPage]         = useState(1)
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const PAGE = 30

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), page_size: String(PAGE) })
      if (entityType) params.set('entity_type', entityType)
      const res  = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setEntries(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }, [page, entityType])

  useEffect(() => { void load() }, [load])

  const entityTypes = ['claim', 'claim_item', 'trip', 'export', 'member', 'rate_version', 'template', 'invitation']

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Audit Log</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>All platform actions. Click a row to see metadata.</p>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <select value={entityType} onChange={(e) => { setEntity(e.target.value); setPage(1) }} style={inp}>
          <option value="">All entity types</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Time', 'Actor', 'Action', 'Entity type', 'Entity ID', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No audit entries found.</td></tr>
            ) : entries.map((entry) => {
              const profile = entry.profiles as { display_name?: string | null; email?: string | null } | null
              return (
                <tr key={entry.id} onClick={() => setSelected(entry)} style={{ borderTop: '1px solid #f3f4f6', cursor: 'pointer' }}>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtDateTime(entry.created_at)}</td>
                  <td style={td}>
                    <div style={{ fontSize: '13px', color: '#374151' }}>{profile?.display_name ?? 'System'}</div>
                    {profile?.email && <div style={{ fontSize: '11px', color: '#9ca3af' }}>{profile.email}</div>}
                  </td>
                  <td style={td}><ActionBadge action={entry.action} /></td>
                  <td style={{ ...td, fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>{entry.entity_type}</td>
                  <td style={{ ...td, fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.entity_id ?? '—'}
                  </td>
                  <td style={{ ...td, fontSize: '12px', color: '#4f46e5' }}>Details →</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {total > PAGE && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#6b7280' }}>{(page - 1) * PAGE + 1}–{Math.min(page * PAGE, total)} of {total}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page <= 1} style={pbtn(page <= 1)}>← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * PAGE >= total} style={pbtn(page * PAGE >= total)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Metadata drawer */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setSelected(null)}>
          <div style={{ width: '440px', background: '#fff', height: '100%', overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#111827' }}>Audit detail</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <Detail label="Action" value={selected.action} />
              <Detail label="Entity type" value={selected.entity_type} />
              <Detail label="Entity ID" value={selected.entity_id ?? '—'} mono />
              <Detail label="Time" value={fmtDateTime(selected.created_at)} />
            </div>
            <div>
              <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Metadata</p>
              <pre style={{ margin: 0, padding: '12px', background: '#f9fafb', borderRadius: '6px', fontSize: '11px', color: '#374151', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(selected.metadata, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '13px', color: '#374151', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</p>
    </div>
  )
}

const td: React.CSSProperties  = { padding: '10px 14px', verticalAlign: 'middle' }
const inp: React.CSSProperties = { padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', fontFamily: 'inherit', background: '#fff' }
const pbtn = (d: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', background: d ? '#f9fafb' : '#fff', color: d ? '#d1d5db' : '#374151', fontSize: '13px', cursor: d ? 'not-allowed' : 'pointer' })
