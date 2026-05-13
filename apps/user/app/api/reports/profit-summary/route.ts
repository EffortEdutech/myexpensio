// apps/user/app/api/reports/profit-summary/route.ts
//
// GET /api/reports/profit-summary?spaceId=&month=&year=
//
// Returns monthly profit snapshot for a BUSINESS space:
//   { income, expense, net, entry_count, income_count, expense_count }
//
// Also returns trailing 12-month array for the annual chart:
//   monthly: [{ month, year, income, expense, net }, ...]
//
// Access: Premium users + SUPER_ADMIN/SUPPORT only (BUSINESS space).
//         The spaceId ownership check implicitly enforces this via RLS.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const spaceId = searchParams.get('spaceId')
  const month   = Number(searchParams.get('month') ?? new Date().getMonth() + 1)
  const year    = Number(searchParams.get('year')  ?? new Date().getFullYear())

  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId is required.', 400)
  if (isNaN(month) || month < 1 || month > 12) return err('VALIDATION_ERROR', 'month must be 1–12.', 400)
  if (isNaN(year)  || year < 2020 || year > 2100) return err('VALIDATION_ERROR', 'year must be a valid calendar year.', 400)

  // Verify space belongs to user and is BUSINESS type
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found or access denied.', 404)
  if (space.type !== 'BUSINESS') return err('FORBIDDEN', 'Profit summary is only available for BUSINESS spaces.', 403)

  // ── Current month snapshot ────────────────────────────────────────────────
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate   = new Date(year, month, 0).toISOString().slice(0, 10) // last day of month

  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('entry_type, amount')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)

  if (error) {
    console.error('[GET /api/reports/profit-summary]', error.message)
    return err('SERVER_ERROR', 'Failed to load profit summary.', 500)
  }

  let income  = 0
  let expense = 0
  let incomeCount  = 0
  let expenseCount = 0

  for (const e of entries ?? []) {
    const amt = Number(e.amount)
    if (e.entry_type === 'INCOME') { income  += amt; incomeCount++ }
    else                            { expense += amt; expenseCount++ }
  }

  const net = income - expense

  // ── Trailing 12 months for annual chart ───────────────────────────────────
  const monthly: { month: number; year: number; income: number; expense: number; net: number }[] = []

  for (let i = 11; i >= 0; i--) {
    const d    = new Date(year, month - 1 - i, 1)
    const m    = d.getMonth() + 1
    const y    = d.getFullYear()
    const mStr = String(m).padStart(2, '0')
    const mStart = `${y}-${mStr}-01`
    const mEnd   = new Date(y, m, 0).toISOString().slice(0, 10)

    const { data: mEntries } = await supabase
      .from('ledger_entries')
      .select('entry_type, amount')
      .eq('space_id', spaceId)
      .eq('user_id', user.id)
      .gte('entry_date', mStart)
      .lte('entry_date', mEnd)

    let mIncome = 0, mExpense = 0
    for (const e of mEntries ?? []) {
      if (e.entry_type === 'INCOME') mIncome  += Number(e.amount)
      else                           mExpense += Number(e.amount)
    }

    monthly.push({
      month: m,
      year:  y,
      income:  Number(mIncome.toFixed(2)),
      expense: Number(mExpense.toFixed(2)),
      net:     Number((mIncome - mExpense).toFixed(2)),
    })
  }

  return NextResponse.json({
    space_id:      spaceId,
    month,
    year,
    income:        Number(income.toFixed(2)),
    expense:       Number(expense.toFixed(2)),
    net:           Number(net.toFixed(2)),
    income_count:  incomeCount,
    expense_count: expenseCount,
    entry_count:   incomeCount + expenseCount,
    monthly,
  })
}
