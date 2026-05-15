// apps/user/app/api/commitments/route.ts
//
// GET  /api/commitments?year=&month=  — list commitments + current month payment status
// POST /api/commitments              — create a new recurring commitment
//
// spaceId is optional. If omitted, auto-resolves the user's PERSONAL space.
// year/month default to current month.

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_CATEGORIES = [
  'LOAN', 'MORTGAGE', 'RENTAL', 'UTILITIES',
  'INSURANCE', 'SUBSCRIPTION', 'EDUCATION', 'OTHER',
]

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)

  const now   = new Date()
  const year  = Number(searchParams.get('year')  ?? now.getFullYear())
  const month = Number(searchParams.get('month') ?? (now.getMonth() + 1))
  const activeOnly = searchParams.get('active') !== 'false'

  // Resolve space — use provided spaceId or auto-find PERSONAL space
  let spaceId = searchParams.get('spaceId')

  if (!spaceId) {
    const { data: personalSpace } = await supabase
      .from('spaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'PERSONAL')
      .maybeSingle()

    if (!personalSpace) return err('NOT_FOUND', 'Personal space not found', 404)
    spaceId = personalSpace.id
  } else {
    // Verify ownership of provided spaceId
    const { data: space } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', spaceId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!space) return err('NOT_FOUND', 'Space not found', 404)
  }

  // Fetch active commitments
  let query = supabase
    .from('commitments')
    .select('*')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .order('category')
    .order('due_day')

  if (activeOnly) query = query.eq('is_active', true)

  const { data: commitments, error: cErr } = await query
  if (cErr) return err('SERVER_ERROR', cErr.message, 500)
  if (!commitments || commitments.length === 0) {
    return NextResponse.json({ commitments: [], year, month, space_id: spaceId })
  }

  // Fetch payment records for the requested month in one batch query
  const ids = commitments.map((c) => c.id)
  const { data: payments, error: pErr } = await supabase
    .from('commitment_payments')
    .select('*')
    .in('commitment_id', ids)
    .eq('year', year)
    .eq('month', month)

  if (pErr) return err('SERVER_ERROR', pErr.message, 500)

  // Index payments by commitment_id for O(1) merge
  const paymentMap: Record<string, typeof payments[0]> = {}
  for (const p of payments ?? []) paymentMap[p.commitment_id] = p

  // Merge current_payment into each commitment
  const result = commitments.map((c) => ({
    ...c,
    current_payment: paymentMap[c.id] ?? null,
  }))

  return NextResponse.json({ commitments: result, year, month, space_id: spaceId })
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { name, amount, category, due_day, start_date, end_date, notes, is_tax_relief, tax_category } = body
  let { space_id } = body

  // Auto-resolve PERSONAL space if not provided
  if (!space_id) {
    const { data: personalSpace } = await supabase
      .from('spaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'PERSONAL')
      .maybeSingle()
    if (!personalSpace) return err('NOT_FOUND', 'Personal space not found', 404)
    space_id = personalSpace.id
  } else {
    const { data: space } = await supabase
      .from('spaces')
      .select('id')
      .eq('id', space_id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!space) return err('NOT_FOUND', 'Space not found', 404)
  }

  if (!name?.trim())  return err('VALIDATION_ERROR', 'name required', 400)
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return err('VALIDATION_ERROR', 'amount must be a positive number', 400)
  if (!category || !VALID_CATEGORIES.includes(category))
    return err('VALIDATION_ERROR', `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400)
  if (!due_day || Number(due_day) < 1 || Number(due_day) > 31)
    return err('VALIDATION_ERROR', 'due_day must be between 1 and 31', 400)
  if (!start_date)
    return err('VALIDATION_ERROR', 'start_date required (YYYY-MM-DD)', 400)

  const { data, error } = await supabase
    .from('commitments')
    .insert({
      user_id:    user.id,
      space_id,
      name:       name.trim(),
      amount:     Number(amount),
      category,
      due_day:    Number(due_day),
      start_date,
      end_date:       end_date || null,
      notes:          notes?.trim() || null,
      is_active:      true,
      is_tax_relief:  is_tax_relief === true,
      tax_category:   is_tax_relief ? (tax_category?.trim() || null) : null,
    })
    .select()
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)
  return NextResponse.json({ commitment: data }, { status: 201 })
}
