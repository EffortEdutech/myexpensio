// apps/user/app/api/spaces/[spaceId]/summary/route.ts
//
// GET /api/spaces/:spaceId/summary?month=5&year=2026
//
// Returns income total, expense total, net profit, and entry count
// for a given space in a given month+year.
// Defaults to the current month if month/year not provided.
//
// Used by: Personal dashboard, Business dashboard.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ spaceId: string }> }

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: NextRequest, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { spaceId } = await params
  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId required.', 400)

  // Confirm user owns this space
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type, name')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found.', 404)

  // Parse month / year from query params (default to current)
  const now = new Date()
  const { searchParams } = new URL(req.url)
  const month = Math.min(12, Math.max(1, Number(searchParams.get('month') ?? now.getMonth() + 1)))
  const year  = Number(searchParams.get('year') ?? now.getFullYear())

  // Date range for the month
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to   = new Date(year, month, 0).toISOString().slice(0, 10) // last day of month

  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('entry_type, amount')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .gte('entry_date', from)
    .lte('entry_date', to)

  if (error) {
    console.error('[GET /api/spaces/summary]', error.message)
    return err('SERVER_ERROR', 'Failed to load summary.', 500)
  }

  const income  = (entries ?? []).filter(e => e.entry_type === 'INCOME').reduce((s, e) => s + Number(e.amount), 0)
  const expense = (entries ?? []).filter(e => e.entry_type === 'EXPENSE').reduce((s, e) => s + Number(e.amount), 0)

  return NextResponse.json({
    space_id:      spaceId,
    space_type:    space.type,
    month,
    year,
    income:        Number(income.toFixed(2)),
    expense:       Number(expense.toFixed(2)),
    net:           Number((income - expense).toFixed(2)),
    entry_count:   (entries ?? []).length,
  })
}
