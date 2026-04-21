// apps/admin/app/(protected)/claims/[id]/page.tsx
//
// Read-only claim detail view for admin.
// Shows claim metadata, all items, trip data, rate snapshot.

import Link from 'next/link'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

type Params = { params: Promise<{ id: string }> }

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-MY', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Kuala_Lumpur',
  })
}

function fmtKm(m: number | null) {
  if (m == null) return '—'
  return (Number(m) / 1000).toFixed(2) + ' km'
}

function fmtMoney(v: number | null) {
  if (v == null) return '—'
  return `MYR ${Number(v).toFixed(2)}`
}

const TYPE_ICON: Record<string, string> = {
  MILEAGE: '🚗', MEAL: '🍽️', LODGING: '🏨',
  TOLL: '🛣', PARKING: '🅿', TAXI: '🚕',
  GRAB: '🚗', TRAIN: '🚆', FLIGHT: '✈️',
  BUS: '🚌', PER_DIEM: '📅', MISC: '📋',
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'SUBMITTED'
    ? 'bg-green-50 text-green-700 border border-green-200'
    : 'bg-amber-50 text-amber-700 border border-amber-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${cls}`}>
      {status === 'SUBMITTED' ? '🔒 Submitted' : '✏️ Draft'}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-medium text-gray-400 w-36 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 flex-1">{value ?? '—'}</span>
    </div>
  )
}

export default async function ClaimDetailPage({ params }: Params) {
  const { id } = await params
  const db = createServiceRoleClient()

  const { data: claim, error: claimErr } = await db
    .from('claims')
    .select(`
      id, org_id, user_id, status, title, total_amount, currency,
      period_start, period_end, submitted_at, rate_version_id, user_rate_version_id,
      created_at, updated_at,
      organizations ( id, name, display_name ),
      profiles:user_id ( id, display_name, email, department, company_name )
    `)
    .eq('id', id)
    .single()

  if (claimErr || !claim) notFound()

  const { data: items } = await db
    .from('claim_items')
    .select(`
      id, type, mode, amount, currency, qty, unit, rate,
      receipt_url, merchant, notes, claim_date, meal_session,
      lodging_check_in, lodging_check_out, paid_via_tng,
      perdiem_rate_myr, perdiem_days, perdiem_destination,
      vehicle_type, created_at, trip_id,
      trips (
        id, calculation_mode, distance_source, final_distance_m,
        origin_text, destination_text, vehicle_type, transport_type, started_at
      )
    `)
    .eq('claim_id', id)
    .order('created_at', { ascending: true })

  // Load rate snapshot
  let rateSnapshot: { mileage_rate_per_km: number | null; motorcycle_rate_per_km: number | null; perdiem_rate_myr: number | null; rate_label: string | null; effective_from: string | null } | null = null
  if (claim.user_rate_version_id) {
    const { data } = await db
      .from('user_rate_versions')
      .select('mileage_rate_per_km, motorcycle_rate_per_km, perdiem_rate_myr, rate_label, effective_from')
      .eq('id', claim.user_rate_version_id)
      .maybeSingle()
    rateSnapshot = data
  }

  const org    = Array.isArray(claim.organizations) ? claim.organizations[0] : claim.organizations
  const user   = Array.isArray(claim.profiles)      ? claim.profiles[0]      : claim.profiles
  const allItems = items ?? []

  return (
    <div className="space-y-5 max-w-4xl">

      {/* Back + header */}
      <div>
        <Link href="/claims" className="text-sm text-gray-400 hover:text-gray-600">← All Claims</Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-xl font-bold text-gray-900">{claim.title ?? '(Untitled Claim)'}</h1>
          <StatusBadge status={claim.status} />
        </div>
        <p className="text-xs font-mono text-gray-300 mt-1">{claim.id}</p>
      </div>

      {/* Claim metadata */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Claim Details</h2>
        <InfoRow label="Staff" value={`${user?.display_name ?? '—'} (${user?.email ?? '—'})`} />
        <InfoRow label="Department" value={user?.department} />
        <InfoRow label="Company" value={user?.company_name} />
        <InfoRow label="Organisation" value={(org as { display_name?: string | null; name: string } | null)?.display_name ?? (org as { name: string } | null)?.name} />
        <InfoRow label="Period" value={`${fmtDate(claim.period_start)} – ${fmtDate(claim.period_end)}`} />
        <InfoRow label="Total Amount" value={<span className="font-bold text-gray-900">{fmtMoney(claim.total_amount)}</span>} />
        <InfoRow label="Created" value={fmtDateTime(claim.created_at)} />
        <InfoRow label="Submitted" value={fmtDateTime(claim.submitted_at)} />
        {rateSnapshot && (
          <InfoRow label="Rate Snapshot" value={
            <span className="text-xs">
              {rateSnapshot.rate_label ?? 'Personal Rate'} · effective {fmtDate(rateSnapshot.effective_from)}
              {' · '}🚗 {fmtMoney(rateSnapshot.mileage_rate_per_km)}/km
              {rateSnapshot.motorcycle_rate_per_km != null && ` · 🏍 ${fmtMoney(rateSnapshot.motorcycle_rate_per_km)}/km`}
            </span>
          } />
        )}
      </div>

      {/* Claim items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Claim Items ({allItems.length})
          </h2>
          <span className="text-sm font-bold text-gray-900">{fmtMoney(claim.total_amount)}</span>
        </div>

        {allItems.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No items on this claim.</div>
        )}

        <div className="divide-y divide-gray-50">
          {allItems.map(item => {
            const trip = item.trips ? (Array.isArray(item.trips) ? item.trips[0] : item.trips) : null

            return (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0 mt-0.5">{TYPE_ICON[item.type] ?? '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{item.type}</span>
                        {item.mode && item.mode !== 'RECEIPT' && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">{item.mode}</span>
                        )}
                        {item.paid_via_tng && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100">TNG</span>
                        )}
                        {item.vehicle_type && (
                          <span className="text-xs px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                            {item.vehicle_type === 'motorcycle' ? '🏍 Motorcycle' : '🚗 Car'}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-gray-400 mt-0.5">{fmtDate(item.claim_date)}</div>

                      {/* Merchant / route */}
                      {item.merchant && (
                        <div className="text-xs text-gray-600 mt-1">{item.merchant}</div>
                      )}

                      {/* Trip info for mileage */}
                      {trip && (
                        <div className="text-xs text-gray-500 mt-1">
                          {trip.origin_text} → {trip.destination_text}
                          {' · '}{fmtKm(trip.final_distance_m)}
                          {' · '}<span className="text-gray-400">{trip.distance_source}</span>
                        </div>
                      )}

                      {/* Meal session */}
                      {item.meal_session && (
                        <div className="text-xs text-gray-500 mt-0.5">Session: {item.meal_session}</div>
                      )}

                      {/* Lodging */}
                      {item.lodging_check_in && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {fmtDate(item.lodging_check_in)} – {fmtDate(item.lodging_check_out)}
                        </div>
                      )}

                      {/* Per diem */}
                      {item.perdiem_days != null && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {item.perdiem_days} day{item.perdiem_days !== 1 ? 's' : ''} × {fmtMoney(item.perdiem_rate_myr)}/day
                          {item.perdiem_destination && ` · ${item.perdiem_destination}`}
                        </div>
                      )}

                      {/* Rate (mileage) */}
                      {item.qty != null && item.rate != null && item.unit === 'KM' && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {Number(item.qty).toFixed(2)} km × {fmtMoney(item.rate)}/km
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="text-xs text-gray-400 mt-1 italic">{item.notes}</div>
                      )}

                      {/* Receipt */}
                      {item.receipt_url && (
                        <a href={item.receipt_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                          📎 Receipt
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-900">{fmtMoney(item.amount)}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Total footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-base font-bold text-gray-900">{fmtMoney(claim.total_amount)}</span>
        </div>
      </div>

      {/* Audit note */}
      <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
        🔒 Claims are read-only in the admin app. Submitted claims are immutable and cannot be modified by anyone.
      </div>
    </div>
  )
}
