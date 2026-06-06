// apps/user/app/api/sync/pull/route.ts
//
// GET /api/sync/pull?cursor=<ISO_timestamp>
//
// Returns all changes (for the authenticated user) updated after `cursor`.
// If no cursor, returns all records (full sync).
//
// Response:
//   {
//     cursor: string,          // new cursor to use next time
//     changes: PullSyncChange[]
//   }
//
// Change shape:
//   { entity_type, entity_id, operation, server_updated_at, payload }

import { NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type PullChange = {
  entity_type: string
  entity_id: string
  operation: 'upsert' | 'delete'
  server_updated_at: string
  payload: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  const supabase = await createClientForRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const cursor = new URL(request.url).searchParams.get('cursor')
  const since = cursor ?? '1970-01-01T00:00:00.000Z'
  const serverNow = new Date().toISOString()
  const changes: PullChange[] = []

  // ── Claims ──────────────────────────────────────────────────────────────────
  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(200)

  for (const claim of claims ?? []) {
    changes.push({
      entity_type: 'claim',
      entity_id: claim.id,
      operation: claim.deleted_at ? 'delete' : 'upsert',
      server_updated_at: claim.updated_at,
      payload: claim,
    })
  }

  // ── Claim items ─────────────────────────────────────────────────────────────
  const { data: claimItems } = await supabase
    .from('claim_items')
    .select('*, claims!inner(user_id)')
    .eq('claims.user_id', user.id)
    .gt('claim_items.updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(500)

  for (const item of claimItems ?? []) {
    changes.push({
      entity_type: 'claim_item',
      entity_id: item.id,
      operation: item.deleted_at ? 'delete' : 'upsert',
      server_updated_at: item.updated_at,
      payload: item,
    })
  }

  // ── Trips ──────────────────────────────────────────────────────────────────
  const { data: trips } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(200)

  for (const trip of trips ?? []) {
    changes.push({
      entity_type: 'trip',
      entity_id: trip.id,
      operation: trip.deleted_at ? 'delete' : 'upsert',
      server_updated_at: trip.updated_at,
      payload: trip,
    })
  }

  // ── TNG transactions ────────────────────────────────────────────────────────
  const { data: tngTxns } = await supabase
    .from('tng_transactions')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(500)

  for (const txn of tngTxns ?? []) {
    changes.push({
      entity_type: 'tng_transaction',
      entity_id: txn.id,
      operation: txn.deleted_at ? 'delete' : 'upsert',
      server_updated_at: txn.updated_at,
      payload: txn,
    })
  }

  // ── Ledger entries ──────────────────────────────────────────────────────────
  const { data: ledgerEntries } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(500)

  for (const entry of ledgerEntries ?? []) {
    changes.push({
      entity_type: 'ledger_entry',
      entity_id: entry.id,
      operation: entry.deleted_at ? 'delete' : 'upsert',
      server_updated_at: entry.updated_at,
      payload: { ...entry, spaceType: entry.space_type, entryType: entry.entry_type },
    })
  }

  // ── Commitments ─────────────────────────────────────────────────────────────
  const { data: commitments } = await supabase
    .from('commitments')
    .select('*')
    .eq('user_id', user.id)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(200)

  for (const commitment of commitments ?? []) {
    changes.push({
      entity_type: 'commitment',
      entity_id: commitment.id,
      operation: commitment.deleted_at ? 'delete' : 'upsert',
      server_updated_at: commitment.updated_at,
      payload: commitment,
    })
  }

  // ── Subscription ─────────────────────────────────────────────────────────────
  // Always included — not cursor-filtered — so tier changes reach the device
  // on every pull regardless of when the subscription was last updated.
  // Remap entity_type/entity_id → owner_type/owner_id and lowercase status
  // for mobile backward-compat.
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, entity_type, entity_id, tier, status, current_period_end, seat_count, updated_at')
    .eq('entity_type', 'USER')
    .eq('entity_id', user.id)
    .maybeSingle()

  if (subscription) {
    changes.push({
      entity_type: 'subscription',
      entity_id: subscription.id,
      operation: 'upsert',
      server_updated_at: subscription.updated_at ?? serverNow,
      payload: {
        ...subscription,
        owner_type: subscription.entity_type.toLowerCase(),
        owner_id:   subscription.entity_id,
        status:     subscription.status.toLowerCase(),
      },
    })
  }

  return NextResponse.json({
    cursor: serverNow,
    changes,
  })
}
