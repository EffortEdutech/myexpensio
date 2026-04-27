'use client'
// apps/admin/app/(protected)/claims/[id]/page.tsx
//
// Read-only claim detail view for workspace admins (OWNER, ADMIN, MANAGER).
// Shows claimant info, all claim items, trip evidence, receipts.
// SUBMITTED claims display a locked badge — no editing possible.

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

type Profile = {
  id: string; email: string | null; display_name: string | null; department: string | null
}

type Trip = {
  id: string
  origin_text: string | null
  destination_text: string | null
  final_distance_m: number | null
  distance_source: string | null
  transport_type: string | null
  vehicle_type: string | null
  odometer_mode: string | null
  started_at: string | null
  ended_at: string | null
}

type ClaimItem = {
  id: string
  type: string
  amount: number | null
  currency: string
  claim_date: string | null
  merchant: string | null
  notes: string | null
  receipt_url: string | null
  qty: number | null
  unit: string | null
  rate: number | null
  paid_via_tng: boolean | null
  vehicle_type: string | null
  meal_session: string | null
  lodging_check_in: string | null
  lodging_check_out: string | null
  perdiem_rate_myr: number | null
  perdiem_days: number | null
  perdiem_destination: string | null
  tng_transaction_id: string | null
  trips: Trip | null
}

type Claim = {
  id: string
  org_id: string
  user_id: string
  status: 'DRAFT' | 'SUBMITTED'
  title: string | null
  total_amount: number | null
  currency: string
  period_start: string | null
  period_end: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
  profiles: Profile | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtDateTime(val: string | null) {
  if (!val) return '—'
  return new Date(val).toLocaleString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(val: number | null, currency = 'MYR') {
  if (val === null || val === undefined) return '—'
  return `${currency} ${val.toFixed(2)}`
}

function fmtKm(meters: number | null) {
  if (!meters) return '—'
  return `${(meters / 1000).toFixed(2)} km`
}

const ITEM_TYPE_LABELS: Record<string, string> = {
  MILEAGE:   'Mileage',
  MEAL:      'Meal',
  LODGING:   'Lodging',
  TOLL:      'Toll',
  PARKING:   'Parking',
  GRAB:      'Grab',
  TAXI:      'Taxi',
  TRAIN:     'Train',
  FLIGHT:    'Flight',
  BUS:       'Bus',
  PER_DIEM:  'Per Diem',
  ODOMETER:  'Odometer',
  MISC:      'Miscellaneous',
}

const ITEM_TYPE_COLORS: Record<string, string> = {
  MILEAGE:  'bg-blue-50 text-blue-700',
  MEAL:     'bg-amber-50 text-amber-700',
  LODGING:  'bg-purple-50 text-purple-700',
  TOLL:     'bg-gray-100 text-gray-600',
  PARKING:  'bg-gray-100 text-gray-600',
  GRAB:     'bg-green-50 text-green-700',
  TAXI:     'bg-green-50 text-green-700',
  TRAIN:    'bg-indigo-50 text-indigo-700',
  FLIGHT:   'bg-sky-50 text-sky-700',
  BUS:      'bg-teal-50 text-teal-700',
  PER_DIEM: 'bg-orange-50 text-orange-700',
  ODOMETER: 'bg-blue-50 text-blue-700',
  MISC:     'bg-gray-100 text-gray-600',
}

// ── Item detail renderer ───────────────────────────────────────────────────────

function ItemDetail({ item }: { item: ClaimItem }) {
  const trip = item.trips

  const rows: { label: string; value: string | null }[] = []

  if (item.claim_date) rows.push({ label: 'Date', value: fmtDate(item.claim_date) })
  if (item.merchant)   rows.push({ label: 'Merchant / vendor', value: item.merchant })

  // Type-specific rows
  switch (item.type) {
    case 'MILEAGE':
    case 'ODOMETER':
      if (trip?.origin_text)       rows.push({ label: 'From', value: trip.origin_text })
      if (trip?.destination_text)  rows.push({ label: 'To', value: trip.destination_text })
      if (trip?.final_distance_m)  rows.push({ label: 'Distance', value: fmtKm(trip.final_distance_m) })
      if (trip?.distance_source)   rows.push({ label: 'Distance source', value: trip.distance_source })
      if (trip?.vehicle_type || item.vehicle_type)
        rows.push({ label: 'Vehicle', value: trip?.vehicle_type ?? item.vehicle_type ?? null })
      if (trip?.started_at)        rows.push({ label: 'Trip start', value: fmtDateTime(trip.started_at) })
      if (trip?.ended_at)          rows.push({ label: 'Trip end', value: fmtDateTime(trip.ended_at) })
      if (item.rate)               rows.push({ label: 'Rate/km', value: `MYR ${item.rate?.toFixed(3) ?? '—'}` })
      break
    case 'MEAL':
      if (item.meal_session) rows.push({ label: 'Session', value: item.meal_session })
      break
    case 'LODGING':
      if (item.lodging_check_in)  rows.push({ label: 'Check-in', value: fmtDate(item.lodging_check_in) })
      if (item.lodging_check_out) rows.push({ label: 'Check-out', value: fmtDate(item.lodging_check_out) })
      break
    case 'PER_DIEM':
      if (item.perdiem_destination) rows.push({ label: 'Destination', value: item.perdiem_destination })
      if (item.perdiem_days)        rows.push({ label: 'Days', value: String(item.perdiem_days) })
      if (item.perdiem_rate_myr)    rows.push({ label: 'Rate/day', value: `MYR ${item.perdiem_rate_myr.toFixed(2)}` })
      break
    case 'TOLL':
    case 'PARKING':
      if (item.paid_via_tng) rows.push({ label: 'Payment', value: 'Touch \'n Go (TNG)' })
      if (item.tng_transaction_id) rows.push({ label: 'TNG Transaction', value: item.tng_transaction_id.slice(0, 12) + '…' })
      break
    default:
      if (item.qty)  rows.push({ label: 'Qty', value: String(item.qty) })
      if (item.unit) rows.push({ label: 'Unit', value: item.unit })
      if (item.rate) rows.push({ label: 'Rate', value: `MYR ${item.rate.toFixed(2)}` })
  }

  if (item.notes) rows.push({ label: 'Notes', value: item.notes })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ITEM_TYPE_COLORS[item.type] ?? 'bg-gray-100 text-gray-600'}`}>
            {ITEM_TYPE_LABELS[item.type] ?? item.type}
          </span>
          {item.paid_via_tng && (
            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">TNG</span>
          )}
        </div>
        <div className="text-sm font-semibold text-gray-900 tabular-nums flex-shrink-0">
          {fmtMoney(item.amount, item.currency)}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <span className="text-xs text-gray-400">{label}</span>
              <span className="text-xs font-medium text-gray-700 break-words">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      )}

      {/* Receipt */}
      {item.receipt_url && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <a href={item.receipt_url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            View receipt
          </a>
        </div>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ClaimDetailPage() {
  const params  = useParams()
  const router  = useRouter()
  const claimId = params?.id as string | undefined

  const [claim, setClaim]   = useState<Claim | null>(null)
  const [items, setItems]   = useState<ClaimItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!claimId) return
    setLoading(true)
    fetch(`/api/workspace/claims/${claimId}`)
      .then(async res => {
        if (!res.ok) {
          const j = await res.json()
          throw new Error(j.error?.message ?? 'Failed to load claim')
        }
        return res.json()
      })
      .then(json => {
        setClaim(json.claim)
        setItems(json.items ?? [])
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false))
  }, [claimId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Loading claim…
      </div>
    )
  }

  if (error || !claim) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-red-600">{error ?? 'Claim not found'}</p>
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-800">
          ← Go back
        </button>
      </div>
    )
  }

  const isSubmitted = claim.status === 'SUBMITTED'

  // Group items by type for totals
  const typeGroups = items.reduce<Record<string, number>>((acc, item) => {
    const key = ITEM_TYPE_LABELS[item.type] ?? item.type
    acc[key] = (acc[key] ?? 0) + (item.amount ?? 0)
    return acc
  }, {})

  return (
    <div className="max-w-3xl space-y-5">

      {/* Back */}
      <Link href="/claims" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 gap-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Claims
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {claim.title || <span className="text-gray-400 italic font-normal">Untitled Claim</span>}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono text-xs">{claim.id}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {isSubmitted ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Submitted · Locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
                Draft
              </span>
            )}
          </div>
        </div>

        {/* Claimant + period row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Claimant</p>
            <p className="font-medium text-gray-900">{claim.profiles?.display_name ?? '—'}</p>
            <p className="text-xs text-gray-400">{claim.profiles?.email ?? '—'}</p>
            {claim.profiles?.department && <p className="text-xs text-gray-400">{claim.profiles.department}</p>}
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Claim period</p>
            <p className="font-medium text-gray-900">{fmtDate(claim.period_start)}</p>
            <p className="text-xs text-gray-400">to {fmtDate(claim.period_end)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
            <p className="font-medium text-gray-900">{fmtDateTime(claim.submitted_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Total amount</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">
              {fmtMoney(claim.total_amount, claim.currency)}
            </p>
          </div>
        </div>

        {/* Submitted banner */}
        {isSubmitted && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-xs text-green-700">
            This claim was submitted on {fmtDateTime(claim.submitted_at)} and is now locked. No further edits can be made.
          </div>
        )}
      </div>

      {/* Summary breakdown */}
      {Object.keys(typeGroups).length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Breakdown by type</p>
          <div className="space-y-1.5">
            {Object.entries(typeGroups).map(([type, amount]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{type}</span>
                <span className="font-medium text-gray-900 tabular-nums">MYR {amount.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 tabular-nums">
                {fmtMoney(claim.total_amount, claim.currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Claim items */}
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-3">
          Claim Items <span className="text-gray-400 font-normal ml-1">({items.length})</span>
        </p>
        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-24 text-sm text-gray-400">
            No items in this claim
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => <ItemDetail key={item.id} item={item} />)}
          </div>
        )}
      </div>
    </div>
  )
}
