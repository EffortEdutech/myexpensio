// apps/user/app/(app)/claims/page.tsx
// Claims list — Server Component.
// Shows All / Draft / Submitted tabs.
// "New Claim" opens /claims/new.
// Optionally pre-selects a tab via ?tab= query param.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'

type Claim = {
  id:           string
  status:       string
  title:        string | null
  period_start: string | null
  period_end:   string | null
  total_amount: number
  currency:     string
  submitted_at: string | null
  created_at:   string
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtMyr(amount: number): string {
  return 'MYR ' + Number(amount).toFixed(2)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function periodLabel(start: string | null, end: string | null): string {
  if (!start && !end) return '—'
  if (start && end) {
    const s = new Date(start)
    const e = new Date(end)
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return s.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })
    }
    return `${fmtDate(start)} – ${fmtDate(end)}`
  }
  return fmtDate(start ?? end)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0)  return `${d}d ago`
  if (h > 0)  return `${h}h ago`
  if (m > 0)  return `${m}m ago`
  return 'just now'
}

function ClaimCard({ claim }: { claim: Claim }) {
  const isDraft = claim.status === 'DRAFT'
  const title   = claim.title || periodLabel(claim.period_start, claim.period_end)

  const dateStr = claim.period_start
    ? claim.period_start === claim.period_end || !claim.period_end
      ? fmtDate(claim.period_start)
      : `${fmtDate(claim.period_start)} – ${fmtDate(claim.period_end)}`
    : '—'

  return (
    <Link href={`/claims/${claim.id}`} style={S.card}>

      {/* Col 1 — date */}
      <div style={S.colDate}>
        <span style={S.dateText}>{dateStr}</span>
        <span style={{
          ...S.badge,
          backgroundColor: isDraft ? '#fef9c3' : '#f0fdf4',
          color:           isDraft ? '#854d0e' : '#15803d',
        }}>
          {isDraft ? 'Draft' : '✓'}
        </span>
      </div>

      {/* Col 2 — description */}
      <div style={S.colDesc}>
        <span style={S.cardTitle}>{title}</span>
        <span style={S.cardSub}>
          {isDraft ? `edited ${timeAgo(claim.created_at)}` : `submitted ${fmtDate(claim.submitted_at)}`}
        </span>
      </div>

      {/* Col 3 — amount */}
      <div style={S.colAmount}>
        <span style={S.amount}>{fmtMyr(claim.total_amount)}</span>
        <span style={S.cardArrow}>›</span>
      </div>

    </Link>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = (tab === 'SUBMITTED' || tab === 'DRAFT') ? tab : 'ALL'

  const supabase = await createClient()
  const org = await getActiveOrg()

  let claims: Claim[] = []

  if (org) {
    let query = supabase
      .from('claims')
      .select(`
        id, status, title, period_start, period_end,
        total_amount, currency, submitted_at, created_at
      `)
      .eq('org_id', org.org_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (activeTab !== 'ALL') query = query.eq('status', activeTab)

    const { data } = await query
    claims = (data ?? []) as Claim[]
  }

  const draftCount     = claims.filter(c => c.status === 'DRAFT').length
  const submittedCount = claims.filter(c => c.status === 'SUBMITTED').length

  return (
    <div style={S.page}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={S.header}>
        <h1 style={S.title}>Claims</h1>
        <Link href="/claims/new" style={S.btnNew}>+ New</Link>
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────── */}
      <div style={S.tabs}>
        {(['ALL', 'DRAFT', 'SUBMITTED'] as const).map(t => {
          const count = t === 'ALL' ? claims.length : t === 'DRAFT' ? draftCount : submittedCount
          const isActive = activeTab === t
          return (
            <Link
              key={t}
              href={t === 'ALL' ? '/claims' : `/claims?tab=${t}`}
              style={{
                ...S.tab,
                backgroundColor: isActive ? '#0f172a' : 'transparent',
                color:           isActive ? '#fff'    : '#64748b',
              }}
            >
              {t === 'ALL' ? 'All' : t === 'DRAFT' ? 'Draft' : 'Submitted'}
              {count > 0 && (
                <span style={{
                  ...S.tabCount,
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                  color:           isActive ? '#fff' : '#64748b',
                }}>
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* ── List ───────────────────────────────────────────────────── */}
      {claims.length === 0 ? (
        <div style={S.empty}>
          <span style={{ fontSize: 40 }}>📋</span>
          <p style={S.emptyTitle}>
            {activeTab === 'DRAFT' ? 'No draft claims'
              : activeTab === 'SUBMITTED' ? 'No submitted claims'
              : 'No claims yet'}
          </p>
          <p style={S.emptyText}>
            Create a claim to group your trips and expenses for submission.
          </p>
          <Link href="/claims/new" style={S.btnNewEmpty}>+ Create Claim</Link>
        </div>
      ) : (
        <div style={S.list}>
          {claims.map(c => <ClaimCard key={c.id} claim={c} />)}
        </div>
      )}

    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:      { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 80 },
  header:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title:     { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  btnNew: {
    padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff',
    borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 700,
  },
  tabs: {
    display: 'flex', gap: 4, backgroundColor: '#f8fafc',
    borderRadius: 10, padding: 4,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    flex: 1, justifyContent: 'center',
    padding: '8px 12px', borderRadius: 8,
    textDecoration: 'none', fontSize: 13, fontWeight: 600,
    transition: 'background 0.15s',
  },
  tabCount: {
    fontSize: 11, fontWeight: 700, padding: '1px 6px',
    borderRadius: 10, minWidth: 18, textAlign: 'center',
  },
  list:    { display: 'flex', flexDirection: 'column', gap: 1, backgroundColor: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' },
  card: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', paddingTop: 12, paddingBottom: 12,
    paddingLeft: 14, paddingRight: 14, textDecoration: 'none',
  },
  // 3-column layout
  colDate:   { display: 'flex', flexDirection: 'column', gap: 4, width: 110, flexShrink: 0 },
  colDesc:   { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 },
  colAmount: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  dateText:  { fontSize: 11, color: '#64748b', fontWeight: 500, lineHeight: 1.4 },
  cardTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardSub:   { fontSize: 11, color: '#94a3b8' },
  badge:     { fontSize: 10, fontWeight: 700, paddingTop: 2, paddingBottom: 2, paddingLeft: 6, paddingRight: 6, borderRadius: 8, alignSelf: 'flex-start' },
  amount:    { fontSize: 14, fontWeight: 800, color: '#0f172a' },
  cardArrow: { color: '#cbd5e1', fontSize: 18 },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 10, padding: '48px 16px', textAlign: 'center',
  },
  emptyTitle:  { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 },
  emptyText:   { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6, maxWidth: 280 },
  btnNewEmpty: {
    padding: '11px 24px', backgroundColor: '#0f172a', color: '#fff',
    borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 700,
  },
}
