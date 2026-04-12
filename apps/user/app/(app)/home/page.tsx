// apps/user/app/(app)/home/page.tsx
// Home dashboard — Server Component.
// Shows: greeting, quick actions, this-month stats, recent trips + claims.
// New user empty state shows first-time onboarding card.

import Link from 'next/link'
import { getActiveOrg } from '@/lib/org'
import { getHomeStats, type RecentTrip, type RecentClaim } from '@/lib/queries/home'
import { createClient } from '@/lib/supabase/server'
import { PwaInstallCard } from '@/components/PwaInstallCard'

// ── Formatters ─────────────────────────────────────────────────────────────

function fmtKm(meters: number | null): string {
  if (meters == null) return '—'
  return (meters / 1000).toFixed(2) + ' km'
}

function fmtMyr(amount: number): string {
  return 'MYR ' + amount.toFixed(2)
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 60)   return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function distanceBadge(source: string | null) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    GPS:               { label: 'GPS',       bg: '#f0fdf4', color: '#16a34a' },
    SELECTED_ROUTE:    { label: 'Route',     bg: '#eff6ff', color: '#2563eb' },
    ODOMETER_OVERRIDE: { label: 'Odometer',  bg: '#fefce8', color: '#ca8a04' },
  }
  const s = map[source ?? ''] ?? { label: source ?? '—', bg: '#f1f5f9', color: '#475569' }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px',
      backgroundColor: s.bg, color: s.color, borderRadius: 10 }}>
      {s.label}
    </span>
  )
}

function statusBadge(status: string) {
  const isDraft = status === 'DRAFT'
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px',
      backgroundColor: isDraft ? '#fef9c3' : '#f0fdf4',
      color: isDraft ? '#a16207' : '#16a34a',
      borderRadius: 10 }}>
      {isDraft ? 'Draft' : 'Submitted'}
    </span>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={S.statCard}>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  )
}

function QuickAction({ href, icon, label, color }: {
  href: string; icon: string; label: string; color: string
}) {
  return (
    <Link href={href} style={{ ...S.quickAction, borderColor: color + '33' }}>
      <span style={{ ...S.quickIcon, backgroundColor: color + '18', color }}>{icon}</span>
      <span style={S.quickLabel}>{label}</span>
    </Link>
  )
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div style={S.sectionHeader}>
      <span style={S.sectionTitle}>{title}</span>
      {href && <Link href={href} style={S.seeAll}>See all</Link>}
    </div>
  )
}

function EmptyCard({ icon, message, cta, href }: {
  icon: string; message: string; cta?: string; href?: string
}) {
  return (
    <div style={S.emptyCard}>
      <span style={{ fontSize: 28 }}>{icon}</span>
      <p style={S.emptyMsg}>{message}</p>
      {cta && href && (
        <Link href={href} style={S.emptyBtn}>{cta}</Link>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const org   = await getActiveOrg()
  const stats = org ? await getHomeStats(org.org_id) : null

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = (user?.email ?? '').split('@')[0]

  const isNewUser = !stats || (
    stats.tripsThisMonth === 0 &&
    stats.draftClaims    === 0 &&
    stats.submittedClaims === 0
  )

  const month = new Date().toLocaleString('en-MY', { month: 'long', year: 'numeric' })

  return (
    <div style={S.page}>
      <div style={S.greeting}>
        <h1 style={S.greetingText}>
          {greeting}, {firstName} 👋
        </h1>
        {org && <p style={S.workspaceName}>{org.org_name}</p>}
      </div>

      <PwaInstallCard compact />

      {isNewUser && (
        <div style={S.onboardCard}>
          <div style={S.onboardIcon}>🚀</div>
          <div>
            <p style={S.onboardTitle}>Welcome to myexpensio!</p>
            <p style={S.onboardSub}>
              Start by recording your first trip, then attach it to a claim.
            </p>
          </div>
          <Link href="/trips" style={S.onboardBtn}>Start a trip →</Link>
        </div>
      )}

      <div style={S.quickGrid}>
        <QuickAction href="/trips/start"          icon="▶" label="Start Trip"  color="#16a34a" />
        <QuickAction href="/trips/plan"          icon="🗺" label="Mileage Calc"  color="#2563eb" />
        <QuickAction href="/claims?action=new"  icon="＋" label="New Claim"  color="#7c3aed" />
        <QuickAction href="/claims?tab=export"  icon="↓" label="Export"      color="#0891b2" />
      </div>

      <SectionHeader title={month} />
      <div style={S.statGrid}>
        <StatCard label="Trips" value={stats?.tripsThisMonth ?? 0} />
        <StatCard label="Draft Claims" value={stats?.draftClaims ?? 0} />
        <StatCard label="Submitted" value={stats?.submittedClaims ?? 0} />
        {org?.tier === 'FREE' && (
          <StatCard label="Route Calcs" value={`${stats?.routesUsed ?? 0} / 2`} sub="Free plan" />
        )}
      </div>

      <SectionHeader title="Recent Trips" href="/trips" />
      {!stats || stats.recentTrips.length === 0 ? (
        <EmptyCard icon="🗺" message="No trips yet. Start tracking your first trip." cta="Start Trip" href="/trips/start" />
      ) : (
        <div style={S.list}>
          {stats.recentTrips.map((trip: RecentTrip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`} style={S.card}>
              <div style={S.cardRow}>
                <div>
                  <p style={S.cardTitle}>
                    {trip.origin_text && trip.destination_text
                      ? `${trip.origin_text} → ${trip.destination_text}`
                      : 'Trip ' + fmtDate(trip.started_at)}
                  </p>
                  <p style={S.cardSub}>{fmtDate(trip.started_at)}</p>
                </div>
                <div style={S.cardRight}>
                  <p style={S.cardDistance}>{fmtKm(trip.final_distance_m)}</p>
                  {distanceBadge(trip.distance_source)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <SectionHeader title="Recent Claims" href="/claims" />
      {!stats || stats.recentClaims.length === 0 ? (
        <EmptyCard icon="📋" message="No claims yet. Create your first claim." cta="New Claim" href="/claims?action=new" />
      ) : (
        <div style={S.list}>
          {stats.recentClaims.map((claim: RecentClaim) => (
            <Link key={claim.id} href={`/claims/${claim.id}`} style={S.card}>
              <div style={S.cardRow}>
                <div>
                  <p style={S.cardTitle}>
                    {claim.title ?? `Claim — ${fmtDate(claim.created_at)}`}
                  </p>
                  <p style={S.cardSub}>{timeAgo(claim.created_at)}</p>
                </div>
                <div style={S.cardRight}>
                  <p style={S.cardDistance}>{fmtMyr(claim.total_amount)}</p>
                  {statusBadge(claim.status)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20 },
  greeting: { paddingTop: 4 },
  greetingText: { fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 },
  workspaceName: { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  onboardCard: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 },
  onboardIcon: { fontSize: 28 },
  onboardTitle: { fontSize: 15, fontWeight: 700, color: '#14532d', margin: 0 },
  onboardSub: { fontSize: 13, color: '#166534', margin: '4px 0 0', lineHeight: 1.5 },
  onboardBtn: { alignSelf: 'flex-start', padding: '8px 16px', backgroundColor: '#16a34a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 },
  quickAction: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 12, backgroundColor: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: 12, textDecoration: 'none' },
  quickIcon: { width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 },
  quickLabel: { fontSize: 10, fontWeight: 600, color: '#374151', textAlign: 'center' },
  sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: -8 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: '#0f172a' },
  seeAll: { fontSize: 12, color: '#64748b', textDecoration: 'none', fontWeight: 500 },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
  statCard: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 },
  statValue: { fontSize: 26, fontWeight: 800, color: '#0f172a', lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4, fontWeight: 500 },
  statSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, textDecoration: 'none', display: 'block' },
  cardRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 },
  cardSub: { fontSize: 12, color: '#94a3b8', margin: '3px 0 0' },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 },
  cardDistance: { fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 },
  emptyCard: { backgroundColor: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' },
  emptyMsg: { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 },
  emptyBtn: { marginTop: 4, padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600 },
}
