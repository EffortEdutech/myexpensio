'use client'
/**
 * apps/admin/app/(protected)/billing/plans/page.tsx
 */
import { useEffect, useState } from 'react'
import StatusChip from '@/components/billing/StatusChip'

type Plan = {
  id: string; code: string; name: string; tier: string
  interval: string | null; is_active: boolean; sort_order: number
  description: string | null; entitlements: Record<string, unknown> | null
  updated_at: string
}

function fmtEntitlements(e: Record<string, unknown> | null) {
  if (!e) return '—'
  const parts: string[] = []
  if (e.routeCalculationsPerMonth != null)
    parts.push(e.routeCalculationsPerMonth === null ? 'Unlimited routes' : `${e.routeCalculationsPerMonth} routes/mo`)
  return parts.join(' · ') || '—'
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/billing/plans?page_size=50')
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message ?? 'Failed')
      setPlans(data.items ?? [])
    } catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [])

  async function toggle(plan: Plan) {
    setToggling(plan.id)
    try {
      const res = await fetch('/api/admin/billing/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
      })
      if (!res.ok) throw new Error('Failed')
      void load()
    } catch { alert('Toggle failed.') }
    finally { setToggling(null) }
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: '900px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>Plans</h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>Internal plan catalog seeded from migration. Prices are mapped separately.</p>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', background: '#fff', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              {['Sort', 'Code', 'Name', 'Tier', 'Interval', 'Entitlements', 'Active', ''].map((h) => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>Loading…</td></tr>
            ) : plans.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>No plans found. Run the billing migration to seed defaults.</td></tr>
            ) : plans.map((plan) => (
              <tr key={plan.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={td}><span style={{ color: '#9ca3af', fontSize: '13px' }}>{plan.sort_order}</span></td>
                <td style={td}><span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600, color: '#374151' }}>{plan.code}</span></td>
                <td style={td}><span style={{ fontSize: '13px', color: '#111827' }}>{plan.name}</span></td>
                <td style={td}><StatusChip status={plan.tier} size="sm" /></td>
                <td style={{ ...td, color: '#6b7280', fontSize: '13px' }}>{plan.interval ?? 'N/A'}</td>
                <td style={{ ...td, color: '#6b7280', fontSize: '12px' }}>{fmtEntitlements(plan.entitlements)}</td>
                <td style={td}>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: plan.is_active ? '#059669' : '#9ca3af' }}>
                    {plan.is_active ? 'Yes' : 'No'}
                  </span>
                </td>
                <td style={td}>
                  <button
                    onClick={() => void toggle(plan)}
                    disabled={toggling === plan.id}
                    style={{ padding: '4px 12px', borderRadius: '5px', border: '1px solid #e5e7eb', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#374151' }}
                  >
                    {toggling === plan.id ? '…' : plan.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
