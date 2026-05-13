// apps/user/app/api/ledger/[entryId]/route.ts
//
// PATCH  /api/ledger/:entryId   — update an existing ledger entry
// DELETE /api/ledger/:entryId   — delete a ledger entry
//
// Both operations verify the entry belongs to the authenticated user
// before proceeding.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ entryId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_PAY_METHODS = ['CASH', 'CARD', 'ONLINE_BANKING', 'EWALLET', 'OTHER'] as const

// ── PATCH ──────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { entryId } = await params
  if (!entryId) return err('VALIDATION_ERROR', 'entryId required.', 400)

  // Confirm entry belongs to this user
  const { data: existing } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return err('NOT_FOUND', 'Entry not found.', 404)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required.', 400)

  const {
    amount, entry_date, category, subcategory, description,
    is_tax_deductible, tax_category,
    income_source, payment_method, receipt_url,
  } = body

  // Validate any provided fields
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    return err('VALIDATION_ERROR', 'amount must be a positive number.', 400)
  }
  if (payment_method !== undefined && payment_method !== null &&
      !VALID_PAY_METHODS.includes(payment_method.toUpperCase())) {
    return err('VALIDATION_ERROR', 'Invalid payment_method.', 400)
  }

  // Build update payload — only include fields explicitly provided
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (amount       !== undefined) updates.amount       = Number(Number(amount).toFixed(2))
  if (entry_date   !== undefined) updates.entry_date   = entry_date.trim()
  if (category     !== undefined) updates.category     = category.trim()
  if (subcategory  !== undefined) updates.subcategory  = subcategory?.trim() || null
  if (description  !== undefined) updates.description  = description?.trim() || null
  if (is_tax_deductible !== undefined) updates.is_tax_deductible = is_tax_deductible === true
  if (tax_category !== undefined) updates.tax_category  = tax_category?.trim() || null
  if (income_source!== undefined) updates.income_source = income_source?.trim() || null
  if (payment_method!==undefined) updates.payment_method= payment_method ? payment_method.toUpperCase() : null
  if (receipt_url  !== undefined) updates.receipt_url   = receipt_url?.trim() || null

  const { data: updated, error } = await supabase
    .from('ledger_entries')
    .update(updates)
    .eq('id', entryId)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    console.error('[PATCH /api/ledger]', error.message)
    return err('SERVER_ERROR', 'Failed to update entry.', 500)
  }

  return NextResponse.json({ entry: updated })
}

// ── DELETE ─────────────────────────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { entryId } = await params
  if (!entryId) return err('VALIDATION_ERROR', 'entryId required.', 400)

  const { error } = await supabase
    .from('ledger_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[DELETE /api/ledger]', error.message)
    return err('SERVER_ERROR', 'Failed to delete entry.', 500)
  }

  return NextResponse.json({ success: true })
}
