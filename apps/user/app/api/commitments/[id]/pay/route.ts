// apps/user/app/api/commitments/[id]/pay/route.ts
//
// POST /api/commitments/[id]/pay
//
// Mark a specific month as PAID, PARTIAL, MISSED, or SKIPPED.
//
// When status = PAID or PARTIAL:
//   • Auto-creates a ledger_entry in the user's PERSONAL space (no double-entry needed)
//   • Stores the ledger_entry_id in commitment_payments for linking
//   • If a ledger_entry_id already exists for this payment row, UPDATES that entry
//   • If commitment.is_tax_relief = true, marks the ledger entry as tax-deductible
//
// When status = MISSED or SKIPPED:
//   • If a linked ledger_entry exists, DELETES it (payment didn't happen)
//   • Clears ledger_entry_id
//
// Body: { year, month, status, paid_amount?, paid_date?, notes? }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'MISSED', 'SKIPPED']

// Maps commitment category → Personal expense category label
const CATEGORY_TO_EXPENSE: Record<string, string> = {
  LOAN:         'Personal Finance',
  MORTGAGE:     'Personal Finance',
  RENTAL:       'Housing & Rental',
  UTILITIES:    'Utilities & Bills',
  INSURANCE:    'Insurance',
  SUBSCRIPTION: 'Subscription',
  EDUCATION:    'Education',
  OTHER:        'Others',
}

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { year, month, status, paid_amount, paid_date, notes } = body

  if (!year || !month) return err('VALIDATION_ERROR', 'year and month required', 400)
  if (!status || !VALID_STATUSES.includes(status))
    return err('VALIDATION_ERROR', `status must be one of: ${VALID_STATUSES.join(', ')}`, 400)

  // ── Fetch commitment (verify ownership + get details for ledger entry) ──────
  const { data: commitment } = await supabase
    .from('commitments')
    .select('id, amount, due_day, category, name, space_id, is_tax_relief, tax_category')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!commitment) return err('NOT_FOUND', 'Commitment not found', 404)

  // ── Fetch PERSONAL space id ───────────────────────────────────────────────
  const { data: personalSpace } = await supabase
    .from('spaces')
    .select('id')
    .eq('user_id', user.id)
    .eq('type', 'PERSONAL')
    .maybeSingle()

  if (!personalSpace) return err('NOT_FOUND', 'Personal space not found', 404)

  // ── Calculate due date for this month ────────────────────────────────────
  const dueDay  = Math.min(commitment.due_day, new Date(year, month, 0).getDate())
  const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

  const effectivePaidDate   = paid_date || (
    (status === 'PAID' || status === 'PARTIAL') ? new Date().toISOString().slice(0, 10) : null
  )
  const effectivePaidAmount = paid_amount != null
    ? Number(paid_amount)
    : (status === 'PAID' ? commitment.amount : null)

  const paymentRow = {
    commitment_id:   id,
    year:            Number(year),
    month:           Number(month),
    due_date:        dueDate,
    expected_amount: commitment.amount,
    status,
    paid_date:       effectivePaidDate,
    paid_amount:     effectivePaidAmount,
    notes:           notes?.trim() || null,
  }

  // ── Upsert the commitment_payment row first (to get/create its id) ────────
  const { data: payment, error: payErr } = await supabase
    .from('commitment_payments')
    .upsert(paymentRow, { onConflict: 'commitment_id,year,month' })
    .select()
    .single()

  if (payErr || !payment) return err('SERVER_ERROR', payErr?.message ?? 'Upsert failed', 500)

  // ── Auto-manage linked ledger entry ──────────────────────────────────────

  let ledgerEntryId = payment.ledger_entry_id ?? null

  if (status === 'PAID' || status === 'PARTIAL') {
    // Entry date = paid date (or due date if not set)
    const entryDate   = effectivePaidDate ?? dueDate
    const entryAmount = effectivePaidAmount ?? commitment.amount
    const expenseCat  = CATEGORY_TO_EXPENSE[commitment.category] ?? 'Others'
    const description = `${commitment.name} — ${new Date(year, Number(month) - 1).toLocaleString('en-MY', { month: 'long', year: 'numeric' })}`

    const ledgerRow = {
      space_id:          personalSpace.id,
      user_id:           user.id,
      entry_type:        'EXPENSE',
      amount:            entryAmount,
      currency:          'MYR',
      entry_date:        entryDate,
      category:          expenseCat,
      description,
      is_tax_deductible: commitment.is_tax_relief === true,
      tax_category:      commitment.is_tax_relief ? (commitment.tax_category ?? null) : null,
      payment_method:    null,
    }

    if (ledgerEntryId) {
      // ── Update existing linked entry ──────────────────────────────────────
      const { error: updateErr } = await supabase
        .from('ledger_entries')
        .update({ ...ledgerRow, updated_at: new Date().toISOString() })
        .eq('id', ledgerEntryId)
        .eq('user_id', user.id)

      if (updateErr) console.error('[pay/auto-ledger update]', updateErr.message)
    } else {
      // ── Create new linked entry ───────────────────────────────────────────
      const { data: newEntry, error: insertErr } = await supabase
        .from('ledger_entries')
        .insert(ledgerRow)
        .select('id')
        .single()

      if (insertErr || !newEntry) {
        console.error('[pay/auto-ledger insert]', insertErr?.message)
      } else {
        ledgerEntryId = newEntry.id
        // Store link back in payment row
        await supabase
          .from('commitment_payments')
          .update({ ledger_entry_id: ledgerEntryId })
          .eq('id', payment.id)
      }
    }
  } else if (status === 'MISSED' || status === 'SKIPPED') {
    // ── Remove linked ledger entry if exists ────────────────────────────────
    if (ledgerEntryId) {
      await supabase
        .from('ledger_entries')
        .delete()
        .eq('id', ledgerEntryId)
        .eq('user_id', user.id)

      await supabase
        .from('commitment_payments')
        .update({ ledger_entry_id: null })
        .eq('id', payment.id)

      ledgerEntryId = null
    }
  }

  return NextResponse.json({
    payment: { ...payment, ledger_entry_id: ledgerEntryId },
  })
}
