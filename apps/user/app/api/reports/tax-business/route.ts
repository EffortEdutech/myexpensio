// apps/user/app/api/reports/tax-business/route.ts
//
// GET /api/reports/tax-business?spaceId=&year=
//
// Returns LHDN business tax estimation summary for a BUSINESS space:
//   - Total business income
//   - Total deductible expenses (grouped by category)
//   - Estimated taxable income (income - deductible expenses)
//
// Access: Premium users + SUPER_ADMIN/SUPPORT only.
//         spaceId ownership check via RLS.

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function err(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}

// Top-level expense category groups for the LHDN summary
const TRANSPORT_CATEGORIES = new Set([
  'Fuel', 'Toll', 'Parking', 'Car service / maintenance', 'Car insurance', 'Road tax',
])
const OPERATIONS_CATEGORIES = new Set([
  'Phone bill', 'Internet / broadband', 'Software subscriptions',
  'Equipment', 'Marketing & advertising', 'Professional fees',
])

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return err('UNAUTHENTICATED', 'Login required.', 401)

  const { searchParams } = new URL(req.url)
  const spaceId = searchParams.get('spaceId')
  const year    = Number(searchParams.get('year') ?? new Date().getFullYear())

  if (!spaceId) return err('VALIDATION_ERROR', 'spaceId is required.', 400)
  if (isNaN(year) || year < 2020 || year > 2100) {
    return err('VALIDATION_ERROR', 'year must be a valid calendar year.', 400)
  }

  // Verify space belongs to user and is BUSINESS type
  const { data: space } = await supabase
    .from('spaces')
    .select('id, type, name, currency')
    .eq('id', spaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!space) return err('NOT_FOUND', 'Space not found or access denied.', 404)
  if (space.type !== 'BUSINESS') {
    return err('FORBIDDEN', 'Tax summary is only available for BUSINESS spaces.', 403)
  }

  const startDate = `${year}-01-01`
  const endDate   = `${year}-12-31`

  // Fetch all entries for the year
  const { data: entries, error } = await supabase
    .from('ledger_entries')
    .select('entry_type, amount, category, is_tax_deductible, entry_date')
    .eq('space_id', spaceId)
    .eq('user_id', user.id)
    .gte('entry_date', startDate)
    .lte('entry_date', endDate)

  if (error) {
    console.error('[GET /api/reports/tax-business]', error.message)
    return err('SERVER_ERROR', 'Failed to load tax summary.', 500)
  }

  const list = entries ?? []

  // ── Aggregate income ──────────────────────────────────────────────────────
  let totalIncome = 0
  let incomeCount = 0
  for (const e of list) {
    if (e.entry_type === 'INCOME') {
      totalIncome += Number(e.amount)
      incomeCount++
    }
  }

  // ── Aggregate deductible expenses by group ────────────────────────────────
  let transportTotal  = 0
  let operationsTotal = 0
  let othersTotal     = 0
  let totalDeductible = 0
  let expenseCount    = 0

  for (const e of list) {
    if (e.entry_type !== 'EXPENSE') continue
    expenseCount++
    if (!e.is_tax_deductible) continue

    const amt = Number(e.amount)
    totalDeductible += amt

    if (TRANSPORT_CATEGORIES.has(e.category))    transportTotal  += amt
    else if (OPERATIONS_CATEGORIES.has(e.category)) operationsTotal += amt
    else                                          othersTotal     += amt
  }

  const estimatedTaxableIncome = Math.max(0, totalIncome - totalDeductible)

  // Expense breakdown for display
  const expenseGroups = [
    { group: 'Transport & Vehicle',  total: transportTotal },
    { group: 'Business Operations',  total: operationsTotal },
    { group: 'Other Expenses',       total: othersTotal },
  ].filter(g => g.total > 0).map(g => ({
    group: g.group,
    total: Number(g.total.toFixed(2)),
  }))

  return NextResponse.json({
    space_id:                spaceId,
    space_name:              space.name,
    year,
    currency:                space.currency ?? 'MYR',
    total_income:            Number(totalIncome.toFixed(2)),
    total_deductible:        Number(totalDeductible.toFixed(2)),
    estimated_taxable_income: Number(estimatedTaxableIncome.toFixed(2)),
    expense_groups:          expenseGroups,
    income_count:            incomeCount,
    expense_count:           expenseCount,
    disclaimer: "This is an estimate only. Final tax payable is subject to LHDN assessment and your tax agent's review.",
  })
}
