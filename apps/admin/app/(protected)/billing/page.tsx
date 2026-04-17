'use client'

/**
 * apps/admin/app/billing/page.tsx
 *
 * Billing Overview — platform-level commercial health dashboard.
 * Calls:  GET /api/admin/billing/stats
 *         GET /api/admin/billing/overview (recent org list)
 *         GET /api/admin/referrals/commissions?status=PENDING&page_size=5
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import KpiCard from '@/components/billing/KpiCard'
import StatusChip from '@/components/billing/StatusChip'
import MoneyCell, { formatMYR } from '@/components/billing/MoneyCell'
import type { BillingStats } from '@/app/api/admin/billing/stats/route'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OrgSnapshot = {
  org_id: string
  org_name: string
  tier: string
  billing_status: string | null
  plan_code: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
  current_amount: number | null
  current_currency: string | null
}

type CommissionLedgerRow = {
  id: string
  agent_id: string
  org_id: string
  commission_amount: number
  currency: string
  status: string
  created_at: string
  metadata: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingOverviewPage() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [recentOrgs, setRecentOrgs] = useState<OrgSnapshot[]>([])
  const [pendingCommissions, setPendingCommissions] = useState<CommissionLedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [statsData, orgsData, commissionsData] = await Promise.all([
          fetchJson<BillingStats>('/api/admin/billing/stats'),
          fetchJson<{ items: OrgSnapshot[] }>('/api/admin/billing/overview?page_size=8&billing_status=PAST_DUE'),
          fetchJson<{ items: CommissionLedgerRow[] }>(
            '/api/admin/referrals/commissions?status=PENDING&page_size=5'
          ),
        ])
        setStats(statsData)
        setRecentOrgs(orgsData.items ?? [])
        setPendingCommissions(commissionsData.items ?? [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load billing data.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (error) {
    return (
      <div style={{ padding: '32px', color: '#dc2626' }}>
        Error loading billing overview: {error}
      </div>
    )
  }

  const s = stats

  return (
    <div style={{ padding: '32px 36px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#111827' }}>
          Billing Overview
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>
          Platform-wide commercial health
        </p>
      </div>

      {/* Row 1 — Subscription health KPIs */}
      <SectionLabel>Subscriptions</SectionLabel>
      <div style={grid(6)}>
        <KpiCard label="Active" value={s?.subscriptions.active ?? '—'} accent="green" loading={loading} />
        <KpiCard label="Trialing" value={s?.subscriptions.trialing ?? '—'} accent="blue" loading={loading} />
        <KpiCard label="Past due" value={s?.subscriptions.past_due ?? '—'} accent="amber" loading={loading} />
        <KpiCard label="Unpaid" value={s?.subscriptions.unpaid ?? '—'} accent="red" loading={loading} />
        <KpiCard label="Cancel at period end" value={s?.subscriptions.cancel_at_period_end ?? '—'} loading={loading} />
        <KpiCard label="Total orgs tracked" value={s?.subscriptions.total ?? '—'} loading={loading} />
      </div>

      {/* Row 2 — Revenue KPIs */}
      <SectionLabel style={{ marginTop: '24px' }}>Revenue</SectionLabel>
      <div style={grid(4)}>
        <KpiCard
          label="MRR estimate"
          value={s ? formatMYR(s.mrr_estimate) : '—'}
          accent="green"
          loading={loading}
        />
        <KpiCard
          label="ARR estimate"
          value={s ? formatMYR(s.arr_estimate) : '—'}
          accent="green"
          loading={loading}
        />
        <KpiCard
          label="Paid invoices this month"
          value={s ? `${s.invoices.paid_this_month}` : '—'}
          sub={s ? formatMYR(s.invoices.paid_amount_this_month) : undefined}
          loading={loading}
        />
        <KpiCard
          label="Failed invoices this month"
          value={s?.invoices.failed_this_month ?? '—'}
          accent={s && s.invoices.failed_this_month > 0 ? 'red' : 'neutral'}
          loading={loading}
        />
      </div>

      {/* Row 3 — Partners / commission KPIs */}
      <SectionLabel style={{ marginTop: '24px' }}>Partners & Commission</SectionLabel>
      <div style={grid(4)}>
        <KpiCard label="Active partners" value={s?.agents.active ?? '—'} accent="blue" loading={loading} />
        <KpiCard label="Pending approvals" value={s?.agents.pending ?? '—'} accent="amber" loading={loading} />
        <KpiCard
          label="Pending commission"
          value={s ? formatMYR(s.commission.pending_amount) : '—'}
          sub={s ? `${s.commission.pending_count} entries` : undefined}
          accent={s && s.commission.pending_amount > 0 ? 'amber' : 'neutral'}
          loading={loading}
        />
        <KpiCard
          label="Quick links"
          value="→"
          sub="Payout runs · Ledger"
          loading={loading}
        />
      </div>

      {/* Action-needed section */}
      <div style={{ marginTop: '36px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Past due orgs */}
        <div style={card}>
          <SectionHeader
            title="Past due orgs"
            linkHref="/billing/subscriptions?billing_status=PAST_DUE"
            linkLabel="View all"
          />
          {loading ? <SkeletonRows n={4} /> : recentOrgs.length === 0 ? (
            <EmptyState label="No past due subscriptions" />
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Org</Th>
                  <Th>Status</Th>
                  <Th align="right">Amount</Th>
                  <Th>Period ends</Th>
                </tr>
              </thead>
              <tbody>
                {recentOrgs.map((org) => (
                  <tr key={org.org_id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={td}>
                      <Link
                        href={`/billing/subscriptions?org_id=${org.org_id}`}
                        style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '13px' }}
                      >
                        {org.org_name}
                      </Link>
                    </td>
                    <td style={td}>
                      <StatusChip status={org.billing_status ?? 'INACTIVE'} size="sm" />
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <MoneyCell amount={org.current_amount} size="sm" />
                    </td>
                    <td style={{ ...td, color: '#9ca3af', fontSize: '12px' }}>
                      {fmtDate(org.current_period_end)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pending commissions */}
        <div style={card}>
          <SectionHeader
            title="Pending commissions"
            linkHref="/referrals/ledger?status=PENDING"
            linkLabel="View all"
          />
          {loading ? <SkeletonRows n={4} /> : pendingCommissions.length === 0 ? (
            <EmptyState label="No pending commission entries" />
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Agent org</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Date</Th>
                </tr>
              </thead>
              <tbody>
                {pendingCommissions.map((row) => {
                  const agentOrgId = row.metadata?.agent_org_id as string | null
                  return (
                    <tr key={row.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={td}>
                        <Link
                          href={`/referrals/agents?org_id=${agentOrgId ?? row.agent_id}`}
                          style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {agentOrgId ? `Org ${agentOrgId.slice(0, 8)}…` : `Agent ${row.agent_id.slice(0, 8)}…`}
                        </Link>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <MoneyCell amount={row.commission_amount} size="sm" />
                      </td>
                      <td style={td}>
                        <StatusChip status={row.status} size="sm" />
                      </td>
                      <td style={{ ...td, color: '#9ca3af', fontSize: '12px' }}>
                        {fmtDate(row.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({
  children,
  style,
}: {
  children: string
  style?: React.CSSProperties
}) {
  return (
    <p
      style={{
        margin: '0 0 10px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: '#9ca3af',
        ...style,
      }}
    >
      {children}
    </p>
  )
}

function SectionHeader({
  title,
  linkHref,
  linkLabel,
}: {
  title: string
  linkHref: string
  linkLabel: string
}) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '14px',
      }}
    >
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
        {title}
      </p>
      <Link href={linkHref} style={{ fontSize: '12px', color: '#4f46e5', textDecoration: 'none' }}>
        {linkLabel} →
      </Link>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <p style={{ margin: '20px 0', textAlign: 'center', fontSize: '13px', color: '#9ca3af' }}>
      {label}
    </p>
  )
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{ height: '16px', borderRadius: '4px', background: '#f3f4f6', width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </div>
  )
}

function Th({ children, align }: { children: string; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        textAlign: align ?? 'left',
        padding: '6px 8px',
        fontSize: '11px',
        fontWeight: 600,
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

function grid(cols: number): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: '14px',
  }
}

const card: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  background: '#fff',
  padding: '20px 22px',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
}

const td: React.CSSProperties = {
  padding: '8px 8px',
  fontSize: '13px',
  color: '#374151',
  verticalAlign: 'middle',
}
