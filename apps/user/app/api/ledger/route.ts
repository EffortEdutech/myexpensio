// apps/user/app/api/ledger/route.ts
//
// GET  /api/ledger?spaceId=&month=&year=&type=EXPENSE|INCOME&limit=&offset=
//      List ledger entries for a space. Validates space ownership.
//
// POST /api/ledger
//      Create a new ledger entry (expense or income).
//      Body: { spaceId, entry_type, amount, entry_date, category,
//              subcategory?, description?, is_tax_deductible?, tax_category?,
//              income_source?, payment_method?, receipt_url? }

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_ENTRY_TYPES   = ['EXPENSE', 'INCOME'] as const
const VALID_PAY_METHODS   = ['CASH', 'CARD', 'ONLINE_BANKING', 'EWALLET', 'OTHER'] as const
const PERSONAL_TAX_CATS   = [
  'LIFESTYLE', 'MEDICAL', 'EDUCATION', 'LIFE_INSURANCE_EPF',
  'BOOKS', 'DISABILITY_EQUIPMENT', 'OTHER',
] as const

// ── GET ────────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const spaceId   = searchParams.get('spaceId')?.trim()
  const entryType = searchParams.get('type')?.trim().toUpperCase() || null
  const limit     = Math.min(100, Math.max(1, Number(searchParams.get('limit')  ?? 50)))
  const offset    = Math.max(0, Number(searchParams.get('offset') ?? 0))

  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId is required.', 400)

  // Confirm user owns this space
  const { data: space } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!space) return err('NOT_FOUND', 'Space not found.', 404)

  // Optional month/year filter
  const now   = new Date()
  const month = searchParams.get('month') ? Number(searchParams.get('month')) : null
  const year  = searchParams.get('year')  ? Number(searchParams.get('year'))  : null

  let query = supabase
    .from('ledger_entries')
    .select('*', { count: 'exact' })
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entryType && VALID_ENTRY_TYPES.includes(entryType as typeof VALID_ENTRY_TYPES[number])) {
    query = query.eq('entry_type', entryType)
  }
  if (month && year) {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to   = new Date(year, month, 0).toISOString().slice(0, 10)
    query = query.gte('entry_date', from).lte('entry_date', to)
  } else if (year) {
    query = query.gte('entry_date', `${year}-01-01`).lte('entry_date', `${year}-12-31`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/ledger]', error.message)
    return err('SERVER_ERROR', 'Failed to load ledger entries.', 500)
  }

  return NextResponse.json({ entries: data ?? [], total: count ?? 0, limit, offset })
}

// ── POST ───────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required.', 400)

  const {
    spaceId, entry_type, amount, entry_date, category,
    subcategory, description,
    is_tax_deductible, tax_category,
    income_source, payment_method,
    receipt_url,
  } = body

  // Required field validation
  if (!spaceId?.trim())    return err('VALIDATION_ERROR', 'spaceId is required.', 400)
  if (!entry_type?.trim()) return err('VALIDATION_ERROR', 'entry_type is required (EXPENSE or INCOME).', 400)
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
                           return err('VALIDATION_ERROR', 'amount must be a positive number.', 400)
  if (!entry_date?.trim()) return err('VALIDATION_ERROR', 'entry_date is required (YYYY-MM-DD).', 400)
  if (!category?.trim())   return err('VALIDATION_ERROR', 'category is required.', 400)

  if (!VALID_ENTRY_TYPES.includes(entry_type.toUpperCase())) {
    return err('VALIDATION_ERROR', 'entry_type must be EXPENSE or INCOME.', 400)
  }
  if (payment_method && !VALID_PAY_METHODS.includes(payment_method.toUpperCase())) {
    return err('VALIDATION_ERROR', 'Invalid payment_method.', 400)
  }

  // Confirm user owns the space
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()
  if (!space) return err('NOT_FOUND', 'Space not found.', 404)

  // INCOME only allowed in BUSINESS space (PERSONAL income = future phase)
  if (entry_type.toUpperCase() === 'INCOME' && space.type !== 'BUSINESS') {
    return err('VALIDATION_ERROR', 'Income entries are only supported in the Business space.', 400)
  }

  const { data: created, error: insertError } = await supabase
    .from('ledger_entries')
    .insert({
      space_id:          spaceId,
      user_id:           user.id,
      entry_type:        entry_type.toUpperCase(),
      amount:            Number(Number(amount).toFixed(2)),
      currency:          'MYR',
      entry_date:        entry_date.trim(),
      category:          category.trim(),
      subcategory:       subcategory?.trim()    || null,
      description:       description?.trim()    || null,
      is_tax_deductible: is_tax_deductible === true,
      tax_category:      tax_category?.trim()   || null,
      income_source:     income_source?.trim()  || null,
      payment_method:    payment_method?.toUpperCase() || null,
      receipt_url:       receipt_url?.trim()    || null,
    })
    .select('*')
    .single()

  if (insertError || !created) {
    console.error('[POST /api/ledger]', insertError?.message)
    return err('SERVER_ERROR', 'Failed to create ledger entry.', 500)
  }

  return NextResponse.json({ entry: created }, { status: 201 })
}
