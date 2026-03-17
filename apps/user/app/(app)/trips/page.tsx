// apps/user/app/(app)/trips/page.tsx
// Trips list — Server Component.
// Three floating action buttons:
//   ▶ Start GPS Trip   (was "Start Trip")
//   🔢 Odometer Trip   (NEW)
//   📐 Mileage Calculator

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getActiveOrg }  from '@/lib/org'
import { fmtKm } from '@/lib/distance'

// ── Types ──────────────────────────────────────────────────────────────────

type Trip = {
  id:                string
  status:            string
  calculation_mode:  string
  started_at:        string
  ended_at:          string | null
  origin_text:       string | null
  destination_text:  string | null
  final_distance_m:  number | null
  distance_source:   string | null
  odometer_mode:     string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MY_TZ = 'Asia/Kuala_Lumpur'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', {
    timeZone: MY_TZ,
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-MY', {
    timeZone: MY_TZ,
    hour: '2-digit', minute: '2-digit',
  })
}

const SOURCE_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  GPS:               { label: 'GPS',       bg: '#f0fdf4', color: '#16a34a' },
  SELECTED_ROUTE:    { label: 'Route',     bg: '#eff6ff', color: '#2563eb' },
  ODOMETER_OVERRIDE: { label: 'Odometer',  bg: '#fefce8', color: '#ca8a04' },
}

function TripCard({ trip }: { trip: Trip }) {
  const badge   = SOURCE_BADGE[trip.distance_source ?? '']
  const isDraft = trip.status === 'DRAFT'

  // ── Icon: GPS = 📍, Odometer Override = 📏, Route = 🗺 ──────────────────
  const modeIcon =
    trip.calculation_mode === 'GPS_TRACKING'       ? '📍'
    : trip.distance_source === 'ODOMETER_OVERRIDE' ? '📏'
    : '🗺'

  const title =
    trip.origin_text && trip.destination_text
      ? `${trip.origin_text} → ${trip.destination_text}`
      : trip.calculation_mode === 'GPS_TRACKING'
        ? 'GPS Trip'
        : trip.distance_source === 'ODOMETER_OVERRIDE'
          ? 'Odometer Trip'
          : 'Planned Trip'

  return (
    <Link href={`/trips/${trip.id}`} style={S.card}>
      <div style={S.cardLeft}>
        <div style={S.cardIcon}>{modeIcon}</div>
      </div>
      <div style={S.cardBody}>
        <div style={S.cardRow}>
          <span style={S.cardTitle}>{title}</span>
          {isDraft
            ? <span style={S.draftBadge}>In Progress</span>
            : badge && (
              <span style={{ ...S.sourceBadge, backgroundColor: badge.bg, color: badge.color }}>
                {badge.label}
              </span>
            )
          }
        </div>
        <div style={S.cardMeta}>
          <span>{fmtDate(trip.started_at)}</span>
          <span style={{ color: '#cbd5e1' }}>·</span>
          <span>{fmtTime(trip.started_at)}{trip.ended_at ? ` → ${fmtTime(trip.ended_at)}` : ''}</span>
        </div>
        <div style={S.cardFooter}>
          {trip.final_distance_m != null && (
            <span style={S.distanceText}>{fmtKm(trip.final_distance_m)}</span>
          )}
          {trip.odometer_mode && trip.odometer_mode !== 'NONE' && (
            <span style={S.odoTag}>
              {trip.odometer_mode === 'OVERRIDE' ? '📏 Override' : '📷 Evidence'}
            </span>
          )}
        </div>
      </div>
      <span style={S.cardArrow}>›</span>
    </Link>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function TripsPage() {
  const supabase = await createClient()
  const org      = await getActiveOrg()

  let trips: Trip[] = []
  if (org) {
    const { data } = await supabase
      .from('trips')
      .select(`
        id, status, calculation_mode,
        started_at, ended_at, origin_text, destination_text,
        final_distance_m, distance_source, odometer_mode
      `)
      .eq('org_id', org.org_id)
      .order('started_at', { ascending: false })
      .limit(50)
    trips = (data ?? []) as Trip[]
  }

  const inProgress = trips.filter(t => t.status === 'DRAFT' && t.calculation_mode === 'GPS_TRACKING')

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>My Trips</h1>
        {trips.length > 0 && (
          <span style={S.count}>{trips.length} trip{trips.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Active GPS trip banner */}
      {inProgress.length > 0 && (
        <Link href={`/trips/start?resume=${inProgress[0].id}`} style={S.activeBanner}>
          <span style={S.activeGlow} />
          <span style={S.activeBannerText}>GPS trip in progress — tap to return</span>
          <span>›</span>
        </Link>
      )}

      {/* Trip list */}
      {trips.length === 0 ? (
        <div style={S.empty}>
          <span style={{ fontSize: 36 }}>🗺</span>
          <p style={S.emptyTitle}>No trips yet</p>
          <p style={S.emptyText}>
            Start a GPS trip, enter an odometer reading, or use the Mileage Calculator.
          </p>
        </div>
      ) : (
        <div style={S.list}>
          {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </div>
      )}

      {/* ── Floating action buttons ──────────────────────────────────────── */}
      <div style={S.fab}>
        {/* Bottom (tertiary): Mileage Calculator */}
        <Link href="/trips/plan" style={S.fabTertiary}>
          📐 Mileage Calculator
        </Link>

        {/* Middle (secondary): Odometer Trip */}
        <Link href="/trips/odometer" style={S.fabSecondary}>
          📏 Odometer Trip
        </Link>

        {/* Top (primary): Start GPS Trip — or resume if one in progress */}
        {inProgress.length > 0 ? (
          <Link href={`/trips/start?resume=${inProgress[0].id}`} style={S.fabPrimary}>
            🔴 Return to Tracker
          </Link>
        ) : (
          <Link href="/trips/start" style={S.fabPrimary}>
            ▶ Start GPS Trip
          </Link>
        )}
      </div>

    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  page:    { display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 100 },
  header:  { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  title:   { fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 },
  count:   { fontSize: 13, color: '#94a3b8' },
  activeBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    backgroundColor: '#fef2f2', border: '1.5px solid #fecaca',
    borderRadius: 10, padding: '12px 14px', textDecoration: 'none',
    color: '#dc2626', fontWeight: 600, fontSize: 14,
  },
  activeGlow: {
    width: 10, height: 10, borderRadius: '50%',
    backgroundColor: '#dc2626', flexShrink: 0,
    boxShadow: '0 0 0 3px rgba(220,38,38,0.25)',
  },
  activeBannerText: { flex: 1 },
  list:    { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    display: 'flex', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: 14, textDecoration: 'none',
  },
  cardLeft:     { flexShrink: 0 },
  cardIcon:     { fontSize: 22 },
  cardBody:     { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 },
  cardRow:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: {
    fontSize: 14, fontWeight: 600, color: '#0f172a',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  cardMeta:     { display: 'flex', gap: 6, fontSize: 11, color: '#94a3b8' },
  cardFooter:   { display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 },
  distanceText: { fontSize: 13, fontWeight: 700, color: '#0f172a' },
  cardArrow:    { color: '#cbd5e1', fontSize: 18, flexShrink: 0 },
  draftBadge: {
    fontSize: 10, fontWeight: 600, padding: '2px 7px',
    backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 10, flexShrink: 0,
  },
  sourceBadge:  { fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 10, flexShrink: 0 },
  odoTag:       { fontSize: 10, color: '#94a3b8' },
  empty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 8, padding: '48px 16px', textAlign: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 },
  emptyText:  { fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.6 },

  // FAB stack — 3 buttons, right-aligned, stacked bottom to top
  // All same padding + shape. Colors only differ.
  fab: {
    position: 'fixed', bottom: 80, right: 16,
    display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
  },
  fabPrimary: {
    padding: '12px 20px',
    backgroundColor: '#0f172a', color: '#fff',
    borderRadius: 24, textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    whiteSpace: 'nowrap' as const,
  },
  fabSecondary: {
    padding: '12px 20px',
    backgroundColor: '#ca8a04', color: '#fff',
    borderRadius: 24, textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(202,138,4,0.25)',
    whiteSpace: 'nowrap' as const,
  },
  fabTertiary: {
    padding: '12px 20px',
    backgroundColor: '#2563eb', color: '#fff',
    borderRadius: 24, textDecoration: 'none',
    fontSize: 14, fontWeight: 700,
    boxShadow: '0 4px 16px rgba(37,99,235,0.25)',
    whiteSpace: 'nowrap' as const,
  },
}
