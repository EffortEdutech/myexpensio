// apps/user/app/api/sync/push/route.ts
//
// POST /api/sync/push
//
// Accepts an array of local mutations from the mobile app and applies them
// to Supabase. Returns accepted / rejected per item.
//
// Supported entity types:
//   claim, claim_item, trip, receipt, tng_statement_batch,
//   tng_transaction, export_job, ledger_entry, commitment, commitment_payment
//
// Rules:
//   - Validate JWT on every request
//   - Enforce user ownership — only allow writes to the authenticated user's data
//   - Treat items as idempotent by queue_id / entity_id
//   - Reject edits to submitted/approved claims

import { NextRequest, NextResponse } from 'next/server'
import { createClientForRequest } from '@/lib/supabase/api-client'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

type PushItem = {
  queue_id: string
  entity_type: string
  entity_id: string
  operation: 'create' | 'update' | 'delete'
  client_updated_at: string
  payload: Record<string, unknown>
}

type AcceptedItem = {
  queue_id: string
  entity_type: string
  entity_id: string
  server_updated_at: string
}

type RejectedItem = {
  queue_id: string
  entity_type: string
  entity_id: string
  code: string
  message: string
}

export async function POST(request: NextRequest) {
  const supabase = await createClientForRequest(request)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await request.json().catch(() => null)
  if (!body || !Array.isArray(body.items)) {
    return err('INVALID_REQUEST', 'items array required.', 400)
  }

  const items: PushItem[] = body.items
  const accepted: AcceptedItem[] = []
  const rejected: RejectedItem[] = []
  const serverNow = new Date().toISOString()

  for (const item of items) {
    try {
      await processItem(supabase, user.id, item, serverNow)
      accepted.push({
        queue_id: item.queue_id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        server_updated_at: serverNow,
      })
    } catch (err) {
      const isConflict = err instanceof SyncConflictError
      rejected.push({
        queue_id: item.queue_id,
        entity_type: item.entity_type,
        entity_id: item.entity_id,
        code: isConflict ? (err as SyncConflictError).code : 'PUSH_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ accepted, rejected })
}

class SyncConflictError extends Error {
  constructor(public code: string, message: string) {
    super(message)
  }
}

async function processItem(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  item: PushItem,
  serverNow: string
): Promise<void> {
  const p = item.payload

  switch (item.entity_type) {
    case 'claim': {
      if (item.operation === 'delete') {
        await supabase.from('claims').update({ deleted_at: serverNow, updated_at: serverNow })
          .eq('id', item.entity_id).eq('user_id', userId).eq('status', 'DRAFT')
        return
      }
      // Block edits to submitted+ claims
      if (item.operation === 'update') {
        const { data: existing } = await supabase.from('claims').select('status')
          .eq('id', item.entity_id).maybeSingle()
        if (existing && !['DRAFT', 'draft'].includes(existing.status)) {
          throw new SyncConflictError('CLAIM_LOCKED', 'Submitted claims cannot be edited.')
        }
      }
      await supabase.from('claims').upsert({
        id: item.entity_id,
        user_id: userId,
        title: p.title ?? null,
        status: (p.status as string)?.toUpperCase() ?? 'DRAFT',
        period_start: p.periodStart ?? null,
        period_end: p.periodEnd ?? null,
        currency: p.currency ?? 'MYR',
        submitted_at: p.submittedAt ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'claim_item': {
      if (item.operation === 'delete') {
        await supabase.from('claim_items').update({ deleted_at: serverNow, updated_at: serverNow })
          .eq('id', item.entity_id)
        return
      }
      await supabase.from('claim_items').upsert({
        id: item.entity_id,
        claim_id: p.claimId,
        type: (p.type as string)?.toUpperCase() ?? 'MISC',
        mode: p.mode ?? null,
        title: p.title ?? '',
        amount_cents: p.amountCents ?? 0,
        currency: p.currency ?? 'MYR',
        item_date: p.itemDate ?? new Date().toISOString().slice(0, 10),
        notes: p.notes ?? null,
        receipt_id: p.receiptId ?? null,
        trip_id: p.tripId ?? null,
        tng_transaction_id: p.tngTransactionId ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'trip': {
      if (item.operation === 'delete') {
        await supabase.from('trips').update({ deleted_at: serverNow, updated_at: serverNow })
          .eq('id', item.entity_id)
        return
      }
      await supabase.from('trips').upsert({
        id: item.entity_id,
        user_id: userId,
        claim_id: p.claimId ?? null,
        status: (p.status as string)?.toUpperCase() ?? 'DRAFT',
        started_at: p.startedAt ?? serverNow,
        stopped_at: p.stoppedAt ?? null,
        final_distance_m: p.finalDistanceM ?? null,
        distance_source: p.distanceSource ?? null,
        vehicle_type: p.vehicleType ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'tng_transaction': {
      await supabase.from('tng_transactions').upsert({
        id: item.entity_id,
        user_id: userId,
        trans_no: p.transNo ?? null,
        sector: p.sector ?? null,
        amount_cents: p.amountCents ?? 0,
        currency: p.currency ?? 'MYR',
        transaction_date: p.transactionDate ?? null,
        entry_location: p.entryLocation ?? null,
        exit_location: p.exitLocation ?? null,
        claimed: p.claimed ? 1 : 0,
        claim_item_id: p.claimItemId ?? null,
        link_status: p.linkStatus ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'tng_statement_batch': {
      await supabase.from('tng_statement_batches').upsert({
        id: item.entity_id,
        user_id: userId,
        label: p.label ?? null,
        source_file_name: p.sourceFileName ?? null,
        imported_at: p.importedAt ?? serverNow,
        transaction_count: p.transactionCount ?? 0,
        total_amount_cents: p.totalAmountCents ?? 0,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'ledger_entry': {
      if (item.operation === 'delete') {
        await supabase.from('ledger_entries').update({ deleted_at: serverNow, updated_at: serverNow })
          .eq('id', item.entity_id).eq('user_id', userId)
        return
      }
      await supabase.from('ledger_entries').upsert({
        id: item.entity_id,
        user_id: userId,
        space_type: p.spaceType ?? 'PERSONAL',
        entry_type: p.entryType ?? 'EXPENSE',
        amount_cents: p.amountCents ?? 0,
        currency: p.currency ?? 'MYR',
        entry_date: p.entryDate,
        category: p.category ?? 'Others',
        description: p.description ?? null,
        is_tax_deductible: p.isTaxDeductible ? true : false,
        tax_category: p.taxCategory ?? null,
        payment_method: p.paymentMethod ?? null,
        income_source: p.incomeSource ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'commitment': {
      if (item.operation === 'delete') {
        await supabase.from('commitments').update({ deleted_at: serverNow, updated_at: serverNow })
          .eq('id', item.entity_id).eq('user_id', userId)
        return
      }
      await supabase.from('commitments').upsert({
        id: item.entity_id,
        user_id: userId,
        name: p.name ?? '',
        amount_cents: p.amountCents ?? 0,
        currency: p.currency ?? 'MYR',
        category: p.category ?? 'OTHER',
        due_day: p.dueDay ?? 1,
        start_date: p.startDate,
        end_date: p.endDate ?? null,
        is_active: p.isActive !== false,
        notes: p.notes ?? null,
        is_tax_relief: p.isTaxRelief ? true : false,
        tax_category: p.taxCategory ?? null,
        updated_at: serverNow,
        deleted_at: p.deletedAt ?? null,
      }, { onConflict: 'id' })
      break
    }

    case 'commitment_payment': {
      await supabase.from('commitment_payments').upsert({
        id: item.entity_id,
        commitment_id: p.commitmentId,
        year: p.year,
        month: p.month,
        due_date: p.dueDate,
        expected_amount_cents: p.expectedAmountCents ?? 0,
        status: (p.status as string)?.toUpperCase() ?? 'PENDING',
        paid_date: p.paidDate ?? null,
        paid_amount_cents: p.paidAmountCents ?? null,
        notes: p.notes ?? null,
        updated_at: serverNow,
      }, { onConflict: 'id' })
      break
    }

    case 'export_job':
    case 'receipt':
    case 'expense':
      // Acknowledged but not persisted server-side yet (Sprint 13)
      break

    default:
      throw new Error(`Unknown entity type: ${item.entity_type}`)
  }
}
