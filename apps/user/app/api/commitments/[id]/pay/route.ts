// apps/user/app/api/commitments/[id]/pay/route.ts
//
// POST /api/commitments/[id]/pay
//
// Mark a specific month as PAID, PARTIAL, MISSED, or SKIPPED.
// Creates the commitment_payments row if it doesn't exist yet
// (lazy generation — rows are only created when the user interacts).
//
// Body: { year, month, status, paid_amount?, paid_date?, notes? }

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_STATUSES = ['PENDING', 'PAID', 'PARTIAL', 'MISSED', 'SKIPPED']

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

  // Verify the commitment belongs to this user
  const { data: commitment } = await supabase
    .from('commitments')
    .select('id, amount, due_day')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!commitment) return err('NOT_FOUND', 'Commitment not found', 404)

  // Calculate the due date for this month
  const dueDay    = Math.min(commitment.due_day, new Date(year, month, 0).getDate()) // cap at month end
  const dueDate   = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`

  const paymentRow = {
    commitment_id:   id,
    year:            Number(year),
    month:           Number(month),
    due_date:        dueDate,
    expected_amount: commitment.amount,
    status,
    paid_date:       paid_date || (status === 'PAID' || status === 'PARTIAL' ? new Date().toISOString().slice(0, 10) : null),
    paid_amount:     paid_amount != null ? Number(paid_amount) : (status === 'PAID' ? commitment.amount : null),
    notes:           notes?.trim() || null,
  }

  // Upsert — update if row exists for this month, insert if not
  const { data, error } = await supabase
    .from('commitment_payments')
    .upsert(paymentRow, { onConflict: 'commitment_id,year,month' })
    .select()
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({ payment: data })
}
