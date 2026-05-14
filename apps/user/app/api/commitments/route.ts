// apps/user/app/api/commitments/route.ts
//
// GET  /api/commitments?spaceId=  — list all commitments for a space
// POST /api/commitments           — create a new recurring commitment

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

const VALID_CATEGORIES = [
  'LOAN', 'MORTGAGE', 'RENTAL', 'UTILITIES',
  'INSURANCE', 'SUBSCRIPTION', 'EDUCATION', 'OTHER',
]

// ── GET — list commitments for a space ───────────────────────────────────────

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const spaceId   = searchParams.get('spaceId')
  const activeOnly = searchParams.get('active') !== 'false' // default true

  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId required', 400)

  // Verify space belongs to user
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found', 404)

  let query = supabase
    .from('commitments')
    .select('*')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .order('category')
    .order('name')

  if (activeOnly) query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({ commitments: data ?? [] })
}

// ── POST — create a new commitment ───────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const body = await req.json().catch(() => null)
  if (!body) return err('VALIDATION_ERROR', 'Request body required', 400)

  const { space_id, name, amount, category, due_day, start_date, end_date, notes } = body

  if (!space_id)   return err('VALIDATION_ERROR', 'space_id required', 400)
  if (!name?.trim()) return err('VALIDATION_ERROR', 'name required', 400)
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
    return err('VALIDATION_ERROR', 'amount must be a positive number', 400)
  if (!category || !VALID_CATEGORIES.includes(category))
    return err('VALIDATION_ERROR', `category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400)
  if (!due_day || due_day < 1 || due_day > 31)
    return err('VALIDATION_ERROR', 'due_day must be between 1 and 31', 400)
  if (!start_date)
    return err('VALIDATION_ERROR', 'start_date required (YYYY-MM-DD)', 400)

  // Verify space belongs to user
  const { data: space } = await supabase
    .from('spaces')
    .select('id')
    .eq('id', space_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found', 404)

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
      end_date:   end_date || null,
      notes:      notes?.trim() || null,
      is_active:  true,
    })
    .select()
    .single()

  if (error) return err('SERVER_ERROR', error.message, 500)

  return NextResponse.json({ commitment: data }, { status: 201 })
}
