// apps/user/app/api/commitments/[id]/route.ts
//
// GET    /api/commitments/[id]  — get single commitment + payment history
// PATCH  /api/commitments/[id]  — update commitment details
// DELETE /api/commitments/[id]  — soft-delete (set is_active = false)

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_CATEGORIES = [
  'LOAN', 'MORTGAGE', 'RENTAL', 'UTILITIES',
  'INSURANCE', 'SUBSCRIPTION', 'EDUCATION', 'OTHER',
]

// ── GET — commitment + 12 months of payment history ──────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { id } = await params

  const { data: commitment, error } = await supabase
    .from('commitments')
    .select(`
      *,
      commitment_payments (
        id, year, month, due_date, expected_amount,
        status, paid_date, paid_amount, notes
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !commitment) return err('NOT_FOUND', 'Commitment not found', 404)

  // Sort payments by year desc, month desc
  const payments = (commitment.commitment_payments ?? []).sort(
    (a: { year: number; month: number }, b: { year: number; month: number }) =>
      b.year !== a.year ? b.year - a.year : b.month - a.month
  )

  return NextResponse.json({ commitment: { ...commitment, commitment_payments: payments } })
}

// ── PATCH — update commitment ─────────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  // Verify ownership
  const { data: existing } = await supabase
    .from('commitments')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return err('NOT_FOUND', 'Commitment not found', 404)

  const patch: Record<string, unknown> = {}

  if (body.name                 !== undefined) patch.name                  = body.name?.trim() || null
  if (body.amount               !== undefined) patch.amount                 = Number(body.amount)
  if (body.due_day              !== undefined) patch.due_day                = Number(body.due_day)
  if (body.end_date             !== undefined) patch.end_date               = body.end_date || null
  if (body.notes                !== undefined) patch.notes                  = body.notes?.trim() || null
  if (body.is_active            !== undefined) patch.is_active              = Boolean(body.is_active)
  if (body.is_tax_relief        !== undefined) patch.is_tax_relief          = Boolean(body.is_tax_relief)
  if (body.tax_category         !== undefined) patch.tax_category           = body.tax_category?.trim() || null
  if (body.document_url         !== undefined) patch.document_url           = body.document_url?.trim() || null
  if (body.document_storage_path !== undefined) patch.document_storage_path = body.document_storage_path?.trim() || null
  if (body.category  !== undefined) {
    if (!VALID_CATEGORIES.includes(body.category))
      return err('VALIDATION_ERROR', `Invalid category`, 400)
    patch.category = body.category
  }

  if (Object.keys(patch).length === 0)
    return err('VALIDATION_ERROR', 'Nothing to update', 400)

  const { data, error } = await supabase
    .from('commitments')
    .update(patch)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({ commitment: data })
}

// ── DELETE — soft-delete (deactivate) ────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { id } = await params

  const { error } = await supabase
    .from('commitments')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({ success: true })
}
